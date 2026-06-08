import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.GURUDWARA_AWS_REGION;
const client = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(client);
const GurduwaraList = process.env.GURUDWARA_DB;

const fetchGurduwaraList: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const lang = event.pathParameters?.lang || "eng";

    // Paginate through all DynamoDB pages — Scan returns max 1MB per call.
    // Without this loop, entries beyond the first page are silently dropped,
    // causing the API to return fewer Gurudwaras than exist in the table.
    const allItems: Record<string, any>[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined = undefined;

    do {
      const data = await dynamodb.send(
        new ScanCommand({
          TableName: GurduwaraList,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );
      allItems.push(...(data.Items || []));
      lastEvaluatedKey = data.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const getTranslatedValue = (field: any): string => {
      if (typeof field === "object" && field !== null) {
        return field?.[lang] || field?.[Object.keys(field).find((key) => field[key])] || "";
      }
      return field ?? "";
    };

    const enrichedResponse = allItems.map((item) => {
      item.name = getTranslatedValue(item.name);
      item.address = getTranslatedValue(item.address);
      item.city = getTranslatedValue(item.city);
      item.state = getTranslatedValue(item.state);
      item.country = getTranslatedValue(item.country);
      item.additionalInfo = getTranslatedValue(item.additionalInfo);
      // Events are not fetched on the list endpoint — use GET /gurduwara/{id}
      // for full detail with upcoming events. Querying events per item caused
      // N parallel DynamoDB calls that regularly hit the Lambda timeout.
      item.upcomingEvents = [];
      return item;
    });

    return formatJSONResponse({
      statusCode: 200,
      data: enrichedResponse,
      success: true,
      message: "Gurduwara list fetched successfully",
    });
  } catch (error: any) {
    console.error("Error in fetchGurduwaraList:", error);
    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const main = middyfy(fetchGurduwaraList);
