import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import { PortalEmpty } from '../../../components/portal/PortalUi';

const TYPE_TONE = {
  ASSIGNMENT: 'assignment',
  DOCUMENT: 'document',
  FEE: 'fee',
  COUNSELING: 'counseling',
};

export default function ActionRequiredPanel({ tasks = [], primaryAction }) {
  const items = tasks.length ? tasks : (primaryAction ? [primaryAction] : []);

  if (!items.length) {
    return (
      <div className="crm-student-actions crm-student-actions--empty">
        <p className="crm-student-actions__caught-up">You&apos;re all caught up</p>
        <p className="crm-student-actions__caught-up-sub">No pending actions right now.</p>
      </div>
    );
  }

  return (
    <div className="crm-student-actions">
      <ul className="crm-student-actions__list">
        {items.slice(0, 5).map((task, idx) => (
          <li key={`${task.type}-${task.title}-${idx}`} className="crm-student-actions__item">
            <div className="crm-student-actions__body">
              <span className={`crm-student-actions__type crm-student-actions__type--${TYPE_TONE[task.type] || 'default'}`}>
                {task.type === 'ASSIGNMENT' ? 'Assignment' : task.type === 'DOCUMENT' ? 'Document' : task.type === 'FEE' ? 'Fees' : task.type === 'COUNSELING' ? 'Counselling' : 'Action'}
              </span>
              <p className="crm-student-actions__title">{task.title}</p>
              {task.description && (
                <p className="crm-student-actions__desc">{task.description}</p>
              )}
            </div>
            {task.link && (
              <Link to={task.link} className="crm-student-actions__cta">
                <Button size="sm" variant={idx === 0 ? 'primary' : 'outline'}>
                  {task.actionLabel || 'Open'}
                </Button>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PrimaryActionBanner({ action }) {
  if (!action?.link) return null;
  return (
    <div className="crm-student-primary-action">
      <div>
        <p className="crm-student-primary-action__label">Action required</p>
        <p className="crm-student-primary-action__title">{action.title}</p>
        {action.description && (
          <p className="crm-student-primary-action__desc">{action.description}</p>
        )}
      </div>
      <Link to={action.link}>
        <Button>{action.actionLabel || 'Complete Now'}</Button>
      </Link>
    </div>
  );
}
