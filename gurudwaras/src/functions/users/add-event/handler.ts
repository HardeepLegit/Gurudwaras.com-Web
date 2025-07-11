import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
// import { marshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { eventSchema } from '../../../Schema/gurudwaras'; // Ensure correct import path
import { checkUserProfile } from 'src/middleware/userMiddleware';
import uploadImagesToS3 from 'src/common/uploadImageToS3';

const region = process.env.GURUDWARA_AWS_REGION;
const GURUDWARA_EVENTS_TABLE = process.env.GURUDWARA_EVENTS_DB as string;

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const addEvent: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const rawBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    let user = event.requestContext?.authorizer?.user;
    const eventPayload = {
      ...rawBody,
      id: uuidv4(),
      addedByUserId: user.id,
    };
    console.log('Received Gurudwara ID: %j', rawBody, eventPayload);
    const validation = eventSchema.safeParse(eventPayload);
    if (!validation.success) {
      return formatJSONResponse({
        statusCode: 400,
        success: false,
        message: 'Validation failed',
      });
    }
     const uploadResult = await uploadImagesToS3({
      id: validation.data.id,
      images: validation.data.bannerImages || [],
    });

    if (!Array.isArray(uploadResult)) {
      // If uploadImagesToS3 returns an error response, return it directly
      return formatJSONResponse({
        statusCode: uploadResult.statusCode || 500,
        message: 'Image upload failed',
        success: false,
      });
    }

    validation.data.bannerImages = uploadResult;
    console.log('Validated Event Payload:', JSON.stringify(validation.data, null, 2));
    const command = new PutCommand({
      TableName: GURUDWARA_EVENTS_TABLE,
      Item: validation.data,
    });

    await ddbClient.send(command);

    return formatJSONResponse({
      statusCode: 200,
      success: true,
      message: 'Event added successfully',
      data: validation.data,
    });
  } catch (error: any) {
    console.error('Error adding event:', {
      message: error.message,
      stack: error.stack,
    });

    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: 'Internal server error while adding event',
    });
  }
};

export const main = middyfy(addEvent).use(checkUserProfile());
