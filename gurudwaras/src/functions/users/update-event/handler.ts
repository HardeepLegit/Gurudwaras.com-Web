import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
// import { eventSchema } from '../../../Schema/gurudwaras';
import { checkUserProfile } from 'src/middleware/userMiddleware';
import uploadImagesToS3 from 'src/common/uploadImageToS3';

const region = process.env.GURUDWARA_AWS_REGION;
const GURUDWARA_EVENTS_TABLE = process.env.GURUDWARA_EVENTS_DB as string;

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const updateEvent: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const eventId = event.pathParameters?.id;
    console.log('Event ID:', eventId);
    if (!eventId) {
      return formatJSONResponse({
        statusCode: 400,
        success: false,
        message: 'Event ID is required',
      });
    }

    // Check if event exists
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
    const user = event.requestContext?.authorizer?.user;
    if (existingEvent.Item.addedByUserId !== user.id) {
      return formatJSONResponse({
        statusCode: 403,
        success: false,
        message: 'You can only update your own events',
      });
    }
    const rawBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    
    // Remove restricted fields that users cannot update
    const { status, id, createdDate, addedByUserId, ...allowedFields } = rawBody;
    
    // Only update provided fields
    const updateData = {
      ...allowedFields,
      updatedDate: new Date().toISOString(),
    };

    // Handle image uploads only if provided
    if (updateData.bannerImages && updateData.bannerImages.length > 0) {
      const bannerUploadResult = await uploadImagesToS3({
        id: eventId,
        images: updateData.bannerImages,
      });

      if (!Array.isArray(bannerUploadResult)) {
        return formatJSONResponse({
          statusCode: bannerUploadResult.statusCode || 500,
          success: false,
          message: 'Banner image upload failed',
          errors: typeof bannerUploadResult.body === 'string' ? bannerUploadResult.body : JSON.stringify(bannerUploadResult.body),
        });
      }
      updateData.bannerImages = bannerUploadResult;
    }

    if (updateData.organizer?.image) {
      const organizerUploadResult = await uploadImagesToS3({
        id: eventId,
        images: [updateData.organizer.image],
      });

      if (!Array.isArray(organizerUploadResult)) {
        return formatJSONResponse({
          statusCode: organizerUploadResult.statusCode || 500,
          success: false,
          message: 'Organizer image upload failed',
          errors: typeof organizerUploadResult.body === 'string' ? organizerUploadResult.body : JSON.stringify(organizerUploadResult.body),
        });
      }
      updateData.organizer.image = organizerUploadResult[0];
    }

    // Build update expression for only provided fields
    const updateExpressions: string[] = [];
    const expressionAttributeValues: any = {};
    const expressionAttributeNames: any = {};

    Object.keys(updateData).forEach((key) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = updateData[key];
    });

    const command = new UpdateCommand({
      TableName: GURUDWARA_EVENTS_TABLE,
      Key: { id: eventId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: 'ALL_NEW',
    });

    const result = await ddbClient.send(command);

    return formatJSONResponse({
      statusCode: 200,
      success: true,
      message: 'Event updated successfully',
      data: result.Attributes,
    });
  } catch (error: any) {
    console.error('Error updating event:', {
      message: error.message,
      stack: error.stack,
    });

    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: 'Internal server error while updating event',
    });
  }
};

export const main = middyfy(updateEvent).use(checkUserProfile());