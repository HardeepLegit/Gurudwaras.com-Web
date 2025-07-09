import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  ScanCommand,
  QueryCommand,
  DynamoDBDocumentClient
} from "@aws-sdk/lib-dynamodb";
const region = process.env.GURUDWARA_AWS_REGION
const client = new DynamoDBClient({ region});
const dynamodb = DynamoDBDocumentClient.from(client);

const GurduwaraList = process.env.GURUDWARA_DB;
const EventsTable = process.env.GURUDWARA_EVENTS_DB;
const GurudwaraEventIndex = process.env.GURUDWARA_EVENT_INDEX;

const fetchGurduwaraList: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const lang = event.pathParameters?.lang || "eng"; // Default to English
    const today = new Date().toISOString();
    console.log("Language:", today);
    const scanParams = { TableName: GurduwaraList };
    const data = await dynamodb.send(new ScanCommand(scanParams));

    let response = data.Items || [];

    const getTranslatedValue = (field) => {
      if (typeof field === "object" && field !== null) {
        return field?.[lang] || field?.[Object.keys(field).find((key) => field[key])] || "";
      }
      return field;
    };

    const enrichedResponse = await Promise.all(
      response.map(async (item) => {
        // Translate
        item.name = getTranslatedValue(item.name);
        item.address = getTranslatedValue(item.address);
        item.city = getTranslatedValue(item.city);
        item.state = getTranslatedValue(item.state);
        item.country = getTranslatedValue(item.country);
        item.additionalInfo = getTranslatedValue(item.additionalInfo);

        // Query upcoming events
        try {
          const eventsResult = await dynamodb.send(
            new QueryCommand({
              TableName: EventsTable,
              IndexName: GurudwaraEventIndex, // ⚠️ You must have this GSI
              KeyConditionExpression: "gurudwaraId = :gId AND startDate >= :today",
              ExpressionAttributeValues: {
                ":gId": item.id,
                ":today": today
              }
            })
          );
          item.upcomingEvents = eventsResult.Items || [];
        } catch (err) {
          console.error(`Failed to fetch events for gurudwaraId: ${item.id}`, err);
          item.upcomingEvents = [];
        }

        return item;
      })
    );

    return formatJSONResponse({
      statusCode: 200,
      data: enrichedResponse,
      success: true,
      message: "Gurduwara list fetched successfully"
    });

  } catch (error: any) {
    console.error("Error in fetchGurduwaraList:", error);
    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: error.message || "Something went wrong"
    });
  }
};

export const main = middyfy(fetchGurduwaraList);
