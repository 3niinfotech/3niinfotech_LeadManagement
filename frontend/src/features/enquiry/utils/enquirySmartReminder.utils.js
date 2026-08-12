import {
  SMART_REMINDER_NO_FOLLOWUP_DAYS,
  SMART_REMINDER_FLOW,
} from '../config/enquirySmartReminder.config';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const SMART_REMINDER_PREFIX = '[Smart Reminder]';

function isSystemFollowup(followup) {
  return followup?.stage === 'REMINDER' && String(followup?.remark || '').startsWith(SMART_REMINDER_PREFIX);
}

function getLastOutreachFollowUpAt(enquiry) {
  const followups = (enquiry?.followups || []).filter((row) => !isSystemFollowup(row));
  if (followups.length === 0) return null;

  return followups.reduce((latest, row) => {
    const at = row.followupAt || row.createdAt;
    if (!at) return latest;
    if (!latest || new Date(at) > new Date(latest)) return at;
    return latest;
  }, null);
}

function daysWithoutFollowUp(enquiry) {
  const anchor = getLastOutreachFollowUpAt(enquiry) || enquiry?.createdAt;
  if (!anchor) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(anchor).getTime()) / MS_PER_DAY));
}

function formatStepTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function buildSmartReminderFlow(enquiry) {
  if (!enquiry?.id) return null;

  const days = daysWithoutFollowUp(enquiry);
  const meta = enquiry.metadata?.smartReminder || {};
  const stepMeta = meta.steps || {};
  const completed = Boolean(meta.completedAt);
  const thresholdReached = days >= SMART_REMINDER_NO_FOLLOWUP_DAYS;
  const daysLeft = Math.max(0, SMART_REMINDER_NO_FOLLOWUP_DAYS - days);

  let phase = 'watching';
  if (completed) phase = 'completed';
  else if (thresholdReached) phase = 'ready';

  const steps = SMART_REMINDER_FLOW.map((step, index) => {
    const saved = stepMeta[step.id] || {};

    if (step.id === 'trigger') {
      let status = 'idle';
      if (thresholdReached || completed) status = 'done';
      else if (days > 0) status = 'active';

      return {
        ...step,
        status,
        at: completed ? meta.completedAt : null,
        atLabel: completed ? formatStepTime(meta.completedAt) : null,
      };
    }

    if (saved.done || (completed && saved.done !== false)) {
      return {
        ...step,
        status: 'done',
        at: saved.at || null,
        atLabel: formatStepTime(saved.at),
      };
    }

    if (thresholdReached && !completed && index === 1) {
      return { ...step, status: 'active', at: null, atLabel: null };
    }

    return { ...step, status: 'pending', at: null, atLabel: null };
  });

  return {
    daysWithoutFollowUp: days,
    thresholdDays: SMART_REMINDER_NO_FOLLOWUP_DAYS,
    daysLeft,
    phase,
    completed,
    completedAt: meta.completedAt || null,
    completedAtLabel: formatStepTime(meta.completedAt),
    steps,
    headline: completed
      ? 'Smart reminder sent automatically'
      : thresholdReached
        ? 'Threshold reached — automation runs when profile opens'
        : daysLeft === 0
          ? 'Due today if no follow-up is logged'
          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} until auto reminder`,
  };
}
