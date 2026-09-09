import { FiCheck } from 'react-icons/fi';

export default function StudentJourneyOverview({ journey }) {
  if (!journey?.stages?.length) return null;

  const doneCount = journey.stages.filter((s) => s.done || s.current).length;
  const total = journey.stages.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <section className="crm-student-journey">
      <header className="crm-student-journey__head">
        <div className="min-w-0">
          <p className="crm-student-journey__eyebrow">Your journey</p>
          <h2 className="crm-student-journey__title">{journey.currentStage}</h2>
          {journey.currentStatus && (
            <p className="crm-student-journey__status">{journey.currentStatus}</p>
          )}
        </div>
        <div className="crm-student-journey__meta">
          {journey.nextStep && (
            <div className="crm-student-journey__next">
              <span className="crm-student-journey__next-label">Next</span>
              <span className="crm-student-journey__next-value">{journey.nextStep}</span>
            </div>
          )}
          <div className="crm-student-journey__pct" aria-hidden>
            <span>{pct}%</span>
            <div className="crm-student-journey__pct-bar">
              <i style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </header>

      <ol className="crm-student-journey__track" aria-label="Student journey progress">
        {journey.stages.map((stage) => (
          <li
            key={stage.key}
            className={`crm-student-journey__step ${
              stage.current ? 'is-current' : stage.done ? 'is-done' : 'is-pending'
            }`}
          >
            <span className="crm-student-journey__dot" aria-hidden>
              {stage.done ? <FiCheck size={10} /> : null}
            </span>
            <span className="crm-student-journey__label">{stage.label}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
