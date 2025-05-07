import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand,DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({region: 'eu-north-1'});
const dynamodb = DynamoDBDocumentClient.from(client);
const GurduwaraList = process.env.GURDUWARA_LIST_DB;

const fetchGurduwaraList: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    try {
        const params = {
            TableName: GurduwaraList, 
        }
        const data = await dynamodb.send(new ScanCommand(params));
        // console.log("Data", data);
        return formatJSONResponse({
            statusCode: 200,
            data: data.Items,
            success: true,
            message: "Gurduwara Fetched Succesfully",
        })
    } catch (error) {
        return formatJSONResponse({
            message: error,
            statusCode: 500,
        })
    }
}
export const main = middyfy(fetchGurduwaraList);