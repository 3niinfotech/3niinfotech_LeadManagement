import { FiSearch } from 'react-icons/fi';
import { iconSize } from '../../theme/icons';
import { FORM_CONTROL_DEFAULT_SIZE, formControlClass } from '../../theme/formControls';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  inputClassName = '',
  size = FORM_CONTROL_DEFAULT_SIZE,
  onClick,
  readOnly = false,
  autoFocus = false,
  ...props
}) {
  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <span className="crm-field-leading-icon" aria-hidden>
        <FiSearch className={iconSize.sm} />
      </span>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        {...props}
        className={`
          crm-input w-full pr-3 rounded-lg
          placeholder:text-text-muted caret-primary-600
          ${formControlClass(size)}
          crm-field--leading-icon
          ${inputClassName}
        `}
      />
    </div>
  );
}
