/**
 * Form panel for enquiry workspace tabs.
 * Standardized to match FormTabPanel — avoids Framer Motion exit locks that caused blank content screens.
 */
export default function EnquiryTabPanel({ panelKey, children, className = '' }) {
  return (
    <div className={`crm-form-panel crm-enquiry-tab-panel ${className}`.trim()}>
      <div key={panelKey} className="crm-form-panel__layer scroll-area crm-enquiry-tab-panel__layer">
        {children}
      </div>
    </div>
  );
}
