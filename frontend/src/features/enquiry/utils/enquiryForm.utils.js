const NULLABLE_STRING_FIELDS = [
  'lastName', 'mobileCountry', 'alternateNo', 'passportNo', 'dateOfBirth',
  'gender', 'nationality', 'maritalStatus', 'address',
  'highestQual', 'interestedCourse', 'interestedCountry', 'intake', 'applyLevel',
  'source', 'otherReference', 'status', 'priority', 'remark',
  'followUpDate', 'followUpTime', 'followUpRemarks',
  'appointmentDate', 'appointmentTime', 'appointmentRemarks',
];

/** Map API enquiry record to react-hook-form values (null → empty string) */
export function mapEnquiryToFormValues(enquiry, defaults = {}) {
  if (!enquiry) return { ...defaults };
  const mapped = { ...defaults, ...enquiry };
  NULLABLE_STRING_FIELDS.forEach((key) => {
    if (mapped[key] == null) mapped[key] = '';
  });
  mapped.dateOfBirth = enquiry.dateOfBirth?.slice?.(0, 10) || '';
  mapped.testsGiven = Array.isArray(enquiry.testsGiven) ? enquiry.testsGiven : [];
  mapped.tags = Array.isArray(enquiry.tags) ? enquiry.tags : [];
  mapped.assignedToId = enquiry.assignedToId || '';
  return mapped;
}

export function combineDateAndTime(date, time) {
  if (!date) return null;
  if (!time) return date;
  const normalized = time.length === 5 ? `${time}:00` : time;
  return `${date}T${normalized}`;
}

export function splitDateTime(iso) {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
}

const TAB_FIELDS = {
  personal: [
    'firstName', 'lastName', 'email', 'mobile', 'mobileCountry', 'alternateNo',
    'passportNo', 'dateOfBirth', 'gender', 'nationality', 'maritalStatus', 'address',
  ],
  other: [
    'highestQual', 'interestedCourse', 'interestedCountry', 'intake', 'applyLevel', 'source',
    'assignedToId', 'otherReference', 'status', 'priority', 'tags', 'remark', 'testsGiven',
  ],
  followup: ['followUpDate', 'followUpTime', 'followUpRemarks'],
  appointment: ['appointmentDate', 'appointmentTime', 'appointmentRemarks'],
  overview: [
    'firstName', 'lastName', 'email', 'mobile', 'mobileCountry', 'alternateNo', 'passportNo',
    'dateOfBirth', 'gender', 'nationality', 'maritalStatus', 'address',
    'highestQual', 'interestedCourse', 'interestedCountry', 'intake', 'applyLevel', 'source',
    'assignedToId', 'otherReference', 'status', 'priority', 'tags', 'remark', 'testsGiven',
  ],
};

export function getTabErrors(errors, tabId) {
  const fields = TAB_FIELDS[tabId] || [];
  return fields.some((f) => {
    if (f === 'testsGiven') return Boolean(errors.testsGiven);
    return Boolean(errors[f]);
  });
}

export function buildTabErrorMap(errors) {
  return Object.keys(TAB_FIELDS).reduce((acc, tabId) => {
    acc[tabId] = getTabErrors(errors, tabId);
    return acc;
  }, {});
}
