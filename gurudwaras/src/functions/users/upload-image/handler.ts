import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { GurudwaraSchemaUser } from '../../../Schema/gurudwaras';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import imageUrlToBase64 from 'src/common/uploadImage';

const GURUDWARA_TABLE = process.env.GURUDWARA_DB;
const S3_BUCKET = process.env.GURUDWARA_S3_BUCKET;

const region = process.env.GURUDWARA_AWS_REGION;

const s3Client = new S3Client({ region });
const dynamoClient = new DynamoDBClient({ region });

const uploadImagesToS3Handler: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { gurudwaraId, images } = body;

    // Validation
    if (!gurudwaraId || !images || !Array.isArray(images) || images.length === 0) {
      return formatJSONResponse({
        statusCode: 400,
        message: 'Missing or invalid required fields: gurudwaraId or images array',
        success: false,
      });
    }

    const idValidation = GurudwaraSchemaUser.shape.id.safeParse(gurudwaraId);
    if (!idValidation.success) {
      return formatJSONResponse({
        statusCode: 400,
        message: 'Invalid gurudwaraId format',
        success: false,
      });
    }

    const imageValidationErrors: string[] = [];
    for (const [index, image] of images.entries()) {
      if (!image.imageBase64 || !image.fileName) {
        imageValidationErrors.push(`Image at index ${index} missing imageBase64 or fileName`);
      }
    }
    if (imageValidationErrors.length > 0) {
      return formatJSONResponse({
        statusCode: 400,
        message: `Invalid image data: ${imageValidationErrors.join('; ')}`,
        success: false,
      });
    }

    const imageUrls: string[] = [];

    await Promise.all(
      images.map(async (image) => {
        const { imageBase64, fileName } = image;

        // Remove data URI prefix if present
        let decodedImage = await imageUrlToBase64(imageBase64);
        // Ensure decodedImage is a Buffer for fileTypeFromBuffer
        console.log('Decoded Image Length:', decodedImage.length);

        // ✅ Remove data URL prefix
        const base64Only = decodedImage.split(',')[1];
        const buffer = Buffer.from(base64Only, 'base64');
        const fileInfo = await fileTypeFromBuffer(buffer);
        console.log(`File info for ${fileName}:`, fileInfo);
        if (!fileInfo || !fileInfo.mime.startsWith('image/')) {
          throw new Error(`Invalid file type for ${fileName}. Only images are allowed.`);
        }

        const ext = fileInfo.ext || fileInfo.mime.split('/')[1];
        const imageId = uuidv4();
        const s3Key = `${gurudwaraId}/${imageId}.${ext}`;

        const s3Command = new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: buffer,
          ContentType: fileInfo.mime,
        });

        await s3Client.send(s3Command);

        const imageUrl = `${s3Key}`;
        imageUrls.push(imageUrl);
      })
    );
    console.log(`✅ Uploaded ${imageUrls.length} images to S3`,imageUrls);
    const updateCommand = new UpdateItemCommand({
      TableName: GURUDWARA_TABLE,
      Key: marshall({ id: gurudwaraId }),
      UpdateExpression:
        'SET pictures = list_append(if_not_exists(pictures, :empty_list), :new_images), updatedDate = :updatedDate',
      ExpressionAttributeValues: marshall({
        ':new_images': imageUrls,
        ':empty_list': [],
        ':updatedDate': new Date().toISOString(),
      }),
      ReturnValues: 'UPDATED_NEW',
    });

    await dynamoClient.send(updateCommand);

    console.log(`✅ Uploaded ${imageUrls.length} images to S3 and updated DynamoDB`);

    return formatJSONResponse({
      statusCode: 200,
      message: `${imageUrls.length} images uploaded successfully`,
      success: true,
      data: {
        gurudwaraId,
        imageUrls,
      },
    });
  } catch (error) {
    console.error('❌ Image Upload Error:', error);
    return formatJSONResponse({
      statusCode: 500,
      message: 'Internal Server Error',
      success: false,
    });
  }
};

export const main = middyfy(uploadImagesToS3Handler);
