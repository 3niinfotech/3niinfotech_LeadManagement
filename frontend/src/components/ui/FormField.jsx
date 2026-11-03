/** Standard form label + field wrapper — use across filters, modals, drawers */
export default function FormField({
  label,
  htmlFor,
  children,
  required = false,
  error,
  hint,
  className = '',
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[12.5px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 leading-snug"
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
      {hint && !error && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </div>
  );
}
