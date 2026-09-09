import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiBookOpen, FiCalendar, FiFileText, FiMessageSquare, FiMonitor } from 'react-icons/fi';
import { ROUTES } from '../../../../../config/routes';

export default function StudentJourneyStrip({ student, stats, onTabChange }) {
  if (!stats?.enquiryCode) return null;

  const chips = [
    { id: 'demo-history', label: 'Demos', count: stats.demos, icon: FiMonitor },
    { id: 'enquiry-history', label: 'Follow-ups', count: stats.followups, icon: FiCalendar },
    { id: 'documents', label: 'Documents', count: stats.documents, icon: FiFileText },
    { id: 'notes', label: 'Notes', count: stats.notes, icon: FiMessageSquare },
  ];

  return (
    <section className="crm-student-journey-strip">
      <div className="crm-student-journey-strip__copy">
        <p className="crm-student-journey-strip__eyebrow">
          <FiBookOpen aria-hidden /> Pre-admission history preserved
        </p>
        <p className="crm-student-journey-strip__text">
          Converted from enquiry{' '}
          <span className="crm-student-journey-strip__code">{stats.enquiryCode}</span>
          {' '}— enquiry data stays linked; nothing is lost.
        </p>
        {student?.enquiry?.id && (
          <Link to={ROUTES.ENQUIRY_DETAIL(student.enquiry.id)} className="crm-student-journey-strip__link">
            Open enquiry record
            <FiArrowUpRight aria-hidden />
          </Link>
        )}
      </div>
      <div className="crm-student-journey-strip__chips">
        {chips.map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="crm-student-journey-strip__chip"
            onClick={() => onTabChange?.(id)}
          >
            <Icon aria-hidden />
            <span>{label}</span>
            <strong>{count}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
