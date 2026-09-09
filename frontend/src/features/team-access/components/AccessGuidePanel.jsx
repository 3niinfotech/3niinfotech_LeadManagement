import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiInfo } from 'react-icons/fi';

export default function AccessGuidePanel({ title, steps = [], defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!steps.length) return null;

  return (
    <div className={`crm-access-guide ${open ? 'crm-access-guide--open' : ''}`}>
      <button
        type="button"
        className="crm-access-guide__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="crm-access-guide__toggle-icon" aria-hidden>
          <FiInfo size={16} />
        </span>
        <span className="crm-access-guide__toggle-text">
          <span className="crm-access-guide__toggle-title">{title}</span>
          <span className="crm-access-guide__toggle-hint">
            {open ? 'Hide guide' : 'Click to see step-by-step help'}
          </span>
        </span>
        {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>

      {open && (
        <ol className="crm-access-guide__steps">
          {steps.map((step) => (
            <li key={step.title} className="crm-access-guide__step">
              <span className="crm-access-guide__step-title">{step.title}</span>
              <span className="crm-access-guide__step-text">{step.text}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
