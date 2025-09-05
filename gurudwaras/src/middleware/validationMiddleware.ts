import { APIGatewayEvent } from 'aws-lambda';
import { ValidationError } from '../common/errors';
import { Validator, ValidationSchema } from '../common/validation';
import { logger } from '../common/logger';

export interface ValidationMiddlewareOptions {
  bodySchema?: ValidationSchema;
  querySchema?: ValidationSchema;
  pathSchema?: ValidationSchema;
}

export const validateRequest = (options: ValidationMiddlewareOptions) => {
  return {
    before: async (request: { event: APIGatewayEvent }) => {
      const { event } = request;
      const requestId = event.requestContext.requestId;

      try {
        // Validate request body
        if (options.bodySchema && event.body) {
          const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
          logger.debug('Validating request body', { requestId });
          Validator.validate(body, options.bodySchema);
        }

        // Validate query parameters
        if (options.querySchema && event.queryStringParameters) {
          logger.debug('Validating query parameters', { requestId });
          Validator.validate(event.queryStringParameters, options.querySchema);
        }

        // Validate path parameters
        if (options.pathSchema && event.pathParameters) {
          logger.debug('Validating path parameters', { requestId });
          Validator.validate(event.pathParameters, options.pathSchema);
        }

        logger.debug('Request validation passed', { requestId });
      } catch (error) {
        logger.error('Request validation failed', error as Error, { requestId });
        throw error;
      }
    },
  };
};

export const validateGurudwaraCreate = validateRequest({
  bodySchema: {
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    address: { required: true, type: 'string', minLength: 5 },
    city: { required: true, type: 'string', minLength: 2 },
    state: { required: true, type: 'string', minLength: 2 },
    country: { required: true, type: 'string', minLength: 2 },
    addedByUserId: { required: true, type: 'string' },
    emailId: { 
      type: 'string',
      custom: (value: string) => !value || Validator.validateEmail(value) || 'Invalid email format'
    },
    phoneMobile: { 
      type: 'string',
      custom: (value: string) => !value || Validator.validatePhone(value) || 'Invalid phone format'
    },
    website: { 
      type: 'string',
      custom: (value: string) => !value || Validator.validateUrl(value) || 'Invalid URL format'
    },
  },
});

export const validateGurudwaraUpdate = validateRequest({
  querySchema: {
    id: { required: true, type: 'string' },
  },
  bodySchema: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    address: { type: 'string', minLength: 5 },
    city: { type: 'string', minLength: 2 },
    state: { type: 'string', minLength: 2 },
    country: { type: 'string', minLength: 2 },
    emailId: { 
      type: 'string',
      custom: (value: string) => !value || Validator.validateEmail(value) || 'Invalid email format'
    },
    phoneMobile: { 
      type: 'string',
      custom: (value: string) => !value || Validator.validatePhone(value) || 'Invalid phone format'
    },
    website: { 
      type: 'string',
      custom: (value: string) => !value || Validator.validateUrl(value) || 'Invalid URL format'
    },
  },
});

export const validateIdParam = validateRequest({
  querySchema: {
    id: { required: true, type: 'string' },
  },
});