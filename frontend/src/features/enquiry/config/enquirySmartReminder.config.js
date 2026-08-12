export const SMART_REMINDER_NO_FOLLOWUP_DAYS = 3;

export const SMART_REMINDER_FLOW = [
  {
    id: 'trigger',
    label: 'No Follow-up',
    suffix: '3 Days',
    description: 'Watches idle enquiries automatically',
  },
  {
    id: 'reminder',
    label: 'Reminder',
    description: 'Creates a follow-up reminder entry',
  },
  {
    id: 'notification',
    label: 'Notification',
    description: 'Alerts the assigned counsellor',
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Logs an automatic reminder email',
  },
];
