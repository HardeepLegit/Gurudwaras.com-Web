import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import uploadImagesToS3, { uploadSingleImagesToS3 } from 'src/common/uploadImageToS3';
import { checkAdminRole } from 'src/middleware/adminMiddleware';
const region = process.env.GURUDWARA_AWS_REGION;
const client = new DynamoDBClient({ region });
const dynamodb = DynamoDBDocumentClient.from(client);

const Gurduwara = process.env.GURUDWARA_DB;

const adminUpdateGurduwara: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const id = event.queryStringParameters?.id;
    if (!id) {
      return formatJSONResponse({
        statusCode: 400,
        message: `Missing required parameter: ${id}`,
        success: false,
      });
    }

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (!body || typeof body !== 'object') {
      return formatJSONResponse({
        statusCode: 400,
        message: 'Invalid or missing request body',
        success: false,
      });
    }

    // Destructure all expected fields
    const {
      name,
      phoneLandline,
      phoneMobile,
      emailId,
      website,
      accommodationAvailable,
      addedGurudwaras,
      pictures,
      bannerImage,
      additionalInfo,
      registrationNumber,
      latitude,
      longitude,
      addedByUserId,
      approvedByAdmin,
      upcomingEvents,
      address,
      city,
      state,
      postalCode,
      country,
      additionalDate,
      facilitiesAndServices,
      learningAndEducation,
      medicalFacilities,
      status,
      singhSabha,
      singhSabhaInfo,
      updatedDate,
    } = body;
    let updatedPictures = pictures;
    let updateBannerImage = bannerImage;
    if (updateBannerImage && updateBannerImage.length > 0) {
      const bannerUploadResult = await uploadSingleImagesToS3({
        id: id,
        images: updateBannerImage,
      });
      if (typeof bannerUploadResult === 'object' && 'statusCode' in bannerUploadResult) {
        return formatJSONResponse({
          statusCode: bannerUploadResult.statusCode || 500,
          success: false,
          message: 'Banner image upload failed',
          errors:
            typeof bannerUploadResult.body === 'string'
              ? bannerUploadResult.body
              : JSON.stringify(bannerUploadResult.body),
        });
      }
      updateBannerImage = bannerUploadResult;
    }
    if (updatedPictures && updatedPictures.length > 0) {
      const bannerUploadResult = await uploadImagesToS3({
        id: id,
        images: updatedPictures,
      });
      if (!Array.isArray(bannerUploadResult)) {
        return formatJSONResponse({
          statusCode: bannerUploadResult.statusCode || 500,
          success: false,
          message: 'Banner image upload failed',
          errors:
            typeof bannerUploadResult.body === 'string'
              ? bannerUploadResult.body
              : JSON.stringify(bannerUploadResult.body),
        });
      }
      updatedPictures = bannerUploadResult;
    }
    const expressionAttributeNames = {
      '#name': 'name',
      '#phoneLandline': 'phoneLandline',
      '#phoneMobile': 'phoneMobile',
      '#emailId': 'emailId',
      '#website': 'website',
      '#accommodationAvailable': 'accommodationAvailable',
      '#addedGurudwaras': 'addedGurudwaras',
      '#pictures': 'pictures',
      '#additionalInfo': 'additionalInfo',
      '#registrationNumber': 'registrationNumber',
      '#latitude': 'latitude',
      '#longitude': 'longitude',
      '#addedByUserId': 'addedByUserId',
      '#approvedByAdmin': 'approvedByAdmin',
      '#upcomingEvents': 'upcomingEvents',
      '#address': 'address',
      '#city': 'city',
      '#state': 'state',
      '#postalCode': 'postalCode',
      '#country': 'country',
      '#additionalDate': 'additionalDate',
      '#facilitiesAndServices': 'facilitiesAndServices',
      '#learningAndEducation': 'learningAndEducation',
      '#medicalFacilities': 'medicalFacilities',
      '#status': 'status',
      '#singhSabha': 'singhSabha',
      '#singhSabhaInfo': 'singhSabhaInfo',
      '#updatedDate': 'updatedDate',
      '#bannerImage': 'bannerImage',
    };

    const expressionAttributeValues = {
      ':name': name,
      ':phoneLandline': phoneLandline,
      ':phoneMobile': phoneMobile,
      ':emailId': emailId,
      ':website': website,
      ':accommodationAvailable': accommodationAvailable,
      ':addedGurudwaras': addedGurudwaras,
      ':pictures': updatedPictures,
      ':additionalInfo': additionalInfo,
      ':registrationNumber': registrationNumber,
      ':latitude': latitude,
      ':longitude': longitude,
      ':addedByUserId': addedByUserId,
      ':approvedByAdmin': approvedByAdmin,
      ':upcomingEvents': upcomingEvents,
      ':address': address,
      ':city': city,
      ':state': state,
      ':postalCode': postalCode,
      ':country': country,
      ':additionalDate': additionalDate,
      ':facilitiesAndServices': facilitiesAndServices,
      ':learningAndEducation': learningAndEducation,
      ':medicalFacilities': medicalFacilities,
      ':status': status,
      ':singhSabha': singhSabha || false,
      ':singhSabhaInfo': singhSabhaInfo,
      ':bannerImage': updateBannerImage,
      ':updatedDate': new Date().toISOString(),
    };

    // Build the update expression dynamically to avoid undefined issues
    const updateParts = Object.entries(expressionAttributeValues)
      .filter(([_, value]) => value !== undefined)
      .map(([key]) => `${key.replace(':', '#')}= ${key}`);

    const filteredAttrNames = Object.fromEntries(
      Object.entries(expressionAttributeNames).filter(([key]) =>
        updateParts.some((part) => part.includes(key))
      )
    );

    const filteredAttrValues = Object.fromEntries(
      Object.entries(expressionAttributeValues).filter(([_, value]) => value !== undefined)
    );

    const updateExpression = `SET ${updateParts.join(', ')}`;

    const params = {
      TableName: Gurduwara,
      Key: { id },
      ExpressionAttributeNames: filteredAttrNames,
      ExpressionAttributeValues: filteredAttrValues,
      UpdateExpression: updateExpression,
      ReturnValues: 'UPDATED_NEW' as const,
    };

    console.log('DynamoDB Update Params:', JSON.stringify(params, null, 2));

    const result = await dynamodb.send(new UpdateCommand(params));

    return formatJSONResponse({
      statusCode: 200,
      success: true,
      message: 'Gurudwara updated successfully',
      data: result.Attributes,
    });
  } catch (error: any) {
    console.error('Error updating Gurudwara:', error);
    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: 'Failed to update Gurudwara',
    });
  }
};

export const main = middyfy(adminUpdateGurduwara).use(checkAdminRole());
