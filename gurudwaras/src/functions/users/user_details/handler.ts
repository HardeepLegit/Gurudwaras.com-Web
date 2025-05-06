import {
    CognitoIdentityProviderClient,
    ListUsersCommand,
    AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
const client = new CognitoIdentityProviderClient({ region: "eu-north-1" });
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import * as dotenv from 'dotenv';
dotenv.config();
const UserPoolId = process.env.USER_POOL_ID;
const testFunctionHandler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { email } = body;
    console.log("Email: ", email);
    const listUsersCommand = new ListUsersCommand({
        UserPoolId,
        Filter: `email = "${email}"`,
        Limit: 1,
    });
    try {
        const listUserResponse = await client.send(listUsersCommand);
        if (!listUserResponse.Users && listUserResponse.Users.length === 0) {
            console.log("No User Found With that Email");
            return formatJSONResponse({
                message: 'No User Found with that Email',
                statusCode: 404,
            });
        }
        console.log("List User Response: ", listUserResponse);
        const username = listUserResponse.Users[0].Username;
        const getUserCommand = new AdminGetUserCommand({
            UserPoolId,
            Username: username,
        });
        const userDetails = await client.send(getUserCommand);
        console.log("User Details: ", userDetails);
        return formatJSONResponse({
            message: 'User Details Fetched Succesfully',
            statusCode: 200,
            data: userDetails,
            success: true
        })
    } catch (error) {
        console.log(error);
        return formatJSONResponse({
            message: 'Error Fetching User Details',
            statusCode: 500,
        })
    }
}
export const main = middyfy(testFunctionHandler);