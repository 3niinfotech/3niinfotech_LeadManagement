import { Link } from 'react-router-dom';
import {
  FiBookOpen,
  FiClipboard,
  FiFileText,
  FiHelpCircle,
  FiMail,
  FiMessageCircle,
  FiCheckSquare,
} from 'react-icons/fi';
import { ROUTES } from '../../config/routes';
import {
  PortalPage,
  PortalPanel,
  PortalQuickActions,
} from '../../components/portal/PortalUi';

const FAQS = [
  {
    q: 'How do I upload documents?',
    a: 'Open Documents and upload required files when your counsellor requests them.',
    to: ROUTES.STUDENT_DOCUMENTS,
  },
  {
    q: 'How do I submit assignments?',
    a: 'Open Assignments, select the task, and submit before the due date.',
    to: ROUTES.STUDENT_ASSIGNMENTS,
  },
  {
    q: 'Attendance looks incorrect?',
    a: 'Contact your teacher or counsellor — students cannot edit attendance.',
    to: ROUTES.STUDENT_ATTENDANCE,
  },
  {
    q: 'Where are my fee receipts?',
    a: 'Go to Fees & payments, then open Receipts to view or print.',
    to: ROUTES.STUDENT_RECEIPTS,
  },
];

const QUICK = [
  { id: 'docs', label: 'Documents', icon: FiFileText, to: ROUTES.STUDENT_DOCUMENTS },
  { id: 'assign', label: 'Assignments', icon: FiClipboard, to: ROUTES.STUDENT_ASSIGNMENTS },
  { id: 'att', label: 'Attendance', icon: FiCheckSquare, to: ROUTES.STUDENT_ATTENDANCE },
  { id: 'courses', label: 'Courses', icon: FiBookOpen, to: ROUTES.STUDENT_COURSES },
  { id: 'counsel', label: 'Counselling', icon: FiMessageCircle, to: ROUTES.STUDENT_COUNSELING },
];

export default function StudentHelpPage() {
  return (
    <PortalPage className="crm-stu-help">
      <div className="crm-stu-help__grid">
        <PortalPanel title="Contact support" description="Account, fees, or application help" padded>
          <div className="crm-stu-help__actions">
            <a href="mailto:support@institute.com" className="crm-stu-help__action">
              <FiMail aria-hidden />
              <span>
                <strong>Email support</strong>
                <em>support@institute.com</em>
              </span>
            </a>
            <Link to={ROUTES.STUDENT_COUNSELING} className="crm-stu-help__action">
              <FiMessageCircle aria-hidden />
              <span>
                <strong>Request counselling</strong>
                <em>Book a session with your counsellor</em>
              </span>
            </Link>
          </div>
        </PortalPanel>

        <PortalPanel title="Common questions" padded>
          <ul className="crm-stu-help__faq">
            {FAQS.map((item) => (
              <li key={item.q}>
                <FiHelpCircle aria-hidden />
                <div>
                  <Link to={item.to} className="crm-stu-help__faq-q">{item.q}</Link>
                  <p>{item.a}</p>
                </div>
              </li>
            ))}
          </ul>
        </PortalPanel>
      </div>

      <PortalPanel title="Quick links" description="Jump to common student tools" padded>
        <PortalQuickActions items={QUICK} />
      </PortalPanel>

      <PortalPanel title="Report an issue" padded>
        <p className="crm-stu-help__issue">
          For technical portal issues, email support and include your <strong>student ID</strong>,
          the page URL, and a short description of what happened.
        </p>
      </PortalPanel>
    </PortalPage>
  );
}
