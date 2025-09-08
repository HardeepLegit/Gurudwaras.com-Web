import { MiddlewareObj } from '@middy/core';
import { formatJSONResponse } from '@libs/api-gateway';

export const checkAdminRole = (): MiddlewareObj => {
  return {
    before: async (request) => {
      const event = request.event as any;
      console.log('Event in Admin Middleware:', JSON.stringify(event, null, 2));
      const user = event.requestContext?.authorizer?.claims;
      event.requestContext.authorizer.user = user

      if (!user) {
        return request.response = formatJSONResponse({
          statusCode: 401,
          message: 'Unauthorized: User not found',
          success: false,
        });
      }

      if (user["cognito:groups"] !== 'admin') {
        return request.response = formatJSONResponse({
          statusCode: 403,
          message: 'Forbidden: Admin access required',
          success: false,
        });
      }
    },
  };
};