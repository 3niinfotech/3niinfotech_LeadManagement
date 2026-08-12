export const APPOINTMENT_MODES = [
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'ONLINE', label: 'Online' },
];

export const MEETING_PLATFORMS = [
  { value: 'GOOGLE_MEET', label: 'Google Meet' },
  { value: 'ZOOM', label: 'Zoom' },
];

export const APPOINTMENT_ROOMS = [
  'Room A',
  'Room B',
  'Counselling Hall',
  'Conference Room',
  'Reception',
];

export function getAppointmentModeLabel(value) {
  return APPOINTMENT_MODES.find((m) => m.value === value)?.label ?? value;
}

export function getMeetingPlatformLabel(value) {
  return MEETING_PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

export const DEFAULT_MEETING_LINKS = {
  GOOGLE_MEET: 'https://meet.google.com/new',
  ZOOM: 'https://zoom.us/start/videomeeting',
};
