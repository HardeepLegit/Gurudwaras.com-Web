import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { checkUserProfile } from 'src/middleware/userMiddleware';

const region = process.env.GURUDWARA_AWS_REGION;
const GURUDWARA_TABLE = process.env.GURUDWARA_DB as string;

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const fetchSinghSabhaGurudwaras: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const scanCommand = new ScanCommand({
      TableName: GURUDWARA_TABLE,
      FilterExpression: 'singhSabha = :singhSabha',
      ExpressionAttributeValues: {
        ':singhSabha': true,
      },
    });

    const result = await ddbClient.send(scanCommand);

    return formatJSONResponse({
      statusCode: 200,
      success: true,
      message: 'Singh Sabha gurudwaras fetched successfully',
      data: result.Items || [],
    });
  } catch (error: any) {
    console.error('Error fetching Singh Sabha gurudwaras:', error);
    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: 'Failed to fetch Singh Sabha gurudwaras',
    });
  }
};

export const main = middyfy(fetchSinghSabhaGurudwaras);