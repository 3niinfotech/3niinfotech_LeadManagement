/** Follow-up / outreach action types — stored in EnquiryFollowup.stage */
export const ENQUIRY_FOLLOWUP_ACTIONS = [
  { value: 'CALL', label: 'Call', icon: 'phone', color: 'primary', calendar: false },
  { value: 'MEETING', label: 'Meeting', icon: 'users', color: 'success', calendar: true },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'messageSquare', color: 'success', calendar: false },
  { value: 'EMAIL', label: 'Email', icon: 'mail', color: 'info', calendar: false },
  { value: 'SMS', label: 'SMS', icon: 'message', color: 'info', calendar: false },
  { value: 'REMINDER', label: 'Reminder', icon: 'bell', color: 'warning', calendar: true },
  { value: 'VIDEO_CALL', label: 'Video Call', icon: 'video', color: 'primary', calendar: true },
];

export const FOLLOWUP_ACTION_VALUES = ENQUIRY_FOLLOWUP_ACTIONS.map((a) => a.value);

export function getFollowupActionMeta(value) {
  return ENQUIRY_FOLLOWUP_ACTIONS.find((a) => a.value === value);
}

export function getFollowupActionLabel(value) {
  return getFollowupActionMeta(value)?.label ?? value;
}
