import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";
import { APIGatewayEvent, APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const dynamodb = new DynamoDBClient({region: 'eu-north-1'});
const GurduwaraList = process.env.GURDUWARA_LIST_DB;

const uploadFunctionHandler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    const {
      name,
      phoneLandline = "",
      phoneMobile = "",
      emailId = "",
      website = "",
      accommodationAvailable = false,
      pictures = [],
      additionalInfo = "",
      latitude = "",
      longitutde = "",
      approvedByAdmin = false,
      upcomingEvents = [],
      gurduwara_address = "",
    } = body;

    if (!name || !gurduwara_address) {
      return formatJSONResponse({
        statusCode: 400,
        message: "Please provide required fields: 'name' and 'address'.",
      });
    }

    // const userId = event.requestContext?.authorizer?.claims?.sub || "unknown-user";

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const params = {
      TableName: GurduwaraList,
      Item: {
        id: { S: id },
        name: { S: name },
        phoneLandLine: { S: phoneLandline },
        phoneMobile: { S: phoneMobile },
        emailId: { S: emailId },
        website: { S: website },
        accommodationAvailable: { BOOL: Boolean(accommodationAvailable) },
        pictures: {
          L: Array.isArray(pictures) ? pictures.map((p) => ({ S: String(p) })) : [],
        },
        additionalInfo: { S: additionalInfo },
        latitude: { S: latitude },
        longitutde: { S: longitutde },
        approvedByAdmin: { BOOL: Boolean(approvedByAdmin) },
        addedByUserId: { S: id },
        upcomingEvents: {
          L: Array.isArray(upcomingEvents) ? upcomingEvents.map((e) => ({ S: String(e) })) : [],
        },
        gurduwara_address: { S: gurduwara_address },
        createdAt: { S: createdAt },
      },
    };

    await dynamodb.send(new PutItemCommand(params));

    return formatJSONResponse({
      statusCode: 200,
      message :"Uploaded"
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return formatJSONResponse({
      statusCode: 500,
      message: "Internal Server Error",
    });
  }
};

export const main = middyfy(uploadFunctionHandler);
