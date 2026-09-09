/** Default scoring weights (overridable via company.settings.assignment.scoring) */
export const DEFAULT_SCORING_WEIGHTS = {
  countryMatch: 30,
  courseMatch: 20,
  branchMatch: 20,
  languageMatch: 10,
  serviceMatch: 10,
  capacityHeadroom: 15,
  availability: 10,
  priorityBoost: 5,
  roundRobinMax: 20,
};

/** Assignment modes stored in company.settings.assignment.mode */
export const ASSIGNMENT_MODES = {
  MANUAL: 'manual',
  AUTO: 'automatic',
  HYBRID: 'hybrid',
};

export const DEFAULT_ASSIGNMENT_CONFIG = {
  mode: ASSIGNMENT_MODES.HYBRID,
  scoring: DEFAULT_SCORING_WEIGHTS,
  fallback: ['specialist', 'course_specialist', 'same_branch', 'general_pool', 'unassigned'],
  autoAssignOnEnquiryCreate: true,
  autoAssignOnWalkInCreate: false,
  notifyManagerOnUnassigned: true,
  slaMinutes: {
    warning: 10,
    escalate: 15,
    managerNotify: 20,
    mandatoryReassign: 30,
  },
  slaEnabled: true,
  slaAutoReassign: false,
};

/** System-derived availability states (not manual presence labels) */
export const AVAILABILITY_STATE = {
  AVAILABLE: 'AVAILABLE',
  TEMPORARILY_BUSY: 'TEMPORARILY_BUSY',
  ON_LEAVE: 'ON_LEAVE',
  OUTSIDE_WORKING_HOURS: 'OUTSIDE_WORKING_HOURS',
  AT_CAPACITY: 'AT_CAPACITY',
  INELIGIBLE: 'INELIGIBLE',
  UNAVAILABLE: 'UNAVAILABLE',
  OFFLINE: 'OFFLINE',
};

/** Read-only UI labels for system-derived availability */
export const AVAILABILITY_DISPLAY = {
  [AVAILABILITY_STATE.AVAILABLE]: { label: 'Available', tone: 'success' },
  [AVAILABILITY_STATE.TEMPORARILY_BUSY]: { label: 'Temporarily Busy', tone: 'warning' },
  [AVAILABILITY_STATE.ON_LEAVE]: { label: 'On Leave', tone: 'danger' },
  [AVAILABILITY_STATE.OUTSIDE_WORKING_HOURS]: { label: 'Outside Working Hours', tone: 'caution' },
  [AVAILABILITY_STATE.AT_CAPACITY]: { label: 'At Capacity', tone: 'caution' },
  [AVAILABILITY_STATE.INELIGIBLE]: { label: 'Ineligible', tone: 'neutral' },
  [AVAILABILITY_STATE.UNAVAILABLE]: { label: 'Unavailable', tone: 'danger' },
  [AVAILABILITY_STATE.OFFLINE]: { label: 'Offline', tone: 'neutral' },
};

/** Roles that may receive counselling work / appear in assign lists */
export const COUNSELLOR_ROLE_SLUGS = [
  'counsellor',
  'team_leader',
];

/** Reception assign list — counselling staff only */
export const RECEPTION_ASSIGN_ROLE_SLUGS = [
  'counsellor',
  'team_leader',
];

/** @deprecated Manual presence no longer gates routing — retained for legacy DB rows only */
export const ROUTABLE_PRESENCE = ['AVAILABLE', 'WFH'];

/** @deprecated Manual status holds removed — availability is system-derived */
export const PRESENCE_HOLD_MS = {};
export const PRESENCE_PERMANENT_HOLD = [];

export const DEFAULT_SLA = {
  warningMinutes: 10,
  escalateMinutes: 15,
  managerNotifyMinutes: 20,
  mandatoryReassignMinutes: 30,
};

export const OFFER_TIMEOUT_SECONDS = 120;
export const MAX_CONCURRENT_SESSIONS = 1;

/** Default Mon–Sat 10:00–19:00 when staff hours not configured */
export const DEFAULT_WORKING_HOURS = [
  { dayOfWeek: 0, isWorkingDay: false, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 1, isWorkingDay: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 2, isWorkingDay: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 3, isWorkingDay: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 4, isWorkingDay: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 5, isWorkingDay: true, startTime: '10:00', endTime: '19:00' },
  { dayOfWeek: 6, isWorkingDay: true, startTime: '10:00', endTime: '19:00' },
];
