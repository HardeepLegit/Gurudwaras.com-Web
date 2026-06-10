import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.GURUDWARA_AWS_REGION;
const client = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(client);
const GurduwaraList = process.env.GURUDWARA_DB;

const DEFAULT_PAGE_SIZE = 100;

const fetchGurduwaraList: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const lang = event.pathParameters?.lang || "eng";
    const queryParams = event.queryStringParameters || {};

    const limit = Math.min(parseInt(queryParams.limit || String(DEFAULT_PAGE_SIZE), 10), 200);

    // Decode the cursor passed by the client into a DynamoDB ExclusiveStartKey.
    // The client receives `nextKey` (base64) from a prior response and passes it
    // back as the `lastKey` query param to continue from where it left off.
    let exclusiveStartKey: Record<string, any> | undefined;
    if (queryParams.lastKey) {
      try {
        exclusiveStartKey = JSON.parse(Buffer.from(queryParams.lastKey, "base64").toString("utf-8"));
      } catch {
        return formatJSONResponse({ statusCode: 400, success: false, message: "Invalid lastKey" });
      }
    }

    const [data, tableInfo] = await Promise.all([
      dynamodb.send(
        new ScanCommand({
          TableName: GurduwaraList,
          Limit: limit,
          ExclusiveStartKey: exclusiveStartKey,
        })
      ),
      // ItemCount is updated every ~6 hours by AWS — suitable for display purposes.
      client.send(new DescribeTableCommand({ TableName: GurduwaraList })),
    ]);

    const getTranslatedValue = (field: any): string => {
      if (typeof field === "object" && field !== null) {
        return field?.[lang] || field?.[Object.keys(field).find((key) => field[key])] || "";
      }
      return field ?? "";
    };

    const enrichedResponse = (data.Items || []).map((item) => {
      item.name = getTranslatedValue(item.name);
      item.address = getTranslatedValue(item.address);
      item.city = getTranslatedValue(item.city);
      item.state = getTranslatedValue(item.state);
      item.country = getTranslatedValue(item.country);
      item.additionalInfo = getTranslatedValue(item.additionalInfo);
      item.upcomingEvents = [];
      return item;
    });

    // Encode the DynamoDB continuation key so the client can pass it back opaquely.
    const nextKey = data.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString("base64")
      : null;

    const totalCount = tableInfo.Table?.ItemCount ?? 0;

    return formatJSONResponse({
      statusCode: 200,
      data: enrichedResponse,
      nextKey,
      totalCount,
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
