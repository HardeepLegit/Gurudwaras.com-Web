import { MiddlewareObj } from '@middy/core';
import { formatJSONResponse } from '@libs/api-gateway';
import {
  DynamoDBClient,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const USER_TABLE = process.env.GURUDWARA_USER_DB!;
const region = process.env.GURUDWARA_AWS_REGION!;
const dynamoClient = new DynamoDBClient({ region });

export const checkUserProfile = (): MiddlewareObj => {
  return {
    before: async (request) => {
      const event = request.event as {
        requestContext?: {
          authorizer?: {
            claims?: {
              sub?: string;
              [key: string]: any;
              
            },
            user?: any;
          };
        };
        [key: string]: any;
      };
      const userId = event.requestContext?.authorizer?.claims?.sub;

      if (!userId) {
        return request.response = formatJSONResponse({
          statusCode: 401,
          message: 'Unauthorized: Missing user ID',
          success: false,
        });
      }

      console.log('🔍 User ID from request context:', userId);

      const getCommand = new GetItemCommand({
        TableName: USER_TABLE,
        Key: marshall({ id: userId }),
      });

      const getResult = await dynamoClient.send(getCommand);
      console.log('🔍 Get User Command Result:', JSON.stringify(getResult, null, 2));

      if (!getResult.Item) {
        return request.response = formatJSONResponse({
          statusCode: 404,
          message: 'User not found or profile not updated yet',
          success: false,
        });
      }

      const user = unmarshall(getResult.Item);
      console.log('🔍 User Details:', JSON.stringify(user, null, 2));

      // Inject user into event for downstream handlers
      event.requestContext.authorizer.user = user;
    },
  };
};
