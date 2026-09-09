import { getDocumentUrl } from './enquiryDocument.config';

export const COMMUNICATION_CHANNELS = [
  { value: 'CALL', label: 'Calls', icon: 'phone', color: 'primary' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: 'messageSquare', color: 'success' },
  { value: 'EMAIL', label: 'Emails', icon: 'mail', color: 'info' },
  { value: 'SMS', label: 'SMS', icon: 'message', color: 'warning' },
  { value: 'VOICE_NOTE', label: 'Voice Notes', icon: 'mic', color: 'secondary' },
];

export const COMMUNICATION_STATUS_OPTIONS = [
  { value: 'SENT', label: 'Sent' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'READ', label: 'Read' },
  { value: 'FAILED', label: 'Failed' },
];

export const COMMUNICATION_DIRECTION_OPTIONS = [
  { value: 'OUTBOUND', label: 'Outbound' },
  { value: 'INBOUND', label: 'Inbound' },
];

export function getCommunicationChannelLabel(value) {
  return COMMUNICATION_CHANNELS.find((c) => c.value === value)?.label ?? value;
}

export function getCommunicationChannelMeta(value) {
  return COMMUNICATION_CHANNELS.find((c) => c.value === value) || { label: value, color: 'secondary' };
}

export function getCommunicationStatusLabel(value) {
  return COMMUNICATION_STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

export function getCommunicationStatusTone(value) {
  const tones = { SENT: 'info', DELIVERED: 'primary', READ: 'success', FAILED: 'danger' };
  return tones[value] || 'secondary';
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function getVoiceNoteUrl(filePath) {
  return getDocumentUrl(filePath);
}
