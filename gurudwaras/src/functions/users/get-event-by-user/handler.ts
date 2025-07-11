import { APIGatewayProxyHandler, APIGatewayEvent } from "aws-lambda";
import { formatJSONResponse, formatJSONErrorResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { checkUserProfile } from "src/middleware/userMiddleware";

const region = process.env.GURUDWARA_AWS_REGION;
const client = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(client);

const EventTable = process.env.GURUDWARA_EVENTS_DB as string;

const getUserEvents: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    // ✅ Get user from middleware-injected event
    const user = event.requestContext.authorizer?.user;
    console.log("🔍 User from request context:", JSON.stringify(user, null, 2));
    const userId = user?.id;

    if (!userId) {
      return formatJSONResponse({
        statusCode: 401,
        message: "Unauthorized: User profile missing",
        success: false,
      });
    }

    const queryParams = {
      TableName: EventTable,
      IndexName: "user_id-index", // ✅ Assumes you have a GSI on user_id
      KeyConditionExpression: "addedByUserId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId,
      },
    };
    console.log("🔍 Query Parameters:", JSON.stringify(queryParams, null, 2));
    const result = await dynamodb.send(new QueryCommand(queryParams));

    return formatJSONResponse({
      statusCode: 200,
      message: "User events fetched successfully.",
      data: result.Items || [],
    });

  } catch (error: any) {
    console.error("❌ Error fetching user events:", error);
    return formatJSONErrorResponse({
      statusCode: 500,
      message: error.message || "Internal Server Error",
    });
  }
};

export const main = middyfy(getUserEvents).use(checkUserProfile());
