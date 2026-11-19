import { useEffect, useState } from 'react';
import {
  FiCheckCircle,
  FiFileText,
  FiGlobe,
  FiShield,
  FiUser,
  FiCalendar,
  FiClock,
  FiAward,
  FiCreditCard,
  FiCheck,
  FiDownload,
  FiMessageSquare,
  FiExternalLink,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { formatDate } from './components/portalFormat';
import {
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';
import toastService from '../../services/toast/toast.service';
import './student-dashboard.theme.css';

function visaStatusBadge(status) {
  const s = String(status || '').toUpperCase();
  if (['APPROVED', 'GRANTED', 'VISA_GRANTED'].includes(s)) {
    return { label: 'Visa Approved', chipClass: 'crm-stu-chip--success' };
  }
  if (['REJECTED', 'REFUSED'].includes(s)) {
    return { label: 'Refused', chipClass: 'crm-stu-chip--danger' };
  }
  if (['APPLICATION_SUBMITTED', 'BIOMETRICS_DONE', 'INTERVIEW_SCHEDULED'].includes(s)) {
    return { label: s.replace(/_/g, ' '), chipClass: 'crm-stu-chip--brand' };
  }
  if (['DOCUMENTS_COLLECTED'].includes(s)) {
    return { label: 'Documents Collected', chipClass: 'crm-stu-chip--amber' };
  }
  return { label: s.replace(/_/g, ' ') || 'In Preparation', chipClass: 'crm-stu-chip--neutral' };
}

export default function StudentVisaPage() {
  const [rows, setRows] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_VISAS)
      .then((res) => {
        if (!cancelled) {
          const data = res.data || [];
          setRows(data);
          if (data[0]?.id) setExpandedId(data[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PortalSkeletonPage />;

  const visa = rows[0] || null;

  const sdsChecklist = [
    {
      id: 'loa',
      title: 'Designated Learning Institution (DLI) Acceptance',
      detail: 'Official Acceptance / Offer of Admission Letter on file',
      status: 'VERIFIED',
      date: 'On File',
    },
    {
      id: 'gic',
      title: 'Financial Solvency & Living Expenses Proof',
      detail: 'Proof of Funds / Bank Solvency Certificate on file',
      status: 'VERIFIED',
      date: 'On File',
    },
    {
      id: 'tuition',
      title: 'Tuition Fee Payment / University Deposit',
      detail: 'Fee Payment Receipt / Confirmation on file',
      status: 'VERIFIED',
      date: 'On File',
    },
    {
      id: 'ielts',
      title: 'Language Proficiency Credential',
      detail: 'Official Language / Academic Test Report on file',
      status: 'VERIFIED',
      date: 'On File',
    },
    {
      id: 'medical',
      title: 'Immigration Medical Examination Sheet',
      detail: 'Medical Examination Sheet attached',
      status: 'VERIFIED',
      date: 'On File',
    },
    {
      id: 'pcc',
      title: 'Police Clearance Certificate (PCC)',
      detail: 'National Police Verification Certificate on file',
      status: 'VERIFIED',
      date: 'On File',
    },
  ];

  return (
    <div className="crm-stu-page-container">
      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Active Visa Case</span>
            <FiShield className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{rows.length} {rows.length === 1 ? 'Case' : 'Cases'}</span>
            <span className={`crm-stu-chip ${rows.length > 0 ? 'crm-stu-chip--success' : 'crm-stu-chip--neutral'}`}>
              {rows.length > 0 ? 'Active' : 'Advisory Stage'}
            </span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            {rows[0]?.country ? `${rows[0].country} Study Visa` : 'Study Visa Guidance'}
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Visa Stream</span>
            <FiCreditCard className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.0625rem' }}>
              {rows[0]?.visaType || 'Student Visa'}
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">{rows[0]?.country || 'Destination'}</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            {rows[0]?.applicationNo ? `Case File: ${rows[0].applicationNo}` : 'Pre-visa document preparation'}
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Document Readiness</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">In Review</span>
            <span className="crm-stu-chip crm-stu-chip--success">Verified Files</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Financial & academic documentation
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Visa Advisory</span>
            <FiFileText className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">Active</span>
            <span className="crm-stu-chip crm-stu-chip--brand">Counsellor</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Direct guidance for consulate filing
          </div>
        </div>
      </div>

      {/* ── Visa Records ── */}
      {!rows.length ? (
        <PortalEmpty
          title="No visa records yet"
          description="Your visa filing timeline will activate as soon as your university acceptance is confirmed."
          icon={FiShield}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rows.map((row) => {
            const badge = visaStatusBadge(row.status);
            const expanded = expandedId === row.id;

            return (
              <div
                key={row.id}
                className="crm-stu-card"
                style={{ padding: '1.25rem 1.5rem', borderRadius: '12px' }}
              >
                {/* Header Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                  onClick={() => setExpandedId(expanded ? null : row.id)}
                >
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                      <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontWeight: 750, fontSize: '0.75rem' }}>
                        Destination: {row.country || 'Destination'}
                      </span>
                      <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontWeight: 650, fontSize: '0.75rem' }}>
                        Permit: {row.visaType || 'Study Visa'}
                      </span>
                      <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontWeight: 650, fontSize: '0.75rem' }}>
                        File #: {row.applicationNo || 'Case File'}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
                      {row.country ? `${row.country} Student Visa Application` : 'Student Visa Application'}
                    </h2>
                    <p style={{ fontSize: '0.875rem', fontWeight: 650, color: '#2563eb', margin: 0 }}>
                      Course & Session: {row.course || 'Study Abroad Program'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`crm-stu-chip ${badge.chipClass}`} style={{ fontSize: '0.8125rem', padding: '0.4rem 0.95rem', fontWeight: 750 }}>
                      {badge.label}
                    </span>
                    <button
                      type="button"
                      className="crm-stu-btn crm-stu-btn--secondary"
                      style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
                    >
                      {expanded ? 'Collapse' : 'View Full Details'}
                    </button>
                  </div>
                </div>

                {/* Progress Details */}
                {expanded && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                    {/* Key Metrics Row with clear typography */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '0.85rem',
                        background: '#f8fafc',
                        padding: '1rem 1.15rem',
                        borderRadius: '10px',
                        marginBottom: '1.25rem',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <span style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.03em' }}>
                          SDS Eligibility
                        </span>
                        <p style={{ margin: '0.25rem 0 0', fontWeight: 750, fontSize: '0.9375rem', color: '#059669' }}>
                          IELTS Band 8.0 (Qualified)
                        </p>
                      </div>

                      <div>
                        <span style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.03em' }}>
                          GIC Certificate
                        </span>
                        <p style={{ margin: '0.25rem 0 0', fontWeight: 750, fontSize: '0.9375rem', color: '#0f172a' }}>
                          $20,635 CAD (Confirmed)
                        </p>
                      </div>

                      <div>
                        <span style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.03em' }}>
                          Upfront Medical
                        </span>
                        <p style={{ margin: '0.25rem 0 0', fontWeight: 750, fontSize: '0.9375rem', color: '#059669' }}>
                          Passed (Apollo Hospitals)
                        </p>
                      </div>

                      <div>
                        <span style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.03em' }}>
                          Biometrics Status
                        </span>
                        <p style={{ margin: '0.25rem 0 0', fontWeight: 750, fontSize: '0.9375rem', color: '#2563eb' }}>
                          Awaiting Submission
                        </p>
                      </div>
                    </div>

                    {/* Timeline Track with Stage Labels */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div className="crm-stu-section-head" style={{ marginBottom: '0.65rem' }}>
                        <div>
                          <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            Immigration Visa Journey Timeline
                          </h4>
                          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                            Step-by-step IRCC Study Permit progression tracker
                          </p>
                        </div>
                        <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}>
                          Official IRCC Stage
                        </span>
                      </div>

                      <div
                        className="crm-stu-timeline-track"
                        style={{
                          background: '#f8fafc',
                          padding: '1.25rem 1rem',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {(row.timeline || []).map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className={`crm-stu-timeline-step${step.done ? ' crm-stu-timeline-step--done' : ''}${step.current ? ' crm-stu-timeline-step--current' : ''}`}
                          >
                            <div
                              className={`crm-stu-timeline-circle ${step.done ? 'crm-stu-timeline-circle--done' : step.current ? 'crm-stu-timeline-circle--current' : 'crm-stu-timeline-circle--pending'}`}
                              style={{ width: 34, height: 34, fontSize: '0.875rem' }}
                            >
                              {step.done ? <FiCheck style={{ strokeWidth: 3 }} /> : sIdx + 1}
                            </div>
                            <span
                              className="crm-stu-timeline-label"
                              style={{
                                fontSize: '0.8125rem',
                                fontWeight: step.current ? 800 : step.done ? 750 : 600,
                                color: step.current ? '#2563eb' : step.done ? '#0f172a' : '#64748b',
                                marginTop: '0.4rem',
                              }}
                            >
                              {step.label}
                            </span>
                            {step.current && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  color: '#2563eb',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  marginTop: '2px',
                                  background: '#eff6ff',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}
                              >
                                Current Stage
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── 2-Column Section: SDS Compliance Checklist + Next Immediate Actions ── */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                        gap: '1rem',
                      }}
                    >
                      {/* Left: SDS Document Verification Checklist */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '1.15rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                              SDS Compliance Checklist
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                              Mandatory documents for Canadian Student Direct Stream
                            </p>
                          </div>
                          <span className="crm-stu-chip crm-stu-chip--success" style={{ fontSize: '0.75rem' }}>
                            6/6 Ready
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {sdsChecklist.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                padding: '0.55rem 0.75rem',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #f1f5f9',
                                gap: '0.5rem',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', minWidth: 0 }}>
                                <div
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    background: '#dcfce7',
                                    color: '#059669',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                  }}
                                >
                                  <FiCheck />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>
                                    {item.title}
                                  </strong>
                                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '1px' }}>
                                    {item.detail}
                                  </span>
                                </div>
                              </div>

                              <span
                                className="crm-stu-chip crm-stu-chip--success"
                                style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', flexShrink: 0 }}
                              >
                                Verified
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Next Action & Counsellor Desk */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Next Action Box */}
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                            border: '1px solid #bfdbfe',
                            borderRadius: '10px',
                            padding: '1.15rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                            <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                              IMMEDIATE NEXT MILESTONE
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 650 }}>
                              IRCC Visa Lodgment & Biometrics
                            </span>
                          </div>

                          <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
                            Consulate & Biometrics Appointment
                          </h4>
                          <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0 0 0.85rem', lineHeight: 1.5 }}>
                            Your visa dossier has all verified documents attached. Once your visa file is officially lodged, appointment scheduling and submission instructions will be coordinated with your assigned counsellor.
                          </p>

                          <div
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '0.65rem 0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem',
                            }}
                          >
                            <div>
                              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 750, display: 'block' }}>
                                Visa Lodgment Standing
                              </span>
                              <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                                Pre-Filing Review & Dossier Readiness
                              </strong>
                            </div>
                            <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
                              In Progress
                            </span>
                          </div>
                        </div>

                        {/* Assigned Counsellor Support Box */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '1.15rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                background: '#eff6ff',
                                color: '#2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.15rem',
                                fontWeight: 800,
                                flexShrink: 0,
                                border: '1px solid #bfdbfe',
                              }}
                            >
                              CO
                            </div>
                            <div>
                              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 750, display: 'block' }}>
                                Assigned Study Abroad Counsellor
                              </span>
                              <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                                Admissions & Visa Advisory Desk
                              </strong>
                              <span style={{ fontSize: '0.75rem', color: '#475569', display: 'block' }}>
                                Direct Student Mentor
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <button
                              type="button"
                              className="crm-stu-btn crm-stu-btn--primary"
                              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.95rem' }}
                              onClick={() => toastService.info('Opening direct priority chat with your counsellor')}
                            >
                              <FiMessageSquare /> Contact Counsellor
                            </button>
                            <button
                              type="button"
                              className="crm-stu-btn crm-stu-btn--secondary"
                              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.95rem' }}
                              onClick={() => toastService.success('Downloading verified document dossier')}
                            >
                              <FiDownload /> Dossier
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
