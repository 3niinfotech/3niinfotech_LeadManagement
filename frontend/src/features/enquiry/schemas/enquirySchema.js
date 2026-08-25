import { z } from 'zod';
import { DEFAULT_MANDATORY } from '../../../config/company-settings.config';

/** API / Ant Design may send null for empty optional fields — normalize before validation */
const nullishToEmpty = (val) => (val == null ? '' : val);
const nullishToEmptyArray = (val) => (val == null ? [] : val);

const optionalString = () =>
  z.preprocess(nullishToEmpty, z.string().optional());

const optionalStringMax = (max) =>
  z.preprocess(nullishToEmpty, z.string().max(max).optional());

const requiredString = (message) =>
  z.preprocess(nullishToEmpty, z.string().min(1, message));

export const testGivenSchema = z.object({
  name: optionalString(),
  score: optionalString(),
});

function fieldSchema(mandatory, key, requiredMessage, extra) {
  if (mandatory[key]) {
    if (extra === 'email') {
      return z.preprocess(nullishToEmpty, z.string().min(1, requiredMessage).email('Valid email required'));
    }
    if (extra === 'mobile') {
      return z.preprocess(nullishToEmpty, z.string().min(6, requiredMessage));
    }
    if (extra === 'tests') {
      return z.preprocess(nullishToEmptyArray, z.array(testGivenSchema).min(1, requiredMessage));
    }
    return requiredString(requiredMessage);
  }
  if (extra === 'email') {
    return z.preprocess(
      nullishToEmpty,
      z.union([z.literal(''), z.string().email('Valid email required')]).optional(),
    );
  }
  if (extra === 'tests') {
    return z.preprocess(nullishToEmptyArray, z.array(testGivenSchema).optional());
  }
  return optionalString();
}

export function buildEnquiryFormSchema(mandatory = DEFAULT_MANDATORY) {
  const m = { ...DEFAULT_MANDATORY, ...mandatory };
  return z.object({
    firstName: fieldSchema(m, 'firstName', 'First name is required'),
    lastName: fieldSchema(m, 'lastName', 'Last name is required'),
    email: fieldSchema(m, 'email', 'Email is required', 'email'),
    mobile: fieldSchema(m, 'mobile', 'Mobile is required', 'mobile'),
    mobileCountry: optionalString(),
    alternateNo: fieldSchema(m, 'alternateNo', 'Alternate number is required'),
    passportNo: fieldSchema(m, 'passportNo', 'Passport number is required'),
    dateOfBirth: fieldSchema(m, 'dateOfBirth', 'Date of birth is required'),
    gender: fieldSchema(m, 'gender', 'Gender is required'),
    nationality: fieldSchema(m, 'nationality', 'Nationality is required'),
    maritalStatus: fieldSchema(m, 'maritalStatus', 'Marital status is required'),
    address: fieldSchema(m, 'address', 'Address is required'),
    highestQual: fieldSchema(m, 'highestQual', 'Qualification is required'),
    interestedCourse: fieldSchema(m, 'interestedCourse', 'Interested course is required'),
    testsGiven: fieldSchema(m, 'testsGiven', 'At least one test is required', 'tests'),
    interestedCountry: fieldSchema(m, 'interestedCountry', 'Interested country is required'),
    intake: fieldSchema(m, 'intake', 'Intake is required'),
    applyLevel: fieldSchema(m, 'applyLevel', 'Apply level is required'),
    source: fieldSchema(m, 'source', 'Source is required'),
    otherReference: optionalString(),
    status: fieldSchema(m, 'status', 'Status is required'),
    priority: optionalString(),
    tags: z.preprocess(nullishToEmptyArray, z.array(z.string()).optional()),
    remark: m.remark
      ? z.preprocess(nullishToEmpty, z.string().min(1, 'Remark is required').max(2000))
      : optionalStringMax(2000),
    followUpDate: optionalString(),
    followUpTime: optionalString(),
    followUpRemarks: optionalString(),
    appointmentDate: optionalString(),
    appointmentTime: optionalString(),
    appointmentRemarks: optionalString(),
    branchId: z.preprocess(
      nullishToEmpty,
      z.string().uuid().optional().or(z.literal('')),
    ),
    assignedToId: z.preprocess(
      (val) => (val === '' || val == null ? null : val),
      z.string().uuid().optional().nullable(),
    ),
  });
}

export const enquiryFormSchema = buildEnquiryFormSchema();

export const dropEnquirySchema = z.object({
  dropReason: z.string().min(3, 'Drop reason is required'),
});
