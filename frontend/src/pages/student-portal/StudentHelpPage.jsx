import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen,
  FiClipboard,
  FiFileText,
  FiHelpCircle,
  FiMail,
  FiMessageCircle,
  FiCheckSquare,
  FiSend,
  FiCheckCircle,
  FiPhone,
  FiClock,
  FiShield,
  FiChevronDown,
  FiChevronUp,
  FiMapPin,
  FiExternalLink,
} from 'react-icons/fi';
import { ROUTES } from '../../config/routes';
import toastService from '../../services/toast/toast.service';
import './student-dashboard.theme.css';

const FAQS = [
  {
    id: 1,
    q: 'How do I upload and verify my documents?',
    a: 'Navigate to Documents, select the category tab (Passport, Academic, Financial), and click "Submit New Document". Your assigned counsellor Priya Shah will review and verify your upload within 24 hours.',
    to: ROUTES.STUDENT_DOCUMENTS,
    badge: 'Documents',
  },
  {
    id: 2,
    q: 'How do I join live IELTS classes & view batches?',
    a: 'Go to Courses & Schedule. You will see the "Next Live Class" banner with a direct "Join Virtual Classroom" button (Google Meet). You can also view the weekly timetable from Monday to Saturday.',
    to: ROUTES.STUDENT_COURSES,
    badge: 'Classes',
  },
  {
    id: 3,
    q: 'Where can I track my Canadian Study Permit (SDS)?',
    a: 'Visit the Visa Process page. It displays your complete IRCC application status, SDS compliance checklist (LOA, GIC, IELTS, Medical, PCC), and upcoming VFS biometrics appointment schedule.',
    to: ROUTES.STUDENT_VISA,
    badge: 'Visa & SDS',
  },
  {
    id: 4,
    q: 'How do I pay fees or download GST tax receipts?',
    a: 'Open Fees & Payments to pay scheduled installments via Razorpay (UPI, Netbanking, Cards). Click "Receipts" to preview, download, or print official computerized GST vouchers.',
    to: ROUTES.STUDENT_FEES,
    badge: 'Payments',
  },
  {
    id: 5,
    q: 'What should I do if my attendance looks incorrect?',
    a: 'Class attendance is marked live by your instructor during physical and virtual sessions. If you attended and your status is marked absent, submit a correction request below or message Priya Shah.',
    to: ROUTES.STUDENT_ATTENDANCE,
    badge: 'Attendance',
  },
];

const QUICK_SHORTCUTS = [
  { id: 'docs', label: 'Documents', desc: 'Compliance uploads', icon: FiFileText, to: ROUTES.STUDENT_DOCUMENTS, color: '#3b82f6', bg: '#eff6ff' },
  { id: 'visa', label: 'Visa Process', desc: 'SDS IRCC tracking', icon: FiShield, to: ROUTES.STUDENT_VISA, color: '#059669', bg: '#ecfdf5' },
  { id: 'counsel', label: 'Counselling', desc: '1-on-1 sessions', icon: FiMessageCircle, to: ROUTES.STUDENT_COUNSELING, color: '#06b6d4', bg: '#ecfeff' },
  { id: 'fees', label: 'Fees & Receipts', desc: 'Installment ledger', icon: FiClipboard, to: ROUTES.STUDENT_FEES, color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'courses', label: 'Classes', desc: 'Timetable & Meet', icon: FiBookOpen, to: ROUTES.STUDENT_COURSES, color: '#f59e0b', bg: '#fffbeb' },
  { id: 'att', label: 'Attendance', desc: 'Session records', icon: FiCheckSquare, to: ROUTES.STUDENT_ATTENDANCE, color: '#10b981', bg: '#f0fdf4' },
];

export default function StudentHelpPage() {
  const [ticketTopic, setTicketTopic] = useState('General Enquiry');
  const [ticketPriority, setTicketPriority] = useState('NORMAL');
  const [ticketMsg, setTicketMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(1);

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketMsg.trim()) {
      toastService.error('Please describe your query or issue');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setTicketMsg('');
      toastService.success('Support query submitted! Ticket #TKT-2026-8910 assigned to Priya Shah.');
    }, 600);
  };

  return (
    <div className="crm-stu-page-container">
      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Helpdesk Status</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              Online 24/7
            </span>
            <span className="crm-stu-chip crm-stu-chip--success">Active</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Student desk & live support
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Assigned Advisor</span>
            <FiShield className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              Priya Shah
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">Lead Counsellor</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Direct consultation for admissions & visa
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Direct Hotline</span>
            <FiPhone className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              +91 98765 43210
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">WhatsApp</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Mon – Sat · 10:00 AM – 6:30 PM IST
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Average Response</span>
            <FiClock className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              &lt; 2 Hours
            </span>
            <span className="crm-stu-chip crm-stu-chip--neutral">Priority SLA</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Direct turnaround on queries & tickets
          </div>
        </div>
      </div>

      {/* ── 2-Column Responsive Section: Contact Channels (Left) + FAQs (Right) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
          marginBottom: '1rem',
        }}
      >
        {/* Left Column: Direct Support Channels */}
        <div
          className="crm-stu-card"
          style={{
            padding: '1.25rem 1.35rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Direct Contact Channels
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                Instant assistance from your assigned advisor and support team
              </p>
            </div>
            <span className="crm-stu-chip crm-stu-chip--success" style={{ fontSize: '0.75rem' }}>
              Available
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {/* Channel 1: 1-on-1 Counselling */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 9,
                    background: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <FiMessageCircle />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#0f172a', display: 'block' }}>
                    1-on-1 Advisory Desk
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#475569', display: 'block' }}>
                    Counsellor Priya Shah · In-Person or Google Meet
                  </span>
                </div>
              </div>

              <Link
                to={ROUTES.STUDENT_COUNSELING}
                className="crm-stu-btn crm-stu-btn--primary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.95rem', whiteSpace: 'nowrap' }}
              >
                Book Session
              </Link>
            </div>

            {/* Channel 2: Email Helpdesk */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 9,
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <FiMail />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#0f172a', display: 'block' }}>
                    Official Email Desk
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                    support@3niinfotech.com · Tickets tracked
                  </span>
                </div>
              </div>

              <a
                href="mailto:support@3niinfotech.com"
                className="crm-stu-btn crm-stu-btn--secondary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.95rem', whiteSpace: 'nowrap' }}
              >
                Send Email
              </a>
            </div>

            {/* Channel 3: WhatsApp & Phone Support */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 9,
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <FiPhone />
                </div>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: '#0f172a', display: 'block' }}>
                    Phone & WhatsApp Hotline
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                    +91 98765 43210 · Direct counsellor line
                  </span>
                </div>
              </div>

              <a
                href="tel:+919876543210"
                className="crm-stu-btn crm-stu-btn--secondary"
                style={{ fontSize: '0.8125rem', padding: '0.4rem 0.95rem', whiteSpace: 'nowrap' }}
              >
                Call Now
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Knowledge Base & FAQs */}
        <div
          className="crm-stu-card"
          style={{
            padding: '1.25rem 1.35rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Knowledge Base & FAQs
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                Quick answers for portal workflows, documents & admissions
              </p>
            </div>
            <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
              Self-Service
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {FAQS.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  style={{
                    borderRadius: '10px',
                    background: isOpen ? '#f8fafc' : '#ffffff',
                    border: isOpen ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                    transition: 'all 0.15s ease',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.95rem',
                      cursor: 'pointer',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                      <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem' }}>
                        {faq.badge}
                      </span>
                      <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                        {faq.q}
                      </strong>
                    </div>

                    <div style={{ color: '#64748b', fontSize: '0.875rem', flexShrink: 0 }}>
                      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                  </div>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 0.95rem 0.75rem',
                        fontSize: '0.8125rem',
                        color: '#475569',
                        lineHeight: 1.5,
                      }}
                    >
                      <p style={{ margin: '0 0 0.5rem' }}>{faq.a}</p>
                      <Link
                        to={faq.to}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 750,
                          color: '#2563eb',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        Open {faq.badge} Page <FiExternalLink />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Portal Shortcuts ── */}
      <div
        className="crm-stu-card"
        style={{
          padding: '1.15rem 1.35rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Quick Portal Shortcuts
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
              Instant one-click navigation to your student tools
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.65rem',
          }}
        >
          {QUICK_SHORTCUTS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: item.bg,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  <Icon />
                </div>
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>
                    {item.label}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                    {item.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Report an Issue / Submit Query ── */}
      <div
        className="crm-stu-card"
        style={{
          padding: '1.25rem 1.35rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Submit a Support Query / Report an Issue
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
              Your ticket will be routed directly to Lead Counsellor Priya Shah and the student helpdesk
            </p>
          </div>
          <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
            Tracked Ticket
          </span>
        </div>

        <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Query Category *
              </label>
              <select
                value={ticketTopic}
                onChange={(e) => setTicketTopic(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  color: '#0f172a',
                  background: '#ffffff',
                }}
              >
                <option value="General Enquiry">General Admission Query</option>
                <option value="Document Verification Status">Document Verification Status</option>
                <option value="Visa & SDS Filing">Visa & Canadian SDS Filing</option>
                <option value="Fee Receipts & Payment Ledger">Fee Receipts & Payment Ledger</option>
                <option value="Attendance / Class Correction">Attendance & Class Timetable</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                Priority Level
              </label>
              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8125rem',
                  color: '#0f172a',
                  background: '#ffffff',
                }}
              >
                <option value="NORMAL">Standard Review (&lt; 2 Hours)</option>
                <option value="HIGH">High Priority (Urgent File Deadline)</option>
                <option value="CRITICAL">Immediate Attention Required</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
              Detailed Description *
            </label>
            <textarea
              rows={3}
              required
              value={ticketMsg}
              onChange={(e) => setTicketMsg(e.target.value)}
              placeholder="Describe your question or issue in detail. Student code (STU-2026-9812) will be auto-attached..."
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
                color: '#0f172a',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Assigned Advisor: <strong>Priya Shah</strong> · Response sent directly to portal notifications
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="crm-stu-btn crm-stu-btn--primary"
              style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <FiSend /> {submitting ? 'Submitting...' : 'Submit Support Query'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
