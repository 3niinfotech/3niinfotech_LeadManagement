import {
  CONVERSION_FLOW_STEPS,
  CONVERSION_BLOCKED_STATUSES,
} from '../config/enquiryConversion.config';

export function buildConversionFlow(enquiry) {
  if (!enquiry?.id) return null;

  const converted = enquiry.status === 'CONVERTED' || Boolean(enquiry.studentId);
  const lifecycle = enquiry.metadata?.lifecycle || {};
  const blocked = CONVERSION_BLOCKED_STATUSES.has(enquiry.status);

  const steps = CONVERSION_FLOW_STEPS.map((step) => {
    if (step.id === 'lead') {
      return {
        ...step,
        status: 'done',
        meta: enquiry.enquiryCode,
      };
    }
    if (step.id === 'convert') {
      return {
        ...step,
        status: converted ? 'done' : blocked ? 'blocked' : 'ready',
        meta: converted
          ? (lifecycle.linkedExisting ? 'Linked existing' : 'Promoted')
          : blocked
            ? 'Not available'
            : 'Ready',
      };
    }
    return {
      ...step,
      status: converted ? 'done' : 'pending',
      meta: enquiry.student?.studentCode || lifecycle.studentCode || null,
    };
  });

  return {
    converted,
    blocked,
    sameRecord: true,
    recordId: lifecycle.recordId || enquiry.id,
    enquiryCode: enquiry.enquiryCode,
    studentId: enquiry.studentId || lifecycle.studentId || null,
    studentCode: enquiry.student?.studentCode || lifecycle.studentCode || null,
    linkedExisting: lifecycle.linkedExisting === true,
    convertedAt: enquiry.convertedAt || lifecycle.convertedAt || null,
    steps,
    canConvert: !converted && !blocked,
  };
}
