import { FiCheck } from 'react-icons/fi';

export default function JourneyTimeline({ steps = [] }) {
  if (!steps || !steps.length) return null;

  return (
    <ol className="crm-student-journey-timeline" aria-label="Progress steps">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const state = step.current ? 'is-current' : step.done ? 'is-done' : 'is-pending';
        return (
          <li key={step.key || idx} className={`crm-student-journey-timeline__item ${state}`}>
            <div className="crm-student-journey-timeline__node">
              <span className={`crm-student-journey-timeline__dot ${state}`} aria-hidden>
                {step.done && !step.current ? <FiCheck style={{ fontSize: '0.75rem' }} /> : idx + 1}
              </span>
              {!isLast && (
                <span className={`crm-student-journey-timeline__connector${step.done ? ' is-done' : ''}`} aria-hidden />
              )}
            </div>
            <div className="crm-student-journey-timeline__copy">
              <p className={`crm-student-journey-timeline__label ${state}`}>
                {step.label}
              </p>
              {step.current && (
                <span className="crm-student-journey-timeline__hint">Current</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
