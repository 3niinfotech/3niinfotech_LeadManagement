import { parseDate, parseDateTime } from '@internationalized/date';
import dayjs from 'dayjs';

const pad = (n) => String(n).padStart(2, '0');

/** YYYY-MM-DD string → CalendarDate | null */
export function stringToCalendarDate(value) {
  if (!value) return null;
  try {
    const normalized = dayjs(value).format('YYYY-MM-DD');
    return parseDate(normalized);
  } catch {
    return null;
  }
}

/** CalendarDate | null → YYYY-MM-DD string */
export function calendarDateToString(date) {
  if (!date) return '';
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`;
}

/** JS Date | string → CalendarDate | undefined */
export function toMinMaxValue(value) {
  if (!value) return undefined;
  const str = value instanceof Date
    ? dayjs(value).format('YYYY-MM-DD')
    : dayjs(value).format('YYYY-MM-DD');
  try {
    return parseDate(str);
  } catch {
    return undefined;
  }
}

/** datetime-local / ISO → CalendarDateTime | null */
export function stringToDateTime(value) {
  if (!value) return null;
  try {
    const d = dayjs(value);
    if (!d.isValid()) return null;
    return parseDateTime(d.format('YYYY-MM-DDTHH:mm'));
  } catch {
    return null;
  }
}

/** CalendarDateTime | null → YYYY-MM-DDTHH:mm (datetime-local compatible) */
export function dateTimeToString(value) {
  if (!value) return '';
  return `${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}`;
}
