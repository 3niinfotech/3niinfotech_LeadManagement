import { DEFAULT_SCORING_WEIGHTS, DEFAULT_ASSIGNMENT_CONFIG } from './assignment.config.js';
import { isHotLeadPriority } from './availability.engine.js';

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function includesMatch(list, needle) {
  if (!needle || !Array.isArray(list) || !list.length) return false;
  const n = normalize(needle);
  return list.some((item) => {
    const v = normalize(item);
    return v === n || n.includes(v) || v.includes(n);
  });
}

export function mergeAssignmentConfig(companySettings = {}) {
  const raw = companySettings?.assignment || {};
  return {
    mode: raw.mode || 'hybrid',
    scoring: { ...DEFAULT_SCORING_WEIGHTS, ...(raw.scoring || {}) },
    fallback: raw.fallback || ['specialist', 'course_specialist', 'same_branch', 'general_pool', 'unassigned'],
    autoAssignOnEnquiryCreate: raw.autoAssignOnEnquiryCreate !== false,
    autoAssignOnWalkInCreate: Boolean(raw.autoAssignOnWalkInCreate),
    notifyManagerOnUnassigned: raw.notifyManagerOnUnassigned !== false,
    slaMinutes: { ...DEFAULT_ASSIGNMENT_CONFIG.slaMinutes, ...(raw.slaMinutes || {}) },
    slaEnabled: raw.slaEnabled !== false,
    slaAutoReassign: Boolean(raw.slaAutoReassign),
  };
}

/**
 * Score a counsellor for a lead/enquiry hint.
 * Returns { score, maxScore, breakdown, reasons, eligible, tier }.
 */
export function scoreCounsellorForLead({
  counsellor,
  availability,
  workload,
  lead,
  branchId,
  weights = DEFAULT_SCORING_WEIGHTS,
  priority = 'MEDIUM',
}) {
  const breakdown = {};
  const reasons = [];
  const exclusions = [];

  if (!availability?.eligible) {
    exclusions.push(...(availability.exclusions || []));
    return {
      score: 0,
      maxScore: 100,
      percent: 0,
      breakdown,
      reasons,
      exclusions,
      eligible: false,
      tier: 'excluded',
      routable: false,
    };
  }

  const skills = counsellor.skillsProfile || { countries: [], courses: [], languages: [], services: [] };
  let score = 0;
  let maxScore = 0;

  const add = (key, weight, matched, reasonText) => {
    maxScore += weight;
    if (matched) {
      score += weight;
      breakdown[key] = weight;
      if (reasonText) reasons.push(reasonText);
    } else {
      breakdown[key] = 0;
    }
  };

  const country = lead.country || lead.interestedCountry;
  const course = lead.interestedCourse;
  const language = lead.metadata?.preferredLanguage || lead.preferredLanguage;
  const service = lead.metadata?.visitPurpose || lead.visitPurpose;

  add('countryMatch', weights.countryMatch, country && includesMatch(skills.countries, country),
    country && includesMatch(skills.countries, country) ? `${country} specialist` : null);
  add('courseMatch', weights.courseMatch, course && includesMatch(skills.courses, course),
    course && includesMatch(skills.courses, course) ? `${course} specialist` : null);
  add('branchMatch', weights.branchMatch, counsellor.branchId === branchId,
    counsellor.branchId === branchId ? 'Same branch' : null);
  add('languageMatch', weights.languageMatch, language && includesMatch(skills.languages, language),
    language && includesMatch(skills.languages, language) ? `${language} language` : null);
  add('serviceMatch', weights.serviceMatch, service && includesMatch(skills.services, service),
    service && includesMatch(skills.services, service) ? 'Service match' : null);

  const capacityPct = workload?.activeLeadCapacityPct ?? 0;
  const capacityScore = Math.max(0, weights.capacityHeadroom * (1 - capacityPct / 100));
  maxScore += weights.capacityHeadroom;
  score += capacityScore;
  breakdown.capacityHeadroom = Math.round(capacityScore);
  if (capacityPct <= 100) reasons.push(`${Math.round(capacityPct)}% workload`);

  maxScore += weights.availability;
  if (availability.state === 'AVAILABLE') {
    score += weights.availability;
    breakdown.availability = weights.availability;
    reasons.push('Currently available');
  } else if (availability.state === 'TEMPORARILY_BUSY') {
    score += Math.round(weights.availability * 0.3);
    breakdown.availability = Math.round(weights.availability * 0.3);
    reasons.push('Temporarily busy — lower priority');
  } else {
    breakdown.availability = 0;
  }

  if (isHotLeadPriority(priority)) {
    maxScore += weights.priorityBoost;
    if (availability.state === 'AVAILABLE' && capacityPct < 85) {
      score += weights.priorityBoost;
      breakdown.priorityBoost = weights.priorityBoost;
      reasons.push('Hot lead priority');
    }
  }

  const rrBonus = Math.min(weights.roundRobinMax || 20, workload?.roundRobinBonus || 0);
  maxScore += weights.roundRobinMax || 20;
  score += rrBonus;
  breakdown.roundRobin = rrBonus;

  const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  let tier = 'general';
  if (breakdown.countryMatch > 0 && breakdown.courseMatch > 0) tier = 'specialist';
  else if (breakdown.courseMatch > 0) tier = 'course_specialist';
  else if (breakdown.branchMatch > 0) tier = 'same_branch';

  return {
    score: Math.round(score),
    maxScore: Math.round(maxScore),
    percent,
    breakdown,
    reasons: reasons.filter(Boolean),
    exclusions,
    eligible: true,
    tier,
    routable: availability.state === 'AVAILABLE' || (availability.state === 'TEMPORARILY_BUSY' && percent >= 60),
  };
}

export function pickBestCandidate(scoredRows, fallbackOrder = []) {
  const eligible = scoredRows.filter((r) => r.routable);
  if (!eligible.length) return { selected: null, candidates: scoredRows };

  const tierPriority = fallbackOrder.length
    ? fallbackOrder
    : ['specialist', 'course_specialist', 'same_branch', 'general'];

  for (const tier of tierPriority) {
    if (tier === 'unassigned') continue;
    const pool = eligible.filter((r) => r.tier === tier).sort((a, b) => b.percent - a.percent);
    if (pool.length) return { selected: pool[0], candidates: scoredRows };
  }

  const best = [...eligible].sort((a, b) => b.percent - a.percent)[0];
  return { selected: best, candidates: scoredRows };
}
