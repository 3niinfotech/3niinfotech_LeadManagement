import { z } from 'zod';

/** API / Ant Design may send null for empty optional fields — normalize before validation */
const nullishToEmpty = (val) => (val == null ? '' : val);
const nullishToEmptyArray = (val) => (val == null ? [] : val);

const optionalString = () =>
  z.preprocess(nullishToEmpty, z.string().optional());

const optionalStringMax = (max) =>
  z.preprocess(nullishToEmpty, z.string().max(max).optional());

export const testGivenSchema = z.object({
  name: optionalString(),
  score: optionalString(),
});

export const personalDetailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: optionalString(),
  email: z.preprocess(nullishToEmpty, z.string().email('Valid email required')),
  mobile: z.string().min(6, 'Mobile is required'),
  mobileCountry: optionalString(),
  alternateNo: optionalString(),
  passportNo: optionalString(),
  dateOfBirth: optionalString(),
  gender: optionalString(),
  nationality: optionalString(),
  maritalStatus: optionalString(),
  address: optionalString(),
});

export const otherDetailsSchema = z.object({
  highestQual: optionalString(),
  interestedCourse: optionalString(),
  testsGiven: z.preprocess(nullishToEmptyArray, z.array(testGivenSchema).optional()),
  interestedCountry: optionalString(),
  intake: optionalString(),
  applyLevel: optionalString(),
  source: optionalString(),
  otherReference: optionalString(),
  status: optionalString(),
  priority: optionalString(),
  tags: z.preprocess(nullishToEmptyArray, z.array(z.string()).optional()),
  remark: optionalStringMax(2000),
});

export const followUpFormSchema = z.object({
  followUpDate: optionalString(),
  followUpTime: optionalString(),
  followUpRemarks: optionalString(),
});

export const appointmentFormSchema = z.object({
  appointmentDate: optionalString(),
  appointmentTime: optionalString(),
  appointmentRemarks: optionalString(),
});

export const enquiryFormSchema = personalDetailsSchema
  .merge(otherDetailsSchema)
  .merge(followUpFormSchema)
  .merge(appointmentFormSchema)
  .extend({
    branchId: z.preprocess(
      nullishToEmpty,
      z.string().uuid().optional().or(z.literal('')),
    ),
    assignedToId: z.preprocess(
      (val) => (val === '' || val == null ? null : val),
      z.string().uuid().optional().nullable(),
    ),
  });

export const dropEnquirySchema = z.object({
  dropReason: z.string().min(3, 'Drop reason is required'),
});
