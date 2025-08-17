import { MiddlewareObj } from '@middy/core';
import { formatJSONResponse } from '@libs/api-gateway';
import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
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
              email?: string;
              name?: string;
              [key: string]: any;
            };
            user?: any;
          };
        };
        [key: string]: any;
      };

      const claims = event.requestContext?.authorizer?.claims;
      const userId = claims?.sub;

      if (!userId) {
        return request.response = formatJSONResponse({
          statusCode: 401,
          message: 'Unauthorized: Missing user ID',
          success: false,
        });
      }

      console.log('🔍 User ID:', userId);

      const getCommand = new GetItemCommand({
        TableName: USER_TABLE,
        Key: marshall({ id: userId }),
      });

      const getResult = await dynamoClient.send(getCommand);
      console.log('🔍 DynamoDB Get Result:', JSON.stringify(getResult, null, 2));

      if (!getResult.Item) {
        console.log(`🟡 User not found, creating new user with id ${userId}`);

        const newUser = {
          id: userId,
          email: claims?.email || '',
          name: claims?.name || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // add any other default fields you want
        };

        const putCommand = new PutItemCommand({
          TableName: USER_TABLE,
          Item: marshall(newUser),
        });

        await dynamoClient.send(putCommand);
        console.log('✅ New user created');

        event.requestContext.authorizer.user = newUser;
      } else {
        const user = unmarshall(getResult.Item);
        console.log('✅ Existing user found:', JSON.stringify(user, null, 2));
        event.requestContext.authorizer.user = user;
      }
    },
  };
};

