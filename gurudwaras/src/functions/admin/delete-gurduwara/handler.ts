import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { checkUserProfile } from 'src/middleware/userMiddleware';
import { checkAdminRole } from 'src/middleware/adminMiddleware';

const region = process.env.GURUDWARA_AWS_REGION;
const GURUDWARA_TABLE = process.env.GURUDWARA_DB as string;

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const deleteGurudwara: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const gurudwaraId = event.pathParameters?.id;
    if (!gurudwaraId) {
      return formatJSONResponse({
        statusCode: 400,
        success: false,
        message: 'Gurudwara ID is required',
      });
    }

    const user = event.requestContext?.authorizer?.user;
    console.log('User from authorizer:', user);
    // Check if gurudwara exists and user owns it
    const getCommand = new GetCommand({
      TableName: GURUDWARA_TABLE,
      Key: { id: gurudwaraId },
    });

    const existingGurudwara = await ddbClient.send(getCommand);
    if (!existingGurudwara.Item) {
      return formatJSONResponse({
        statusCode: 404,
        success: false,
        message: 'Gurudwara not found',
      });
    }

    // Check if user owns the gurudwara
    if (user["cognito:groups"] !== 'admin') {
      return formatJSONResponse({
        statusCode: 403,
        success: false,
        message: 'You can only delete your own gurudwaras',
      });
    }

    // Delete the gurudwara
    const deleteCommand = new DeleteCommand({
      TableName: GURUDWARA_TABLE,
      Key: { id: gurudwaraId },
    });

    await ddbClient.send(deleteCommand);

    return formatJSONResponse({
      statusCode: 200,
      success: true,
      message: 'Gurudwara deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting gurudwara:', {
      message: error.message,
      stack: error.stack,
    });

    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: 'Internal server error while deleting gurudwara',
    });
  }
};

export const main = middyfy(deleteGurudwara).use(checkAdminRole());