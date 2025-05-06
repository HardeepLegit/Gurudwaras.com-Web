import { APIGatewayEvent,APIGatewayProxyHandler } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import { DynamoDB } from 'aws-sdk';
import { formatJSONResponse } from "@libs/api-gateway";
const dynamoDb = new DynamoDB.DocumentClient();
const GurduwaraList = process.env.GURDUWARA_LIST_DB;
const editGurduwara: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    try {
        const id = event.queryStringParameters?.id;
        const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        const {
          address,
          city,
          contact,
          emailId,
          name,
          state,
          website,
          zip
        } = body;
        const params = {
            TableName: GurduwaraList,
            Key: {
                id: id
            },
            ExpressionAttributeNames: {
                "#address": "address",
                "#city": "city",
                "#contact": "contact",
                "#emailId": "emailId",
                "#name": "name",
                "#state": "state",
                "#website": "website",
                "#zip": "zip"
            },            
            ExpressionAttributeValues:{
                ":address": address,
                ":city": city,
                ":contact": contact,
                ":emailId": emailId,
                ":name": name,
                ":state": state,
                ":website": website,
                ":zip": zip
            },
            UpdateExpression: "SET #address = :address, #city = :city, #contact = :contact, #emailId = :emailId, #name = :name, #state = :state, #website = :website, #zip = :zip",
            ReturnValues: "UPDATED_NEW"
        }
        console.log("Params -",params);
        const result = await dynamoDb.update(params).promise();
        console.log("Result- ",result);
        return formatJSONResponse({
            statusCode: 200,
            data: result,
            success: true,
            message: "Guruduwar Updated Succesfully"
        })
    } catch (error) {
        console.log("Error - ", error);
        return formatJSONResponse({
            message: error,
            statusCode: 500,
        })
    }
}

export const main = middyfy(editGurduwara);