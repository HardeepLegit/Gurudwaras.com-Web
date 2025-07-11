import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { checkUserProfile } from 'src/middleware/userMiddleware';

const region = process.env.GURUDWARA_AWS_REGION;
const GURUDWARA_TABLE = process.env.GURUDWARA_DB as string;

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const getUserGurudwaras: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const user = event.requestContext?.authorizer?.user;

    if (!user || !user.id) {
      return formatJSONResponse({
        statusCode: 401,
        success: false,
        message: 'Unauthorized: User not found',
      });
    }

    const scanCommand = new ScanCommand({
      TableName: GURUDWARA_TABLE,
      FilterExpression: 'addedByUserId = :userId',
      ExpressionAttributeValues: {
        ':userId': user.id,
      },
    });

    const result = await ddbClient.send(scanCommand);

    return formatJSONResponse({
      statusCode: 200,
      success: true,
      message: 'Gurudwaras fetched successfully',
      data: result.Items || [],
    });
  } catch (error: any) {
    console.error('Error fetching gurudwaras for user:', error);
    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: 'Internal server error while fetching gurudwaras',
    });
  }
};

export const main = middyfy(getUserGurudwaras).use(checkUserProfile());
