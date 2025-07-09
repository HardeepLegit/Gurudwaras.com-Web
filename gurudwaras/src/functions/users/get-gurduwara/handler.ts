import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
const region = process.env.GURUDWARA_AWS_REGION
const client = new DynamoDBClient({region});
const dynamodb = DynamoDBDocumentClient.from(client);
const GurduwaraList = process.env.GURUDWARA_DB;
const EventsTable = process.env.GURUDWARA_EVENTS_DB;
const getGurduwaraById: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    try {
        const { id } = event.pathParameters;
        console.log("ID", id);
        const params = {
            TableName: GurduwaraList,
            Key: {
                id: id
            }
        }
        const result = await dynamodb.send(new GetCommand(params));
        console.log("Params", params);
        const today = new Date().toISOString().split("T")[0];

    // Step 3: Query upcoming events for this Gurudwara
        const eventsResult = await dynamodb.send(
        new QueryCommand({
            TableName: EventsTable,
            IndexName: "startDate-event-index", // ⚠️ Make sure this GSI exists
            KeyConditionExpression: "gurudwaraId = :gId AND startDate >= :today",
            ExpressionAttributeValues: {
            ":gId": id,
            ":today": today
            }
        })
        );

        const upcomingEvents = eventsResult.Items || [];

        return formatJSONResponse({
                statusCode: 200,
                data: result.Item ? { ...result.Item, upcomingEvents:upcomingEvents } : {},
                success: true,
                message: "Gurduwara Fetched Succesfully"
            });    
    } catch (error) {
        console.log("Error", error);
        return formatJSONResponse({
            statusCode: 500,
            message: error.message
        })
    }
}

export const main = middyfy(getGurduwaraById);