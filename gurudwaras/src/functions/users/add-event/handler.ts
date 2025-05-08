import { APIGatewayProxyHandler, APIGatewayEvent } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import { formatJSONErrorResponse, formatJSONResponse } from '@libs/api-gateway';
import { DynamoDB, UpdateItemCommand} from '@aws-sdk/client-dynamodb';
const dynamodb = new DynamoDB({region: 'eu-north-1'})
const GurduwaraList = process.env.GURDUWARA_LIST_DB;
const addEventInGurduwara: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    try {
        const id = event.pathParameters?.gurduwara_id;
        const body = typeof event.body == "string" ? JSON.parse(event.body) : event.body;
        console.log("Body ---", body);
        const { title } = body;
        console.log("Title ---", title);
        if(!id){
           return formatJSONResponse({
                statusCode: 400,
                message: "Missing required  Path Parameter"
            })
        }
        const eventObject = {
            S : title
        }
        console.log("Event Object")
        const params = {
            TableName: GurduwaraList,
            Key: {
                id: {S:id},
            },
            UpdateExpression: "SET upcomingEvents = list_append(if_not_exists(upcomingEvents, :emptyList), :newEvent)",
            ExpressionAttributeValues: {
                ":newEvent": {L: [eventObject]},
                ":emptyList": {L: []}
            },
            ReturnValues: "UPDATED_NEW"
        }
        const result = await dynamodb.send(new UpdateItemCommand(params));
        console.log("Result ---", result);
        return formatJSONResponse({
            statusCode: 200,
            message: "Event added Succesfully",
            data: result
        })
    } catch (error) {
        console.log("Error ---", error);
        return formatJSONErrorResponse({
            statusCode: 500,
            message: error.message
        })
    }
}
export const main = middyfy(addEventInGurduwara);