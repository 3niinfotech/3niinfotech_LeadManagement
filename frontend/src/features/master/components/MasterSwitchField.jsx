/** Compact Active/Inactive toggle for master forms */
export default function MasterSwitchField({
  label,
  checked = false,
  onChange,
  disabled = false,
  error,
}) {
  return (
    <div className={`crm-master-switch ${error ? 'crm-master-switch--error' : ''}`}>
      <span className="crm-master-switch__label">{label}</span>
      <div className="crm-master-switch__control-wrap">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`crm-master-switch__control ${checked ? 'is-on' : ''}`}
        >
          <span className="crm-master-switch__thumb" aria-hidden />
        </button>
        <span className={`crm-master-switch__state ${checked ? 'is-on' : ''}`}>
          {checked ? 'Active' : 'Inactive'}
        </span>
      </div>
      {error ? <p className="crm-master-switch__error">{error}</p> : null}
    </div>
  );
}
