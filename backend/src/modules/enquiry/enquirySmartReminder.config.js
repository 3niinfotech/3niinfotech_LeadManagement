/** Days without outreach before the smart reminder cascade runs */
export const SMART_REMINDER_NO_FOLLOWUP_DAYS = 3;

export const SMART_REMINDER_SKIP_STATUSES = new Set([
  'LOST',
  'NOT_INTERESTED',
  'SPAM',
  'DUPLICATE',
  'CONVERTED',
  'CLOSED',
]);

export const SMART_REMINDER_PREFIX = '[Smart Reminder]';

export const SMART_REMINDER_STEPS = ['trigger', 'reminder', 'notification', 'email'];
