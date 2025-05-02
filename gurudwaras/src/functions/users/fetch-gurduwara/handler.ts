import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
const dynamodb = new DynamoDBClient({region: 'eu-north-1'});
const GurduwaraList = process.env.GURDUWARA_LIST_DB;

const fetchGurduwaraList: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    try {
        const params = {
            TableName: GurduwaraList, 
        }
        const data = await dynamodb.send(new ScanCommand(params));
        return formatJSONResponse({
            statusCode: 200,
            data: data,
            message: "Gurduwar Fetched Succesfully",
        })
    } catch (error) {
        return formatJSONResponse({
            message: error,
            statusCode: 500,
        })
    }
}
export const main = middyfy(fetchGurduwaraList);