import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { profileSchema } from "src/Schema/gurudwaras"; // Make sure path is correct

// ⬇️ Constants
const USER_TABLE = process.env.GURUDWARA_USER_DB;
const region = process.env.GURUDWARA_AWS_REGION;

// ⬇️ DynamoDB client
const dynamoClient = new DynamoDBClient({ region });

// ⬇️ Marshall utility
const toDynamoDBItem = (data: Record<string, unknown>) =>
  marshall(data, {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  });

const createUserHandler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    // ✅ Extract user identity from Cognito claims
    console.log("🔍 Event Request Context:", JSON.stringify(event.requestContext, null, 2));
    const claims = event.requestContext.authorizer?.claims;
    const userId = claims?.sub ;
    const email = claims?.email ;

    if (!userId || !email) {
      return formatJSONResponse({
        statusCode: 401,
        message: "Unauthorized: Missing user claims",
        success: false,
      });
    }

    // ✅ Parse and enrich body
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const timestamp = new Date().toISOString();

    // ✅ Check if user already exists
    const getCommand = new GetItemCommand({
      TableName: USER_TABLE,
      Key: marshall({ id: userId }),
    });

    const getResult = await dynamoClient.send(getCommand);
    const existingItem = getResult.Item ? unmarshall(getResult.Item) : null;

    const enrichedBody = {
      ...body,
      id: userId,
      email,
      createdDate: existingItem?.createdDate || timestamp,
      updatedDate: timestamp,
    };

    console.log("📥 Received Payload:", JSON.stringify(enrichedBody, null, 2));

    // ✅ Validate body
    const validation = profileSchema.safeParse(enrichedBody);

    if (!validation.success) {
      console.error("❌ Validation Error:", validation.error.flatten());
      return formatJSONResponse({
        statusCode: 400,
        message: "Validation failed",
        success: false,
      });
    }

    // ✅ Save to DynamoDB (Create or Update)
    const command = new PutItemCommand({
      TableName: USER_TABLE,
      Item: toDynamoDBItem(validation.data),
    });

    await dynamoClient.send(command);

    const operation = existingItem ? "updated" : "created";

    console.log(`✅ User ${operation} in DynamoDB:`, validation.data.id);

    return formatJSONResponse({
      statusCode: 200,
      message: `User profile ${operation} successfully.`,
      success: true,
      data: {
        id: validation.data.id,
      },
    });
  } catch (error) {
    console.error("❌ Handler Error:", error);
    return formatJSONResponse({
      statusCode: 500,
      message: "Internal Server Error",
      success: false,
    });
  }
};

export const main = middyfy(createUserHandler);
