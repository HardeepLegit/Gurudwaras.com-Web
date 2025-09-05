export interface Gurudwara {
  id: string;
  name: string;
  phoneLandline?: string;
  phoneMobile?: string;
  emailId?: string;
  website?: string;
  accommodationAvailable?: boolean;
  addedGurudwaras?: string[];
  pictures?: GurudwaraPicture[];
  additionalInfo?: string;
  registrationNumber?: string;
  latitude?: number;
  longitude?: number;
  addedByUserId: string;
  approvedByAdmin: boolean;
  upcomingEvents?: GurudwaraEvent[];
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
  additionalDate?: string;
  facilitiesAndServices?: FacilitiesAndServices;
  learningAndEducation?: LearningAndEducation;
  medicalFacilities?: MedicalFacilities;
  status: 'pending' | 'approved' | 'rejected' | 'inactive';
  createdDate: string;
  updatedDate: string;
}

export interface GurudwaraPicture {
  id: string;
  url: string;
  caption?: string;
  type: 'banner' | 'gallery' | 'interior' | 'exterior';
  uploadedDate: string;
}

export interface GurudwaraEvent {
  id: string;
  gurudwaraId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  eventType: 'religious' | 'cultural' | 'educational' | 'community';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organizer?: string;
  contactInfo?: ContactInfo;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
}

export interface FacilitiesAndServices {
  parking?: boolean;
  wheelchairAccessible?: boolean;
  restrooms?: boolean;
  kitchen?: boolean;
  library?: boolean;
  bookstore?: boolean;
  giftShop?: boolean;
  audioVisual?: boolean;
  wifi?: boolean;
  airConditioning?: boolean;
  heating?: boolean;
}

export interface LearningAndEducation {
  classes?: boolean;
  workshops?: boolean;
  lectures?: boolean;
  library?: boolean;
  onlineResources?: boolean;
  languageClasses?: boolean;
  musicClasses?: boolean;
  youthPrograms?: boolean;
}

export interface MedicalFacilities {
  firstAid?: boolean;
  nursingStation?: boolean;
  emergencyServices?: boolean;
  bloodDonation?: boolean;
  healthScreenings?: boolean;
  mentalHealthSupport?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'moderator';
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: string | string[];
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: PaginationMeta;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
}

export interface DatabaseConfig {
  region: string;
  tableName: string;
}

export interface LambdaContext {
  requestId: string;
  functionName: string;
  functionVersion: string;
  memoryLimitInMB: string;
  remainingTimeInMillis: number;
}