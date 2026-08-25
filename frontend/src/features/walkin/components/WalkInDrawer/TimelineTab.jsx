import { FiActivity } from 'react-icons/fi';

const ACTION_TONE = {
  WALK_IN_REGISTERED: 'brand',
  ENQUIRY_CREATED: 'success',
  COUNSELLOR_DECISION: 'success',
  STATUS_CHANGE: 'info',
  NOTE_ADDED: 'muted',
};

export default function TimelineTab({ lead }) {
  const items = lead?.activities || [];

  if (!items.length) {
    return (
      <div className="crm-walkin-empty-panel">
        <FiActivity className="w-7 h-7 text-text-muted" aria-hidden />
        <p className="crm-walkin-empty-panel__title">No activity yet</p>
        <p className="crm-walkin-empty-panel__sub">
          Registration, assignment and counselling steps are recorded here automatically.
        </p>
      </div>
    );
  }

  return (
    <ol className="crm-walkin-timeline">
      {items.map((item) => (
        <li key={item.id} className="crm-walkin-timeline__item">
          <span
            className={`crm-walkin-timeline__dot crm-walkin-timeline__dot--${ACTION_TONE[item.action] || 'muted'}`}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="crm-walkin-timeline__title">{item.description || item.action}</p>
            <p className="crm-walkin-timeline__meta">
              {item.user ? `${item.user.firstName} ${item.user.lastName || ''}`.trim() : 'System'}
              {' · '}
              {new Date(item.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
