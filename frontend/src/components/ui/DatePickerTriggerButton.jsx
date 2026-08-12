import { useContext } from 'react';
import { DatePickerStateContext } from 'react-aria-components';
import { usePress } from 'react-aria';

/**
 * Calendar icon button — toggles date picker open/close on each click.
 * (React Aria default only calls setOpen(true).)
 */
export default function DatePickerTriggerButton({ className = '', children }) {
  const state = useContext(DatePickerStateContext);

  const { pressProps } = usePress({
    onPress: () => state?.setOpen?.(!state.isOpen),
  });

  if (!state) return null;

  return (
    <button
      type="button"
      {...pressProps}
      className={className}
      aria-haspopup="dialog"
      aria-expanded={state.isOpen}
      aria-label="Toggle calendar"
      disabled={state.isDisabled || state.isReadOnly}
    >
      {children}
    </button>
  );
}
