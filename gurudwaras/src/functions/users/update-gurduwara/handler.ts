import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
const dynamodb = new DynamoDBClient({region: 'eu-north-1'});
const GurduwaraList = process.env.GURDUWARA_LIST_DB;

const updateGurduwaraById: APIGatewayProxyHandler = async (event: APIGatewayEvent) =>{
    try {
        
    } catch (error) {
        return formatJSONResponse({
            message: error,
            statusCode: 500,
        })
    }
}

export const main = middyfy(updateGurduwaraById);