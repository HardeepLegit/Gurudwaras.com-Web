import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { middyfy } from "@libs/lambda";
import { formatJSONResponse } from "@libs/api-gateway";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { checkAdminRole } from "src/middleware/adminMiddleware";
const region = process.env.GURUDWARA_AWS_REGION
const client = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(client);
const GurudwaraTable = process.env.GURUDWARA_DB;

const adminUpdateStatus: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const id = event.queryStringParameters?.id;
    const statusRaw = event.queryStringParameters?.status;

    if (!id || !statusRaw) {
      return formatJSONResponse({
        statusCode: 400,
        message: "Missing required parameters: 'id' and/or 'status'",
        success: false
      });
    }
    const status = statusRaw.toUpperCase();
    const updateParams = {
      TableName: GurudwaraTable,
      Key: { id },
      UpdateExpression: "SET #status = :status, #updatedDate = :updatedDate",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedDate": "updatedDate"
      },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedDate": new Date().toISOString()
      },
      ReturnValues: "UPDATED_NEW" as const
    };

    const result = await dynamodb.send(new UpdateCommand(updateParams));

    return formatJSONResponse({
      statusCode: 200,
      success: true,
      message: "Gurudwara status updated successfully",
      data: result.Attributes
    });
  } catch (error: any) {
    console.error("Error updating Gurudwara status:", error);
    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: "Internal server error while updating status"
    });
  }
};

export const main = middyfy(adminUpdateStatus).use(checkAdminRole());
