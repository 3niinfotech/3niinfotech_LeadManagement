/** Roles that may receive counselling work / appear in assign lists */
export const COUNSELLOR_ROLE_SLUGS = [
  'counsellor',
  'team_leader',
];

/** Reception assign list — counselling staff only (never Admin / Super Admin) */
export const RECEPTION_ASSIGN_ROLE_SLUGS = [
  'counsellor',
  'team_leader',
];

/** Presence statuses that can receive new offers */
export const ROUTABLE_PRESENCE = ['AVAILABLE', 'WFH'];

/** Manual presence holds — auto Free resumes after TTL (ms). LEAVE stays until cleared. */
export const PRESENCE_HOLD_MS = {
  LUNCH: 60 * 60 * 1000,
  BREAK: 20 * 60 * 1000,
  MEETING: 2 * 60 * 60 * 1000,
  TRAINING: 4 * 60 * 60 * 1000,
  DND: 60 * 60 * 1000,
  BUSY: 2 * 60 * 60 * 1000,
};

export const PRESENCE_PERMANENT_HOLD = ['LEAVE'];

/** Default SLA thresholds (minutes) — overridable per branch in metadata */
export const DEFAULT_SLA = {
  warningMinutes: 10,
  escalateMinutes: 15,
  managerNotifyMinutes: 20,
  mandatoryReassignMinutes: 30,
};

/** Offer accept window (seconds) */
export const OFFER_TIMEOUT_SECONDS = 120;

/** Max concurrent active sessions per counsellor */
export const MAX_CONCURRENT_SESSIONS = 1;
