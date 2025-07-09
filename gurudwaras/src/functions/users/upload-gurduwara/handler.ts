import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
// Update the import path and extension if necessary
import { GurudwaraSchemaUser } from 'src/Schema/gurudwaras'; // Check that '../../../Schema/gurudwaras.ts' exists
import uploadImagesToS3 from 'src/common/uploadImageToS3';

const region = process.env.GURUDWARA_AWS_REGION;
const GURUDWARA_TABLE = process.env.GURUDWARA_DB as string;

// ✅ Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({ region });

// ✅ Marshall utility
const toDynamoDBItem = (data: Record<string, unknown>) =>
  marshall(data, {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  });

const uploadGurudwaraHandler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    // ✅ Parse body from API Gateway
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    console.log('📥 Received Event Body:', JSON.stringify(body, null, 2));
    // ✅ Add metadata
    const gurudwaraId = uuidv4();
    const timestamp = new Date().toISOString();

    const enrichedBody = {
      ...body,
      id: gurudwaraId,
      createdDate: timestamp,
      updatedDate: timestamp,
    };

    console.log('📥 Received Payload:', JSON.stringify(enrichedBody, null, 2));

    // ✅ Validate against Zod schema
    const validation = GurudwaraSchemaUser.safeParse(enrichedBody);

    if (!validation.success) {
      console.error('❌ Validation Error:', validation.error.flatten());
      return formatJSONResponse({
        statusCode: 400,
        message: 'Validation failed',
        success: false,
      });
    }
    const uploadResult = await uploadImagesToS3({
      id: gurudwaraId,
      images: validation.data.pictures,
    });

    if (!Array.isArray(uploadResult)) {
      // If uploadImagesToS3 returns an error response, return it directly
      return formatJSONResponse({
        statusCode: uploadResult.statusCode || 500,
        message: 'Image upload failed',
        success: false,
      });
    }

    validation.data.pictures = uploadResult;
    // ✅ Create DynamoDB PutItem command
    const command = new PutItemCommand({
      TableName: GURUDWARA_TABLE,
      Item: toDynamoDBItem(validation.data),
    });
    console.log('📤 Uploading Gurudwara to DynamoDB:', JSON.stringify(validation.data, null, 2));
    await dynamoClient.send(command);

    console.log('✅ Gurudwara uploaded to DynamoDB:', validation.data.id);

    return formatJSONResponse({
      statusCode: 200,
      message: 'Gurudwara uploaded successfully.',
      success: true,
      data: {
        id: validation.data.id,
      },
    });
  } catch (error) {
    console.error('❌ Upload Error:', error);
    return formatJSONResponse({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  }
};

export const main = middyfy(uploadGurudwaraHandler);
