export default function FormTabPanel({ panelKey, children, className = '' }) {
  return (
    <div className={`crm-form-panel ${className}`.trim()}>
      <div key={panelKey} className="crm-form-panel__layer scroll-area">
        {children}
      </div>
    </div>
  );
}
