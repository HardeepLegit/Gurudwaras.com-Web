import { z } from 'zod';

export const GurudwaraSchema = z.object({
  id: z.string(), // assuming it's a string ID
  name: z
    .object({
      pun: z.string().optional(),
      eng: z.string().optional(),
      hin: z.string().optional(),
    })
    .refine((val) => !!val.pun || !!val.eng || !!val.hin, {
      message: 'At least one name (pun, eng, or hin) must be provided.',
    }),
  phoneLandline: z.string().optional(),
  phoneMobile: z.string(),
  createdDate: z.string(),
  updatedDate: z.string(),
  emailId: z.string().email().optional(),
  website: z.string().url().optional(),
  accommodationAvailable: z.boolean().optional(),
  addedGurudwaras: z.array(z.string()).optional(), // assuming array of IDs/names
  pictures: z.array(z.string()).optional(), // assuming array of image URLs
  additionalInfo: z.object({
    pun: z.string().optional(),
    eng: z.string().optional(),
    hin: z.string().optional(),
  }),
  registrationNumber: z.string().optional(),
  latitude: z.string(),
  longitude: z.string(),
  addedByUserId: z.string(),
  approvedByAdmin: z.boolean().default(false),
  upcomingEvents: z.array(z.string()).optional(), // assuming array of event IDs/names
  address: z
    .object({
      pun: z.string().optional(),
      eng: z.string().optional(),
      hin: z.string().optional(),
    })
    .refine((val) => !!val.pun || !!val.eng || !!val.hin, {
      message: 'At least one name (pun, eng, or hin) must be provided.',
    }),
  city: z
    .object({
      pun: z.string().optional(),
      eng: z.string().optional(),
      hin: z.string().optional(),
    })
    .refine((val) => !!val.pun || !!val.eng || !!val.hin, {
      message: 'At least one name (pun, eng, or hin) must be provided.',
    }),
  state: z
    .object({
      pun: z.string().optional(),
      eng: z.string().optional(),
      hin: z.string().optional(),
    })
    .refine((val) => !!val.pun || !!val.eng || !!val.hin, {
      message: 'At least one name (pun, eng, or hin) must be provided.',
    }),
  postalCode: z.string().optional(),
  country: z
    .object({
      pun: z.string().optional(),
      eng: z.string().optional(),
      hin: z.string().optional(),
    })
    .refine((val) => !!val.pun || !!val.eng || !!val.hin, {
      message: 'At least one name (pun, eng, or hin) must be provided.',
    }),
  additionalDate: z
    .string()
    .refine((val) => /^\d{2}-\d{2}-\d{4}$/.test(val), { message: 'Must be in DD-MM-YYYY format' }),
  facilitiesAndServices: z.object({
    accommodationAvailable: z.boolean().optional(),
    langarAvailable: z.boolean().optional(),
    parkingAvailable: z.boolean().optional(),
  }),

  learningAndEducation: z.object({
    gurmatClasses: z.boolean().optional(),
    keertanClasses: z.boolean().optional(),
    sikhMartialArtsClasses: z.boolean().optional(),
    gurbaniSanthyaClasses: z.boolean().optional(),
  }),

  medicalFacilities: z.object({
    labFacilities: z.boolean().optional(),
    doctorAvailable: z.boolean().optional(),
    medicosAvailable: z.boolean().optional(),
  }),
  status: z.enum(['ONHOLD', 'PENDING', 'REJECTED', 'APPROVED']).default('PENDING'),
});
export const GurudwaraSchemaUser = z.object({
  id: z.string(), // assuming it's a string ID
  name: z.string().optional(),
  phoneLandline: z.string().optional(),
  phoneMobile: z.string(),
  createdDate: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  updatedDate: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  emailId: z.string().email().optional(),
  website: z.string().url().optional(),
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  youtube: z.string().url().optional(),
  accommodationAvailable: z.boolean().optional(),
  addedGurudwaras: z.array(z.string()).optional(), // assuming array of IDs/names
  pictures: z.array(z.string()).optional(), // assuming array of image URLs
  bannerImage: z.string().optional(),
  additionalInfo: z.string().optional(),
  registrationNumber: z.string().optional(),
  latitude: z.string(),
  longitude: z.string(),
  addedByUserId: z.string(),
  approvedByAdmin: z.boolean().default(false),
  upcomingEvents: z.array(z.object({})).optional(), // assuming array of event IDs/names
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  additionalDate: z.string().refine((val) => /^\d{2}-\d{2}-\d{4}$/.test(val), {
    message: 'Must be in DD-MM-YYYY format',
  }),
  facilitiesAndServices: z.object({
    accommodationAvailable: z.boolean().optional(),
    langarAvailable: z.boolean().optional(),
    parkingAvailable: z.boolean().optional(),
  }),

  learningAndEducation: z.object({
    gurmatClasses: z.boolean().optional(),
    keertanClasses: z.boolean().optional(),
    sikhMartialArtsClasses: z.boolean().optional(),
    gurbaniSanthyaClasses: z.boolean().optional(),
    institute: z.boolean().optional(),
    library: z.boolean().optional(),
    instituteInfo: z.string().optional(),
  }),
  // .refine(
  //   (data) => {
  //     if (data.institute === true && !data.instituteInfo) {
  //       return false;
  //     }
  //     return true;
  //   },
  //   {
  //     message: 'Institute name is required when institute is true',
  //   }
  // ),

  medicalFacilities: z.object({
    labFacilities: z.boolean().optional(),
    doctorAvailable: z.boolean().optional(),
    medicosAvailable: z.boolean().optional(),
    hospital: z.boolean().optional(),
    hospitalInfo: z.string().optional(),
  }),
  // .refine(
  //   (data) => {
  //     if (data.hospital === true && !data.hospitalInfo) {
  //       return false;
  //     }
  //     return true;
  //   },
  //   {
  //     message: 'Hospital name is required when hospital is true',
  //   }
  // ),
  singhSabha: z.boolean().default(false),
  singhSabhaInfo: z.string().optional(),
  status: z.enum(['ONHOLD', 'PENDING', 'REJECTED', 'APPROVED']).default('PENDING'),
});
// .refine(
//   (data) => {
//     if (data.singhSabha === true && !data.singhSabhaInfo) {
//       return false;
//     }
//     return true;
//   },
//   {
//     message: 'Singh Sabha info is required when Singh Sabha is true',
//   }
// );

const parseTime = (timeStr: string) => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours !== 12) {
    hours += 12;
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes; // total minutes since midnight
};

export const eventSchema = z.object({
  id: z.string(), // Optional for new events, required for updates
  Title: z.string().min(1, 'Event Title is required').max(200, 'Event Title is too long'),

  gurudwaraId: z.string().optional(),
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((val) => /^\d{2}-\d{2}-\d{4}$/.test(val), { message: 'Must be in DD-MM-YYYY format' }),
  endDate: z
    .string()
    .min(1, 'End date is required')
    .refine((val) => /^\d{2}-\d{2}-\d{4}$/.test(val), { message: 'Must be in DD-MM-YYYY format' }),
  createdDate: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  updatedDate: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  eventTimePeriod: z.array(
    z
      .object({
        startTime: z.string().min(1, 'Start time is required'),

        endTime: z.string().min(1, 'End time is required'),

        period: z.string().optional(),
      })
      .refine(
        (data) => {
          return parseTime(data.endTime) > parseTime(data.startTime);
        },
        {
          message: 'End time must be greater than start time',
          path: ['endTime'], // attach error to endTime
        }
      )
  ),

  location: z.string().min(1, 'Event location is required').max(500, 'Event location is too long'),
  gurudwaraName: z.string().optional(),
  addedByUserId: z.string().min(1, 'User ID is required'),
  eventDescription: z.string().min(1, 'Event description is required'),

  additionalInformation: z.string().optional(),
  description: z.string().optional(),
  youtubeLink: z
    .string()
    .optional()
    .or(z.literal('').transform(() => undefined)),

  additionalVideoUrls: z.array(z.string().url('Each video URL must be valid')).optional(),

  organizer: z
    .object({
      name: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().optional(),
      image: z.string().optional(),
    })
    .optional(),

  personalities: z
    .array(
      z.object({
        name: z.string().min(1, 'Personality name is required'),
        phoneNumber: z
          .string()
          .regex(/^\+?[0-9\s\-()]{7,}$/, 'Invalid phone number')
          .optional(),

        website: z.string().optional(),

        facebook: z.string().optional(),

        twitter: z.string().optional(),

        instagram: z.string().optional(),

        linkedin: z.string().optional(),
        youtube: z.string().optional(),
        profileImage: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .optional(),
  status: z.enum(['ONHOLD', 'PENDING', 'REJECTED', 'APPROVED']).default('PENDING'),
  bannerImages: z
    .array(z.string()) // You may use File/Blob if you're validating before upload
    .optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const profileSchema = z.object({
  id: z.string(),
  email: z.string().email(), // Required and must be a valid email
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  stateProvinceZip: z.string().optional(), // You can split into `state` and `zip` if needed
  countryCode: z.string().optional(), // Optional, default might be +1
  phoneNumber: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{7,15}$/.test(val), {
      message: 'Invalid phone number',
    }),
  // This field can help in managing if email/phone is verified
  isEmailVerified: z.boolean().optional(),
  isPhoneVerified: z.boolean().optional(),

  // Optional timestamps
  createdDate: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
  updatedDate: z
    .string()
    .optional()
    .default(() => new Date().toISOString()),
});
