import {
  DatePicker as AriaDatePicker,
  Group,
  DateInput,
  DateSegment,
  Popover,
  Dialog,
  TimeField,
  Label as AriaLabel,
} from 'react-aria-components';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { FORM_CONTROL_DEFAULT_SIZE, formControlClass } from '../../theme/formControls';
import FormField from './FormField';
import AriaCalendarPanel from './AriaCalendarPanel';
import DatePickerTriggerButton from './DatePickerTriggerButton';
import {
  stringToDateTime,
  dateTimeToString,
} from './datePicker.utils';

/**
 * Global date + time picker — React Aria.
 * Value format: YYYY-MM-DDTHH:mm (datetime-local compatible).
 */
export default function DateTimePicker({
  label,
  value,
  onChange,
  error,
  hint,
  size = FORM_CONTROL_DEFAULT_SIZE,
  containerClassName = '',
  className = '',
  isDisabled = false,
  name,
}) {
  const dateTimeValue = stringToDateTime(value);
  const fieldClass = formControlClass(size, { error });

  const picker = (
    <AriaDatePicker
      name={name}
      granularity="minute"
      hourCycle={12}
      value={dateTimeValue}
      onChange={(v) => onChange?.(dateTimeToString(v))}
      isDisabled={isDisabled}
      isInvalid={Boolean(error)}
      className={`crm-aria-datetime w-full ${className}`}
    >
      <Group className={`crm-aria-date-group ${fieldClass}`}>
        <DateInput className="crm-aria-date-input flex flex-1 items-center min-w-0 gap-0.5">
          {(segment) => (
            <DateSegment
              segment={segment}
              className="crm-aria-date-segment outline-none rounded px-0.5 tabular-nums text-text
                data-[placeholder]:text-slate-400
                focus:bg-primary-50 focus:text-primary-700"
            />
          )}
        </DateInput>
        <DatePickerTriggerButton
          className="crm-aria-date-btn flex items-center justify-center shrink-0
            text-slate-400 hover:text-primary-600 hover:bg-slate-50
            outline-none transition-colors duration-150"
        >
          <FiCalendar className="w-4 h-4" aria-hidden />
        </DatePickerTriggerButton>
      </Group>

      <Popover
        className="crm-aria-popover crm-aria-date-popover"
        placement="bottom start"
        offset={6}
        isNonModal
      >
        <Dialog className="crm-aria-calendar-dialog outline-none p-0">
          <AriaCalendarPanel />
          <TimeField className="flex items-center gap-2 px-3 pb-3 pt-2 border-t border-slate-200">
            <FiClock className="w-4 h-4 text-slate-400 shrink-0" />
            <AriaLabel className="sr-only">Time</AriaLabel>
            <DateInput className="flex items-center gap-0.5">
              {(segment) => (
                <DateSegment
                  segment={segment}
                  className="crm-aria-date-segment outline-none rounded px-0.5 tabular-nums
                    focus:bg-primary-50 focus:text-primary-700"
                />
              )}
            </DateInput>
          </TimeField>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );

  if (!label) return picker;

  return (
    <FormField label={label} error={error} hint={hint} className={containerClassName}>
      {picker}
    </FormField>
  );
}
