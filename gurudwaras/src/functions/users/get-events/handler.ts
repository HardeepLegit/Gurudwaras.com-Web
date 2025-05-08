import { APIGatewayProxyHandler, APIGatewayEvent } from "aws-lambda";
import { formatJSONResponse, formatJSONErrorResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { DynamoDB, GetItemCommand } from "@aws-sdk/client-dynamodb";

const dynamodb = new DynamoDB({ region: "eu-north-1" });
const GurduwaraList = process.env.GURDUWARA_LIST_DB;

const getEventsByGurduwaraId: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const id = event.pathParameters?.gurduwara_id;

    if (!id) {
      return formatJSONResponse({
        statusCode: 400,
        message: "Missing required path parameter: gurduwara_id",
      });
    }

    const params = {
      TableName: GurduwaraList,
      Key: {
        id: { S: id },
      },
      ProjectionExpression: "upcomingEvents",
    };

    const result = await dynamodb.send(new GetItemCommand(params));

    if (!result.Item) {
      return formatJSONResponse({
        statusCode: 404,
        message: "Gurduwara not found.",
      });
    }

    const eventsList = result.Item.upcomingEvents?.L?.map((item) => item.S) || [];

    return formatJSONResponse({
      statusCode: 200,
      message: "Events fetched successfully.",
      data: eventsList,
    });

  } catch (error) {
    console.error("Error fetching events:", error);
    return formatJSONErrorResponse({
      statusCode: 500,
      message: error.message || "Internal Server Error",
    });
  }
};

export const main = middyfy(getEventsByGurduwaraId);
