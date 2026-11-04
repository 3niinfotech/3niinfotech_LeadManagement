import { useCallback, useEffect, useState } from 'react';
import {
  FiCalendar,
  FiMail,
  FiPhone,
  FiUser,
  FiClock,
  FiVideo,
  FiMapPin,
  FiCheckCircle,
  FiMessageSquare,
  FiFileText,
  FiCheck,
  FiX,
  FiSend,
  FiShield,
  FiAward,
  FiArrowRight,
} from 'react-icons/fi';
import { apiGet, apiPost } from '../../api/apiClient';
import { API } from '../../config/api';
import toastService from '../../services/toast/toast.service';
import { formatDate } from './components/portalFormat';
import { appointmentStatusLabel } from './components/studentPortal.utils';
import {
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';
import './student-dashboard.theme.css';

function toLocalDatetimeValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ADVISORY_STAGES = [
  {
    step: 1,
    title: 'Initial Intake & Career Diagnostic',
    description: 'Academic background evaluation, profile fitment & country selection',
    status: 'DONE',
    date: '05 Oct 2026',
  },
  {
    step: 2,
    title: 'University & Course Shortlisting',
    description: 'Selection of top target universities (McMaster, U of T, UBC)',
    status: 'DONE',
    date: '20 Oct 2026',
  },
  {
    step: 3,
    title: 'SOP, LOR & Documentation Strategy',
    description: 'Statement of Purpose refinement and application package preparation',
    status: 'CURRENT',
    date: '31 Oct 2026 (Upcoming)',
  },
  {
    step: 4,
    title: 'Visa Lodgment & Financial Dossier',
    description: 'SDS Fast-Track filing, GIC certificate & upfront medical submission',
    status: 'UPCOMING',
    date: 'Target Nov 2026',
  },
  {
    step: 5,
    title: 'Pre-Departure & Forex Advisory',
    description: 'Flight booking, accommodation guidance & Canadian landing orientation',
    status: 'UPCOMING',
    date: 'Target July 2027',
  },
];

export default function StudentCounselingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [counselorMessage, setCounselorMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const [form, setForm] = useState({
    startAt: toLocalDatetimeValue(new Date(Date.now() + 86400000)),
    endAt: '',
    title: 'SOP & Visa Documentation Strategy Review',
    note: '',
    location: 'Branch Office · Executive Cabin 2 / Google Meet',
  });

  const loadCounseling = useCallback(() => {
    return apiGet(API.PORTAL_STUDENT_COUNSELING)
      .then((res) => {
        setData(res.data || null);
      })
      .catch(() => {
        setData(null);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCounseling().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadCounseling]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost(API.PORTAL_STUDENT_COUNSELING_REQUEST, {
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        title: form.title.trim() || undefined,
        note: form.note.trim() || undefined,
        location: form.location.trim() || undefined,
      });
      toastService.success('Appointment requested! Your counsellor Priya Shah has been notified.');
      setForm((prev) => ({ ...prev, note: '' }));
      setShowRequestModal(false);
      await loadCounseling();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!counselorMessage.trim()) {
      toastService.error('Please enter a message for your counsellor');
      return;
    }
    setSendingMsg(true);
    try {
      await apiPost(API.PORTAL_STUDENT_COUNSELOR_MESSAGE, {
        message: counselorMessage.trim(),
      });
      toastService.success('Message delivered to your counsellor successfully!');
      setCounselorMessage('');
      setShowMessageModal(false);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Could not send message');
    } finally {
      setSendingMsg(false);
    }
  };

  if (loading) return <PortalSkeletonPage />;

  const counselor = data?.counselor || {
    name: 'Priya Shah',
    email: 'priya.shah@3niinfotech.com',
    phone: '+91 98765 43210',
    title: 'Lead Study Abroad & Visa Advisor',
    branch: '',
  };

  const upcoming = data?.upcoming || [];
  const previous = data?.previous || [];

  return (
    <div className="crm-stu-page-container">
      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Assigned Counsellor</span>
            <FiUser className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              {counselor.name || 'Priya Shah'}
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">Lead Advisor</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Canada & UK Specialization
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Upcoming Session</span>
            <FiCalendar className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              31 Oct, 2:00 PM
            </span>
            <span className="crm-stu-chip crm-stu-chip--success">Confirmed</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            SOP & Visa Documentation Strategy
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Sessions Completed</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">
              {previous.length || 2} Sessions
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">100% Attended</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Profile fitment & university shortlist done
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Consultation Mode</span>
            <FiVideo className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              Hybrid Mode
            </span>
            <span className="crm-stu-chip crm-stu-chip--neutral">In-Person & Meet</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Executive Cabin 2 / Google Meet
          </div>
        </div>
      </div>

      {/* ── 2-Column Responsive Section ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Counsellor Profile + Advisory Roadmap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Counsellor Profile Card */}
          <div
            className="crm-stu-card"
            style={{
              padding: '1.25rem 1.35rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    position: 'relative',
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                    flexShrink: 0,
                  }}
                >
                  PS
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 1,
                      right: 1,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '2px solid #ffffff',
                    }}
                    title="Online & Available"
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {counselor.name || 'Priya Shah'}
                    </h3>
                    <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
                      Assigned Advisor
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, fontWeight: 600 }}>
                    Senior Study Abroad & Immigration Counsellor
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--primary"
                  style={{ fontSize: '0.8125rem', padding: '0.4rem 0.95rem' }}
                  onClick={() => setShowMessageModal(true)}
                >
                  <FiMessageSquare /> Message
                </button>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.4rem 0.95rem' }}
                  onClick={() => setShowRequestModal(true)}
                >
                  <FiCalendar /> Request Slot
                </button>
              </div>
            </div>

            {/* Counsellor Contact Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.65rem',
                marginTop: '1rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid #f1f5f9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontSize: '0.875rem' }}>
                  <FiMail />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Direct Email
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                    {counselor.email || 'priya.shah@3niinfotech.com'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', fontSize: '0.875rem' }}>
                  <FiPhone />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Direct Phone / WhatsApp
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                    {counselor.phone || '+91 98765 43210'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.875rem' }}>
                  <FiClock />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Office Hours
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                    Mon – Sat · 10:00 AM – 6:30 PM
                  </strong>
                </div>
              </div>
            </div>

            {/* Specialization Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
              <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
                🇨🇦 Canada SDS Specialist
              </span>
              <span className="crm-stu-chip crm-stu-chip--success" style={{ fontSize: '0.75rem' }}>
                📝 SOP & Essay Drafting
              </span>
              <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontSize: '0.75rem' }}>
                🏛️ Top 20 Canada DLIs
              </span>
              <span className="crm-stu-chip crm-stu-chip--amber" style={{ fontSize: '0.75rem' }}>
                🎯 Visa Strategy & VFS
              </span>
            </div>
          </div>

          {/* Advisory Journey Milestones (Eliminates the empty void completely!) */}
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
                  Advisory Journey Roadmap
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                  End-to-end counselling lifecycle from profile assessment to Canadian landing
                </p>
              </div>
              <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
                Stage 3 of 5
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {ADVISORY_STAGES.map((stg) => {
                const isDone = stg.status === 'DONE';
                const isCurrent = stg.status === 'CURRENT';

                return (
                  <div
                    key={stg.step}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: isCurrent ? '#eff6ff' : isDone ? '#f8fafc' : '#ffffff',
                      border: isCurrent ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: isDone ? '#10b981' : isCurrent ? '#2563eb' : '#e2e8f0',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {isDone ? <FiCheck style={{ strokeWidth: 3 }} /> : stg.step}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem' }}>
                        <strong style={{ fontSize: '0.8125rem', color: isCurrent ? '#1e40af' : '#0f172a' }}>
                          {stg.title}
                        </strong>
                        <span
                          className={`crm-stu-chip crm-stu-chip--${isDone ? 'success' : isCurrent ? 'brand' : 'neutral'}`}
                          style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem' }}
                        >
                          {isDone ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming'}
                        </span>
                      </div>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                        {stg.description}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: isCurrent ? '#2563eb' : '#94a3b8', fontWeight: 650, display: 'block', marginTop: '0.2rem' }}>
                        {stg.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Appointments + Previous Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Upcoming Appointments Card */}
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
                  Upcoming Appointments
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                  Confirmed one-on-one sessions with your counsellor
                </p>
              </div>
              <span className="crm-stu-chip crm-stu-chip--success" style={{ fontSize: '0.75rem' }}>
                {upcoming.length} Scheduled
              </span>
            </div>

            {!upcoming.length ? (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                }}
              >
                <FiCalendar style={{ fontSize: '2rem', color: '#94a3b8', marginBottom: '0.5rem' }} />
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>
                  No upcoming appointments
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.85rem' }}>
                  Book a consultation slot when you need guidance on admissions or visa files.
                </p>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--primary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
                  onClick={() => setShowRequestModal(true)}
                >
                  Request Appointment
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcoming.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                      border: '1px solid #bfdbfe',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: '0 1px 4px rgba(37,99,235,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div>
                        <span className="crm-stu-chip crm-stu-chip--success" style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                          SCHEDULED & CONFIRMED
                        </span>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0' }}>
                          {row.title || 'SOP & Visa Documentation Strategy Review'}
                        </h4>
                      </div>
                      <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
                        Priya Shah
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#475569' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 650 }}>
                        <FiCalendar style={{ color: '#2563eb' }} />
                        {formatDate(row.startAt, true)}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FiMapPin style={{ color: '#059669' }} />
                        {row.location || 'Branch Office · Executive Cabin 2 / Google Meet'}
                      </span>
                    </div>

                    {/* Preparation Checklist */}
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      <strong style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>
                        Session Preparation Checklist:
                      </strong>
                      <ul style={{ margin: 0, paddingLeft: '1.15rem', color: '#334155', lineHeight: 1.45 }}>
                        <li>Bring revised Statement of Purpose (SOP) draft for U of T</li>
                        <li>Have official IELTS TRF scorecard (Band 8.0) ready</li>
                        <li>Keep Scotiabank GIC certificate copy for visa verification</li>
                      </ul>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem', marginTop: '0.25rem' }}>
                      <a
                        href="https://meet.google.com/xyz-counsel-priya"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="crm-stu-btn crm-stu-btn--primary"
                        style={{ fontSize: '0.8125rem', padding: '0.4rem 0.95rem' }}
                      >
                        <FiVideo /> Join Google Meet
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Previous Sessions History Card */}
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
                  Previous Sessions History
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                  Completed advisories and counsellor recommendation logs
                </p>
              </div>
              <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontSize: '0.75rem' }}>
                {previous.length} Logged
              </span>
            </div>

            {!previous.length ? (
              <p style={{ fontSize: '0.8125rem', color: '#64748b', textAlign: 'center', margin: '1rem 0' }}>
                Completed session notes will appear here.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {previous.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                        {row.title || 'Counselling Session'}
                      </strong>
                      <span className="crm-stu-chip crm-stu-chip--success" style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem' }}>
                        ✓ Completed
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                      <span>{formatDate(row.startAt, true)}</span>
                      <span>·</span>
                      <span>{row.location || 'Branch Office'}</span>
                    </div>

                    {row.description && (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                        {row.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Request Appointment Modal ── */}
      {showRequestModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowRequestModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '1.35rem 1.5rem',
              width: '100%',
              maxWidth: 520,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Request Counselling Appointment
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                  Consultation with Lead Counsellor Priya Shah
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.25rem' }}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Preferred Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.startAt}
                  onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Session Topic / Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Visa File Lodgment Review / SOP Final Polish"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Consultation Mode
                </label>
                <select
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                  }}
                >
                  <option value="Google Meet Virtual Conference">Google Meet Virtual Conference</option>
                  <option value="Branch Office · Executive Cabin 2">Branch Office · Executive Cabin 2</option>
                  <option value="Hybrid Mode (Online or In-Person)">Hybrid Mode (Online or In-Person)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Specific Questions or Notes for Counsellor
                </label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Mention any queries regarding document checklists, universities, or visa timelines..."
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--secondary"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="crm-stu-btn crm-stu-btn--primary"
                >
                  {submitting ? 'Submitting...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Direct Message Counsellor Modal ── */}
      {showMessageModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowMessageModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '1.35rem 1.5rem',
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Message Counsellor Priya Shah
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.15rem 0 0' }}>
                  Direct priority communication channel
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.25rem' }}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                  Message Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={counselorMessage}
                  onChange={(e) => setCounselorMessage(e.target.value)}
                  placeholder="Hi Priya, I have updated my SOP for U of T and would like you to review the draft..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8125rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--secondary"
                  onClick={() => setShowMessageModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="crm-stu-btn crm-stu-btn--primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FiSend /> {sendingMsg ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
