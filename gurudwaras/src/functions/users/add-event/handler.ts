import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { eventSchema } from '../../../Schema/gurudwaras';
import { checkUserProfile } from 'src/middleware/userMiddleware';
import uploadImagesToS3 from 'src/common/uploadImageToS3';

const region = process.env.GURUDWARA_AWS_REGION;
const GURUDWARA_EVENTS_TABLE = process.env.GURUDWARA_EVENTS_DB as string;

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));

const addEvent: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    // Parse the incoming request body
    const rawBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    let user = event.requestContext?.authorizer?.user;
    const eventPayload = {
      ...rawBody,
      id: uuidv4(),
      addedByUserId: user.id,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      status: rawBody.status || 'PENDING', // Default status from schema
    };

    // Validate against schema
    const validation = eventSchema.safeParse(eventPayload);
    if (!validation.success) {
      return formatJSONResponse({
        statusCode: 400,
        success: false,
        message: 'Validation failed',
        errors: JSON.stringify(validation.error.format()),
      });
    }

    // Handle banner images upload if provided
    let uploadedBannerImageUrls: string[] = [];
    if (validation.data.bannerImages && validation.data.bannerImages.length > 0) {
      const bannerUploadResult = await uploadImagesToS3({
        id: validation.data.id,
        images: validation.data.bannerImages,
      });

      if (!Array.isArray(bannerUploadResult)) {
        return formatJSONResponse({
          statusCode: bannerUploadResult.statusCode || 500,
          success: false,
          message: 'Banner image upload failed',
          errors: typeof bannerUploadResult.body === 'string' ? bannerUploadResult.body : JSON.stringify(bannerUploadResult.body),
        });
      }
      uploadedBannerImageUrls = bannerUploadResult;
    }

    // Handle organizer image upload if provided
    let uploadedOrganizerImageUrl: string 
    if (validation.data.organizer.image) {
      const organizerUploadResult = await uploadImagesToS3({
        id: `${validation.data.id}`,
        images: [validation.data.organizer.image],
      });

      if (!Array.isArray(organizerUploadResult)) {
        return formatJSONResponse({
          statusCode: organizerUploadResult.statusCode || 500,
          success: false,
          message: 'Organizer image upload failed',
          errors: typeof organizerUploadResult.body === 'string' ? organizerUploadResult.body : JSON.stringify(organizerUploadResult.body),
        });
      }
      uploadedOrganizerImageUrl = organizerUploadResult[0];
    }

    // Handle personalities profile images upload if provided
    let uploadedPersonalityImages: (string)[] = [];
    if (validation.data.personalities && validation.data.personalities.length > 0) {
      const personalityImages = validation.data.personalities
        .map((p, index) => ({ image: p.profileImage, index }))
        .filter(p => p.image); // Only include personalities with profile images

      if (personalityImages.length > 0) {
        const personalityUploadResult = await uploadImagesToS3({
          id: `${validation.data.id}`,
          images: personalityImages.map(p => p.image!),
        });

        if (!Array.isArray(personalityUploadResult)) {
          return formatJSONResponse({
            statusCode: personalityUploadResult.statusCode || 500,
            success: false,
            message: 'Personality profile image upload failed',
            errors: typeof personalityUploadResult.body === 'string' ? personalityUploadResult.body : JSON.stringify(personalityUploadResult.body),
          });
        }

        // Map uploaded URLs back to their respective personality indices
        uploadedPersonalityImages = validation.data.personalities.map((_, index) => {
          const uploadIndex = personalityImages.find(p => p.index === index);
          return uploadIndex ? personalityUploadResult[personalityImages.indexOf(uploadIndex)] : undefined;
        });
      }
    }

    // Prepare the final item for DynamoDB
    const item = {
      ...validation.data,
      bannerImages: uploadedBannerImageUrls.length > 0 ? uploadedBannerImageUrls : "",
      organizer: {
        ...validation.data.organizer,
        image: uploadedOrganizerImageUrl ?? "",
      },
      personalities: validation.data.personalities?.map((personality, index) => ({
        ...personality,
        profileImage: uploadedPersonalityImages[index] ?? "",
      })) ?? "",
      // Ensure optional fields are only included if they have values
    };

    // Save to DynamoDB
    const command = new PutCommand({
      TableName: GURUDWARA_EVENTS_TABLE,
      Item: item,
    });

    await ddbClient.send(command);

    return formatJSONResponse({
      statusCode: 201,
      success: true,
      message: 'Event added successfully',
      data: item,
    });
  } catch (error: any) {
    console.error('Error adding event:', {
      message: error.message,
      stack: error.stack,
    });

    return formatJSONResponse({
      statusCode: 500,
      success: false,
      message: 'Internal server error while adding event',
    });
  }
};

export const main = middyfy(addEvent).use(checkUserProfile());