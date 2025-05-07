import { APIGatewayProxyHandler,APIGatewayEvent } from 'aws-lambda';
import { formatJSONResponse,formatJSONErrorResponse } from "@libs/api-gateway";
import { DeleteItemCommand, DynamoDB } from '@aws-sdk/client-dynamodb';
const dynamoDb = new DynamoDB({region: 'eu-north-1'})
import { middyfy } from "@libs/lambda";
const GurduwaraList = process.env.GURDUWARA_LIST_DB;
const deleteGurduwaraById: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    try {
        const id = event.queryStringParameters?.id;
        const params = {
            TableName: GurduwaraList,
            Key: {
                id: {S: id}
            },
            ReturnValues: "ALL_OLD"
        }
        console.log("Params ---",params);
        const command = new DeleteItemCommand(params);
        const result = await dynamoDb.send(command);
        console.log("Result ---", result);
        return formatJSONResponse({
            message: "Gurduwara Deleted Successfully",
            statusCode: 200,
            data: result,
            success: true
        })
    } catch (error) {
        return formatJSONErrorResponse({
            message: error,
            statusCode: 500,
            data: null
        })
    }
}

export const main = middyfy(deleteGurduwaraById);