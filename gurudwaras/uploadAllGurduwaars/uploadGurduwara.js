import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({ region: "eu-north-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Load the JSON file
const rawData = fs.readFileSync("gurudwaras.json");
const parsedData = JSON.parse(rawData).data;

async function uploadData() {
  for (const item of parsedData) {
    const cleanedDescription = item.description.replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML

    const params = {
      TableName: "gurduwara_list",
      Item: {
        id: item.id.toString(), // assuming id is unique
        name: item.name,
        phone_number: item.phone_number,
        emailId: item.email,
        website: item.website,
        videoUrl: item.video_url,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        address: item.address,
        country: item.country,
        state: item.state,
        district: item.district,
        location: item.location,
        description: cleanedDescription,
        addedByUserId: "script-import",
        approvedByAdmin: false,
        createdAt: new Date().toISOString(),
      }
    };

    try {
      await ddbDocClient.send(new PutCommand(params));
      console.log(`✅ Uploaded: ${item.name}`);
    } catch (err) {
      console.error(`❌ Error uploading ${item.name}:`, err);
    }
  }
}

uploadData();
