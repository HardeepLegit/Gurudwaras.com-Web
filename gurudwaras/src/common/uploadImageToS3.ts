import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { formatJSONResponse } from '@libs/api-gateway';
// Update the import path and exported name as per your project structure.
// For example, if the file is named 'gurudwaraSchema.ts' and exports 'GurudwaraSchemaUser', use:
import { GurudwaraSchemaUser } from '../Schema/gurudwaras';
// If the file or export name is different, update accordingly.
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import imageUrlToBase64 from 'src/common/uploadImage';

const S3_BUCKET = process.env.GURUDWARA_S3_BUCKET;
const region = process.env.GURUDWARA_AWS_REGION;

const s3Client = new S3Client({ region });

const uploadImagesToS3 = async (data: { id: any; images: any }) => {
  try {
    const { id, images } = data;
    console.log('📥 Received Data:', JSON.stringify(data, null, 2));
    // Validation
    if (!id || !images || !Array.isArray(images) || images.length === 0) {
      return formatJSONResponse({
        statusCode: 400,
        message: 'Missing or invalid required fields: id or images array',
        success: false,
      });
    }

    const idValidation = GurudwaraSchemaUser.shape.id.safeParse(id);
    if (!idValidation.success) {
      return formatJSONResponse({
        statusCode: 400,
        message: 'Invalid id format',
        success: false,
      });
    }
    const imageUrls: string[] = [];

    await Promise.all(
      images.map(async (image) => {
        // Remove data URI prefix if present
        let decodedImage = await imageUrlToBase64(image);
        // Ensure decodedImage is a Buffer for fileTypeFromBuffer
        console.log('Decoded Image Length:', decodedImage.length);

        // ✅ Remove data URL prefix
        const base64Only = decodedImage.split(',')[1];
        const buffer = Buffer.from(base64Only, 'base64');
        const fileInfo = await fileTypeFromBuffer(buffer);
        console.log(`File info for :`, fileInfo);
        if (!fileInfo || !fileInfo.mime.startsWith('image/')) {
          throw new Error(`Invalid file type for Only images are allowed.`);
        }

        const ext = fileInfo.ext || fileInfo.mime.split('/')[1];
        const imageId = uuidv4();
        const s3Key = `${id}/${imageId}.${ext}`;

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
    console.log(`✅ Uploaded ${imageUrls.length} images to S3`, imageUrls);
    return imageUrls;
  } catch (error) {
    console.error('❌ Image Upload Error:', error);
    return formatJSONResponse({
      statusCode: 500,
      message: 'Internal Server Error',
      success: false,
    });
  }
};
export default uploadImagesToS3;
