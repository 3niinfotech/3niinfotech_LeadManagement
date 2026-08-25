/** Calendar event source constants — keep in sync with frontend calendar-event.config.js */

export const CALENDAR_SOURCE = {
  ENQUIRY_FOLLOWUP: 'EnquiryFollowup',
  ENQUIRY_APPOINTMENT: 'EnquiryAppointment',
  LEAD_FOLLOWUP: 'LeadFollowup',
  STUDENT_APPOINTMENT: 'Appointment',
  INVOICE_DUE: 'InvoiceDue',
  FEE_INSTALLMENT_DUE: 'FeeInstallmentDue',
  APPLICATION_OFFER: 'ApplicationOffer',
  VISA_EXPIRY: 'VisaExpiry',
  ENQUIRY_DEMO: 'EnquiryDemo',
  CLASS_SESSION: 'ClassSession',
};

export const CALENDAR_CATEGORY = {
  ENQUIRY: 'ENQUIRY',
  STUDENT: 'STUDENT',
  APPLICATION: 'APPLICATION',
  VISA: 'VISA',
  INVOICE: 'INVOICE',
  LEAD: 'LEAD',
  DEMO: 'DEMO',
  CLASS: 'CLASS',
};

export const CALENDAR_EVENT_TYPE = {
  FOLLOWUP: 'FOLLOWUP',
  APPOINTMENT: 'APPOINTMENT',
  DUE_DATE: 'DUE_DATE',
  OFFER: 'OFFER',
  EXPIRY: 'EXPIRY',
  DEMO: 'DEMO',
  CLASS: 'CLASS',
};

export function eventCompositeId(sourceType, sourceId) {
  return `${sourceType}:${sourceId}`;
}

export function parseCompositeId(id) {
  const idx = String(id || '').indexOf(':');
  if (idx <= 0) return null;
  return {
    sourceType: id.slice(0, idx),
    sourceId: id.slice(idx + 1),
  };
}
