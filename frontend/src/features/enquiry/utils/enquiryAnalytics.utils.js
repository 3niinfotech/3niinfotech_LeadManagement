import { buildEnquiryAiSummary, getConversionTone } from './enquiryAiSummary.utils';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_MINUTE = 1000 * 60;

const STATUS_BASE_SCORE = {
  NEW: 18,
  CONTACTED: 28,
  INTERESTED: 42,
  HIGHLY_INTERESTED: 58,
  FOLLOW_UP: 36,
  APPOINTMENT: 48,
  DEMO_SCHEDULED: 62,
  DEMO_ATTENDED: 72,
  DOCUMENTS_PENDING: 68,
  COUNSELLING: 52,
  CONVERTED: 100,
  LOST: 8,
  NOT_INTERESTED: 12,
  SPAM: 0,
  DUPLICATE: 0,
  CLOSED: 15,
};

/** Funnel stage progress — distinct from win probability */
const FUNNEL_STAGE_PERCENT = {
  NEW: 8,
  CONTACTED: 16,
  INTERESTED: 28,
  HIGHLY_INTERESTED: 40,
  FOLLOW_UP: 24,
  APPOINTMENT: 48,
  DEMO_SCHEDULED: 58,
  DEMO_ATTENDED: 72,
  DOCUMENTS_PENDING: 78,
  COUNSELLING: 52,
  APPLICATION_SUBMITTED: 85,
  CONVERTED: 100,
  LOST: 0,
  NOT_INTERESTED: 5,
  SPAM: 0,
  DUPLICATE: 0,
  CLOSED: 10,
};

const PRIORITY_BOOST = { URGENT: 6, HIGH: 4, MEDIUM: 0, LOW: -3 };

function daysBetween(from, to = new Date()) {
  if (!from) return null;
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.max(0, Math.floor((end - start) / MS_PER_DAY));
}

function getFirstResponseAt(enquiry) {
  const events = [
    ...(enquiry?.followups || []).map((f) => f.followupAt || f.createdAt),
    ...(enquiry?.communications || []).map((c) => c.sentAt || c.createdAt),
  ].filter(Boolean);

  if (events.length === 0) return null;
  return events.reduce((earliest, current) => (
    new Date(current) < new Date(earliest) ? current : earliest
  ));
}

function formatResponseTime(enquiry) {
  const created = enquiry?.createdAt;
  const firstResponse = getFirstResponseAt(enquiry);
  if (!created) return '—';
  if (!firstResponse) return 'No response yet';

  const diffMs = new Date(firstResponse).getTime() - new Date(created).getTime();
  if (diffMs < 0) return '< 1 min';

  const hours = Math.floor(diffMs / MS_PER_HOUR);
  const minutes = Math.floor((diffMs % MS_PER_HOUR) / MS_PER_MINUTE);

  if (hours >= 48) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours >= 1) return `${hours}h ${minutes}m`;
  if (minutes >= 1) return `${minutes} min`;
  return '< 1 min';
}

function getLastFollowUpAt(enquiry) {
  const followups = enquiry?.followups || [];
  if (followups.length === 0) return null;

  return followups.reduce((latest, row) => {
    const at = row.followupAt || row.createdAt;
    if (!at) return latest;
    if (!latest || new Date(at) > new Date(latest)) return at;
    return latest;
  }, null);
}

function calculateLeadScore(enquiry) {
  if (!enquiry?.id) return 0;

  const profileFields = [
    enquiry.firstName,
    enquiry.mobile,
    enquiry.email,
    enquiry.interestedCountry,
    enquiry.interestedCourse,
  ];
  const completeness = (profileFields.filter(Boolean).length / profileFields.length) * 28;

  const followups = enquiry.followups?.length || 0;
  const communications = enquiry.communications?.length || 0;
  const notes = enquiry.notes?.length || 0;
  const appointments = enquiry.appointments?.length || 0;
  const demos = enquiry.demos?.length || 0;
  const engagement = Math.min(
    42,
    followups * 5 + communications * 3 + notes * 4 + appointments * 6 + demos * 7,
  );

  const statusScore = (STATUS_BASE_SCORE[enquiry.status] ?? 20) * 0.22;
  const priority = PRIORITY_BOOST[enquiry.priority] ?? 0;
  const recencyBoost = (() => {
    const days = daysBetween(enquiry.lastTouchedAt);
    if (days == null) return 0;
    if (days <= 2) return 8;
    if (days <= 7) return 4;
    if (days > 14) return -6;
    return 0;
  })();

  return Math.max(0, Math.min(100, Math.round(completeness + engagement + statusScore + priority + recencyBoost)));
}

function getScoreTone(score) {
  if (score >= 75) return 'success';
  if (score >= 45) return 'warning';
  return 'danger';
}

export function buildEnquiryAnalytics(enquiry) {
  if (!enquiry?.id) return null;

  const summary = buildEnquiryAiSummary(enquiry);
  const leadScore = calculateLeadScore(enquiry);
  const probability = summary?.conversionChance ?? 0;
  const conversionPercent = FUNNEL_STAGE_PERCENT[enquiry.status] ?? 20;
  const daysSinceCreated = daysBetween(enquiry.createdAt) ?? 0;
  const daysWithoutFollowUp = (() => {
    const lastFollowUp = getLastFollowUpAt(enquiry);
    if (lastFollowUp) return daysBetween(lastFollowUp) ?? 0;
    return daysSinceCreated;
  })();

  return {
    leadScore,
    leadScoreTone: getScoreTone(leadScore),
    probability,
    probabilityTone: getConversionTone(probability),
    daysSinceCreated,
    daysWithoutFollowUp,
    conversionPercent,
    conversionTone: getConversionTone(conversionPercent),
    responseTime: formatResponseTime(enquiry),
    responseTimeMs: (() => {
      const first = getFirstResponseAt(enquiry);
      if (!enquiry.createdAt || !first) return null;
      return new Date(first).getTime() - new Date(enquiry.createdAt).getTime();
    })(),
    generatedAt: enquiry.updatedAt || enquiry.lastTouchedAt || enquiry.createdAt,
  };
}
