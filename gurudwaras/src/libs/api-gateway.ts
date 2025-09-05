import { APIGatewayProxyResult } from 'aws-lambda';
import { AppError } from '../common/errors';

interface ApiResponse<T = any> {
  message: string;
  data?: T;
  statusCode: number;
  success: boolean;
  errors?: string | string[];
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

interface ResponseOptions {
  cors?: boolean;
  requestId?: string;
}

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const formatSuccessResponse = <T = any>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  options: ResponseOptions = {}
): APIGatewayProxyResult => {
  const response: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(options.requestId && { requestId: options.requestId }),
    },
  };

  return {
    statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(response),
  };
};

export const formatErrorResponse = (
  error: AppError | Error | string,
  statusCode?: number,
  options: ResponseOptions = {}
): APIGatewayProxyResult => {
  let response: ApiResponse;

  if (error instanceof AppError) {
    response = {
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      errors: error.code,
      meta: {
        timestamp: new Date().toISOString(),
        ...(options.requestId && { requestId: options.requestId }),
      },
    };
  } else if (error instanceof Error) {
    response = {
      success: false,
      statusCode: statusCode || 500,
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        ...(options.requestId && { requestId: options.requestId }),
      },
    };
  } else {
    response = {
      success: false,
      statusCode: statusCode || 500,
      message: typeof error === 'string' ? error : 'An unexpected error occurred',
      meta: {
        timestamp: new Date().toISOString(),
        ...(options.requestId && { requestId: options.requestId }),
      },
    };
  }

  return {
    statusCode: response.statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(response),
  };
};

// Legacy support - deprecated
export const formatJSONResponse = (response: {
  message: string;
  data?: any;
  statusCode: number;
  success?: boolean;
  errors?: string;
}): APIGatewayProxyResult => {
  return {
    statusCode: response.statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      message: response.message,
      statusCode: response.statusCode,
      success: response.success ?? true,
      data: response.data,
      errors: response.errors,
      meta: {
        timestamp: new Date().toISOString(),
      },
    }),
  };
};

export type { ApiResponse, ResponseOptions };