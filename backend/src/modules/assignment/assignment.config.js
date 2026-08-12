/** Counsellor role slugs eligible for auto-assignment */
export const COUNSELLOR_ROLE_SLUGS = [
  'counsellor',
  'team_leader',
  'branch_manager',
  'company_admin',
  'super_admin',
];

/** Presence statuses that can receive new offers */
export const ROUTABLE_PRESENCE = ['AVAILABLE', 'WFH'];

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
