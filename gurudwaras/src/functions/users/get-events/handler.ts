import { APIGatewayProxyHandler, APIGatewayEvent } from "aws-lambda";
import { formatJSONResponse, formatJSONErrorResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
const region = process.env.GURUDWARA_AWS_REGION
const client = new DynamoDBClient({ region});
const dynamodb = DynamoDBDocumentClient.from(client);

const EventTable = process.env.GURUDWARA_EVENTS_DB as string;

const getAllEvents: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const scanParams = {
      TableName: EventTable
    };

    const result = await dynamodb.send(new ScanCommand(scanParams));

    return formatJSONResponse({
      statusCode: 200,
      message: "All events fetched successfully.",
      data: result.Items || []
    });

  } catch (error: any) {
    console.error("Error fetching all events:", error);
    return formatJSONErrorResponse({
      statusCode: 500,
      message: error.message || "Internal Server Error"
    });
  }
};

export const main = middyfy(getAllEvents);
