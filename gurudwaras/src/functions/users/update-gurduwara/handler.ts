import { APIGatewayEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { middyfy } from '@libs/lambda';
import { formatSuccessResponse, formatErrorResponse } from '@libs/api-gateway';
import { gurudwaraDB } from '../../../common/DynomoDB';
import { Validator, commonSchemas } from '../../../common/validation';
import { ValidationError, NotFoundError, handleError } from '../../../common/errors';
import { logger } from '../../../common/logger';
import uploadImagesToS3 from '../../../common/uploadImageToS3';

interface UpdateGurudwaraRequest {
  name?: string;
  phoneLandline?: string;
  phoneMobile?: string;
  emailId?: string;
  website?: string;
  accommodationAvailable?: boolean;
  addedGurudwaras?: string[];
  pictures?: any[];
  additionalInfo?: string;
  registrationNumber?: string;
  latitude?: number;
  longitude?: number;
  addedByUserId?: string;
  approvedByAdmin?: boolean;
  upcomingEvents?: any[];
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  additionalDate?: string;
  facilitiesAndServices?: any;
  learningAndEducation?: any;
  medicalFacilities?: any;
  status?: string;
}

const updateGurudwara: APIGatewayProxyHandler = async (event: APIGatewayEvent) => {
  const requestId = event.requestContext.requestId;
  
  try {
    logger.logRequest(event.httpMethod, event.path, { requestId });

    // Validate ID parameter
    const id = event.queryStringParameters?.id;
    if (!id) {
      throw new ValidationError('Missing required parameter: id');
    }

    // Parse and validate request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Invalid or missing request body');
    }

    // Validate required fields for update
    const updateData: UpdateGurudwaraRequest = body;
    
    // Check if gurudwara exists
    const existingGurudwara = await gurudwaraDB.getItem({ id });
    if (!existingGurudwara) {
      throw new NotFoundError('Gurudwara');
    }

    // Handle image upload if pictures are provided
    let processedPictures = updateData.pictures;
    if (updateData.pictures && Array.isArray(updateData.pictures) && updateData.pictures.length > 0) {
      logger.info('Processing image upload', { requestId, gurudwaraId: id });
      
      const uploadResult = await uploadImagesToS3({
        id,
        images: updateData.pictures,
      });

      if (!Array.isArray(uploadResult)) {
        logger.error('Image upload failed', undefined, { requestId, gurudwaraId: id });
        throw new Error('Image upload failed');
      }
      
      processedPictures = uploadResult;
      logger.info('Images uploaded successfully', { requestId, gurudwaraId: id, count: uploadResult.length });
    }

    // Prepare update data
    const fieldsToUpdate = {
      ...updateData,
      ...(processedPictures && { pictures: processedPictures }),
      updatedDate: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key as keyof UpdateGurudwaraRequest] === undefined) {
        delete fieldsToUpdate[key as keyof UpdateGurudwaraRequest];
      }
    });

    logger.logDatabaseOperation('update', 'gurudwara', { requestId, gurudwaraId: id });

    // Update gurudwara
    const updatedGurudwara = await gurudwaraDB.updateItem({ id }, fieldsToUpdate);

    logger.info('Gurudwara updated successfully', { requestId, gurudwaraId: id });

    return formatSuccessResponse(
      updatedGurudwara,
      'Gurudwara updated successfully',
      200,
      { requestId }
    );

  } catch (error) {
    const appError = handleError(error);
    logger.error('Failed to update gurudwara', error as Error, { requestId });
    
    return formatErrorResponse(appError, undefined, { requestId });
  }
};

export const main = middyfy(updateGurudwara);