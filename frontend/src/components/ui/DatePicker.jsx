import {
  DatePicker as AriaDatePicker,
  Group,
  DateInput,
  DateSegment,
  Popover,
  Dialog,
} from 'react-aria-components';
import { FiCalendar } from 'react-icons/fi';
import { FORM_CONTROL_DEFAULT_SIZE, formControlClass } from '../../theme/formControls';
import FormField from './FormField';
import AriaCalendarPanel from './AriaCalendarPanel';
import DatePickerTriggerButton from './DatePickerTriggerButton';
import {
  stringToCalendarDate,
  calendarDateToString,
  toMinMaxValue,
} from './datePicker.utils';

/**
 * Global date picker — React Aria (Adobe).
 * Value format: YYYY-MM-DD string.
 */
export default function DatePicker({
  label,
  value,
  onChange,
  error,
  hint,
  size = FORM_CONTROL_DEFAULT_SIZE,
  minDate,
  maxDate,
  containerClassName = '',
  className = '',
  isDisabled = false,
  name,
}) {
  const calendarValue = stringToCalendarDate(value);
  const fieldClass = formControlClass(size, { error });

  const picker = (
    <AriaDatePicker
      name={name}
      value={calendarValue}
      onChange={(v) => onChange?.(calendarDateToString(v))}
      minValue={toMinMaxValue(minDate)}
      maxValue={toMinMaxValue(maxDate)}
      isDisabled={isDisabled}
      isInvalid={Boolean(error)}
      className={`crm-aria-datepicker w-full ${className}`}
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
