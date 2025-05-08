import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { DynamoDB } from 'aws-sdk';
const dynamoDb = new DynamoDB.DocumentClient();
const GurduwaraList = process.env.GURDUWARA_LIST_DB;
const getGurduwaraById: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    try {
        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        const { id } = body;
        console.log("ID", id);
        const params = {
            TableName: GurduwaraList,
            Key: {
                id: id
            }
        }
        const result = await dynamoDb.get(params).promise();
        console.log("Params", params);
        return formatJSONResponse({
            statusCode: 200,
            data: result,
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