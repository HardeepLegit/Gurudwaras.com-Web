import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";

const testFunctionHandler: APIGatewayProxyHandler = async (event: APIGatewayEvent) =>{
  return formatJSONResponse({
    statusCode: 200,
    data: {message: "Hello This is my First Function"}
  });
};

export const main = middyfy(testFunctionHandler);