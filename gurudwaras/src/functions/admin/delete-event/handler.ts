import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { checkUserProfile } from 'src/middleware/userMiddleware';
import { checkAdminRole } from 'src/middleware/adminMiddleware';

const region = process.env.GURUDWARA_AWS_REGION;
const GURUDWARA_EVENTS_TABLE = process.env.GURUDWARA_EVENTS_DB as string;

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const deleteEvent: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const eventId = event.pathParameters?.id;
    if (!eventId) {
      return formatJSONResponse({
        statusCode: 400,
        success: false,
        message: 'Event ID is required',
      });
    }

    const user = event.requestContext?.authorizer?.user;

    // Check if event exists and user owns it
    const getCommand = new GetCommand({
      TableName: GURUDWARA_EVENTS_TABLE,
      Key: { id: eventId },
    });

    const existingEvent = await ddbClient.send(getCommand);
    if (!existingEvent.Item) {
      return formatJSONResponse({
        statusCode: 404,
        success: false,
        message: 'Event not found',
      });
    }

    // Check if user owns the event
    if (user["cognito:groups"] !== 'admin') {
      return formatJSONResponse({
        statusCode: 403,
        success: false,
        message: 'You can only delete your own events',
      });
    }

    // Delete the event
    const deleteCommand = new DeleteCommand({
      TableName: GURUDWARA_EVENTS_TABLE,
      Key: { id: eventId },
    });

    await ddbClient.send(deleteCommand);

    return formatJSONResponse({
      statusCode: 200,
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting event:', {
      message: error.message,
      stack: error.stack,
    });

    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: 'Internal server error while deleting event',
    });
  }
};

export const main = middyfy(deleteEvent).use(checkAdminRole());