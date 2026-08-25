/**
 * Notification deep links — always open a detail/workspace page, never queue routes.
 */
export function leadDetailLink(lead) {
  if (!lead?.id) return '/admin/reception/walk-ins';
  if (lead.enquiry?.id) return `/admin/enquiries/${lead.enquiry.id}`;
  return `/admin/reception/walk-ins?open=${lead.id}`;
}

export function leadDetailLinkFromIds({ leadId, enquiryId } = {}) {
  if (enquiryId) return `/admin/enquiries/${enquiryId}`;
  if (leadId) return `/admin/reception/walk-ins?open=${leadId}`;
  return '/admin/reception/walk-ins';
}
