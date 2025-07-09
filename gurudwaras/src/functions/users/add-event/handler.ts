import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
// import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { eventSchema } from "../../../Schema/gurudwaras"; // Ensure correct import path

const region = process.env.GURUDWARA_AWS_REGION;
const GURUDWARA_EVENTS_TABLE = process.env.GURUDWARA_EVENTS_DB as string;

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const addEvent: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const rawBody = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const eventPayload = {
      ...rawBody,
      id: uuidv4(),
    };
    console.log("Received Gurudwara ID:", eventPayload);
    const validation = eventSchema.safeParse(eventPayload);
    if (!validation.success) {
      return formatJSONResponse({
        statusCode: 400,
        success: false,
        message: "Validation failed",

      });
    }
    console.log("Validated Event Payload:", JSON.stringify(validation.data, null, 2));
    const command = new PutCommand({
      TableName: GURUDWARA_EVENTS_TABLE,
      Item: validation.data,
    });

    await ddbClient.send(command);

    return formatJSONResponse({
      statusCode: 200,
      success: true,
      message: "Event added successfully",
      data: eventPayload,
    });
  } catch (error: any) {
    console.error("Error adding event:", {
      message: error.message,
      stack: error.stack,
    });

    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: "Internal server error while adding event",
    });
  }
};

export const main = middyfy(addEvent);
