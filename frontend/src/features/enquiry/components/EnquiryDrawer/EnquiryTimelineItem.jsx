import {
  FiPlus, FiEdit2, FiRefreshCw, FiPhone, FiCalendar, FiEdit3, FiUpload,
  FiTrash2, FiSend, FiXCircle, FiActivity, FiMonitor,
} from 'react-icons/fi';
import {
  formatTimelineDetail,
  formatTimelineTitle,
  getActorName,
  getTimelineActionMeta,
} from '../../utils/enquiryTimeline.utils';

const ICONS = {
  CREATE: FiPlus,
  UPDATE: FiEdit2,
  STATUS_CHANGE: FiRefreshCw,
  FOLLOWUP: FiPhone,
  APPOINTMENT: FiCalendar,
  DEMO: FiMonitor,
  NOTE: FiEdit3,
  DOCUMENT: FiUpload,
  DOCUMENT_DELETE: FiTrash2,
  COMMUNICATION: FiSend,
  DROP: FiXCircle,
  DELETE: FiTrash2,
};

const TONE_CLASS = {
  success: 'crm-timeline-item__icon--success',
  primary: 'crm-timeline-item__icon--primary',
  warning: 'crm-timeline-item__icon--warning',
  info: 'crm-timeline-item__icon--info',
  danger: 'crm-timeline-item__icon--danger',
  secondary: 'crm-timeline-item__icon--secondary',
};

export default function EnquiryTimelineItem({ entry }) {
  const meta = getTimelineActionMeta(entry.action);
  const Icon = ICONS[entry.action] || FiActivity;
  const title = formatTimelineTitle(entry);
  const detail = formatTimelineDetail(entry);
  const actor = getActorName(entry.user);
  const time = new Date(entry.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="crm-timeline-item">
      <div className={`crm-timeline-item__icon ${TONE_CLASS[meta.tone] || TONE_CLASS.secondary}`}>
        <Icon className="w-3 h-3" strokeWidth={2.5} />
      </div>
      <div className="crm-timeline-item__body">
        <div className="crm-timeline-item__head">
          <h4 className="crm-timeline-item__title">{title}</h4>
          <time className="crm-timeline-item__time" dateTime={entry.createdAt}>{time}</time>
        </div>
        {(detail || actor) && (
          <p className="crm-timeline-item__meta">
            {detail && <span className="crm-timeline-item__detail">{detail}</span>}
            {detail && actor && <span className="crm-timeline-item__dot" aria-hidden>·</span>}
            {actor && <span className="crm-timeline-item__actor">{actor}</span>}
          </p>
        )}
      </div>
    </article>
  );
}
