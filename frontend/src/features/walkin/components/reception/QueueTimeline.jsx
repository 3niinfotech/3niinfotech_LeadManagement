import { formatTimeShort } from '../../utils/reception.utils';

const TONE_CLASS = {
  primary: 'crm-reception-timeline__dot--primary',
  brand: 'crm-reception-timeline__dot--brand',
  info: 'crm-reception-timeline__dot--info',
  success: 'crm-reception-timeline__dot--success',
  neutral: 'crm-reception-timeline__dot--neutral',
};

export default function QueueTimeline({ events = [], title = 'Queue Timeline' }) {
  if (!events.length) {
    return (
      <div className="crm-reception-timeline crm-reception-timeline--empty">
        <p className="text-xs text-text-muted">Select a visitor to see live timeline</p>
      </div>
    );
  }

  return (
    <div className="crm-reception-timeline">
      <p className="crm-reception-timeline__title">{title}</p>
      <ol className="crm-reception-timeline__list">
        {events.map((event, i) => (
          <li key={`${event.label}-${i}`} className="crm-reception-timeline__item">
            <span className={`crm-reception-timeline__dot ${TONE_CLASS[event.tone] || TONE_CLASS.neutral}`} />
            <div className="min-w-0">
              <p className="crm-reception-timeline__time">{formatTimeShort(event.time)}</p>
              <p className="crm-reception-timeline__label">{event.label}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
