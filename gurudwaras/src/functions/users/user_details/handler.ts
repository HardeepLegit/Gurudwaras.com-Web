import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";

const testFunctionHandler: APIGatewayProxyHandler = async (event: APIGatewayEvent)=>{
    return formatJSONResponse({
        statusCode: 200,
        data: {
            message: "This function is for User Details"
        },
        success: true,
    });
}
export const main = middyfy(testFunctionHandler);