import { useEffect, useMemo, useState } from 'react';
import {
  FiAward,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiExternalLink,
  FiFileText,
  FiGlobe,
  FiHelpCircle,
  FiMapPin,
  FiMessageSquare,
  FiSearch,
  FiShield,
  FiUser,
  FiCheck,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { formatDate } from './components/portalFormat';
import {
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';
import './student-dashboard.theme.css';

function appStatusBadge(status) {
  const s = String(status || '').toUpperCase();
  if (['UNCONDITIONAL_OFFER', 'OFFER_RECEIVED', 'ACCEPTED', 'APPROVED'].includes(s)) {
    return {
      label: 'Unconditional Offer',
      chipClass: 'crm-stu-chip--success',
      tagColor: '#059669',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
    };
  }
  if (['CONDITIONAL_OFFER'].includes(s)) {
    return {
      label: 'Conditional Offer',
      chipClass: 'crm-stu-chip--amber',
      tagColor: '#d97706',
      bgColor: '#fffbeb',
      borderColor: '#fde68a',
    };
  }
  if (['UNDER_REVIEW'].includes(s)) {
    return {
      label: 'Under Faculty Review',
      chipClass: 'crm-stu-chip--amber',
      tagColor: '#b45309',
      bgColor: '#fef3c7',
      borderColor: '#fde68a',
    };
  }
  if (['SUBMITTED'].includes(s)) {
    return {
      label: 'Application Lodged',
      chipClass: 'crm-stu-chip--brand',
      tagColor: '#2563eb',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
    };
  }
  if (['REJECTED', 'WITHDRAWN'].includes(s)) {
    return {
      label: s.replace(/_/g, ' '),
      chipClass: 'crm-stu-chip--danger',
      tagColor: '#dc2626',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
    };
  }
  return {
    label: s.replace(/_/g, ' ') || 'In Progress',
    chipClass: 'crm-stu-chip--neutral',
    tagColor: '#475569',
    bgColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  };
}

function getUniversityMeta(uniName) {
  const name = (uniName || '').toLowerCase();
  if (name.includes('mcmaster')) {
    return {
      initials: 'MCM',
      brandColor: '#7A003C',
      accentColor: '#FDBF57',
      location: 'Hamilton, Ontario, Canada',
      flag: '🇨🇦',
      ranking: 'QS World #189 · Top 10 Canada',
      counsellor: 'Priya Shah (Lead Counsellor)',
      intake: 'Fall 2027 (Sept 2027)',
      appFee: '$150 CAD (Paid)',
      depositStatus: 'Conditional Acceptance',
      scholarship: 'Entrance Bursary Nominee',
    };
  }
  if (name.includes('waterloo')) {
    return {
      initials: 'UW',
      brandColor: '#E2231A',
      accentColor: '#FFD54F',
      location: 'Waterloo, Ontario, Canada',
      flag: '🇨🇦',
      ranking: 'QS World #112 · #1 Tech & CS',
      counsellor: 'Priya Shah (Lead Counsellor)',
      intake: 'Fall 2027 (Sept 2027)',
      appFee: '$125 CAD (Paid)',
      depositStatus: 'Awaiting Department Review',
      scholarship: 'Faculty Graduate Studentship Nominee',
    };
  }
  if (name.includes('toronto')) {
    return {
      initials: 'UofT',
      brandColor: '#002A5C',
      accentColor: '#1e3a8a',
      location: 'Toronto, Ontario, Canada',
      flag: '🇨🇦',
      ranking: 'QS World #21 · #1 in Canada',
      counsellor: 'Priya Shah (Lead Counsellor)',
      intake: 'Fall 2027 (Sept 2027)',
      appFee: '$130 CAD (Paid)',
      depositStatus: '$5,000 CAD Confirmed',
      scholarship: '$7,500 CAD Dean’s Excellence Award',
    };
  }
  if (name.includes('mcgill')) {
    return {
      initials: 'MCG',
      brandColor: '#ED1B2F',
      accentColor: '#b91c1c',
      location: 'Montreal, Quebec, Canada',
      flag: '🇨🇦',
      ranking: 'QS World #30 · Top Tier',
      counsellor: 'Priya Shah (Lead Counsellor)',
      intake: 'Fall 2027 (Sept 2027)',
      appFee: '$125 CAD (Paid)',
      depositStatus: 'Awaiting Offer Decision',
      scholarship: 'Eligible for Merit Bursary',
    };
  }
  if (name.includes('columbia') || name.includes('ubc')) {
    return {
      initials: 'UBC',
      brandColor: '#002145',
      accentColor: '#047857',
      location: 'Vancouver, BC, Canada',
      flag: '🇨🇦',
      ranking: 'QS World #34 · Research Leader',
      counsellor: 'Priya Shah (Lead Counsellor)',
      intake: 'Fall 2027 (Sept 2027)',
      appFee: '$145 CAD (Paid)',
      depositStatus: 'Under Committee Review',
      scholarship: 'Faculty Scholarship Nominee',
    };
  }
  return {
    initials: (uniName || 'UNI').substring(0, 3).toUpperCase(),
    brandColor: '#2563eb',
    accentColor: '#2563eb',
    location: 'Canada',
    flag: '🇨🇦',
    ranking: 'Accredited Institution',
    counsellor: 'Priya Shah (Lead Counsellor)',
    intake: 'Fall 2027 (Sept 2027)',
    appFee: 'Fee Paid',
    depositStatus: 'Standard Processing',
    scholarship: '',
  };
}

export default function StudentApplicationsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_APPLICATIONS)
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

  const counts = useMemo(() => {
    let offers = 0;
    let review = 0;
    let submitted = 0;

    rows.forEach((r) => {
      const s = String(r.status || '').toUpperCase();
      if (s.includes('OFFER') || s.includes('ACCEPTED') || s.includes('APPROVED')) offers += 1;
      else if (s === 'UNDER_REVIEW') review += 1;
      else if (s === 'SUBMITTED') submitted += 1;
    });

    return { all: rows.length, offers, review, submitted };
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const s = String(r.status || '').toUpperCase();
      if (activeTab === 'OFFERS' && !(s.includes('OFFER') || s.includes('ACCEPTED') || s.includes('APPROVED'))) {
        return false;
      }
      if (activeTab === 'REVIEW' && s !== 'UNDER_REVIEW') return false;
      if (activeTab === 'SUBMITTED' && s !== 'SUBMITTED') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const uni = (r.university || '').toLowerCase();
      const course = (r.course || '').toLowerCase();
      const appNo = (r.applicationNo || '').toLowerCase();
      return uni.includes(q) || course.includes(q) || appNo.includes(q);
    });
  }, [rows, activeTab, searchQuery]);

  if (loading) return <PortalSkeletonPage />;

  return (
    <div className="crm-stu-page-container">
      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Active Applications</span>
            <FiFileText className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{rows.length}</span>
            <span className="crm-stu-chip crm-stu-chip--brand">U of T, McGill, UBC</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Fall 2027 Canadian university intake
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Admissions Offers</span>
            <FiAward className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{counts.offers}</span>
            <span className="crm-stu-chip crm-stu-chip--success">Unconditional</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            University of Toronto granted admission
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Under Evaluation</span>
            <FiClock className="crm-stu-att-kpi-card__icon--amber" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{counts.review + counts.submitted}</span>
            <span className="crm-stu-chip crm-stu-chip--amber">On Track</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Faculty & Admissions committee review
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Scholarships Awarded</span>
            <FiDollarSign className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">$7,500</span>
            <span className="crm-stu-chip crm-stu-chip--success">CAD Granted</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Dean's International Merit Award
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div className="crm-stu-search-wrap" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`crm-stu-tab-btn${activeTab === 'ALL' ? ' crm-stu-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Applications <span className="crm-stu-tab-count">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`crm-stu-tab-btn${activeTab === 'OFFERS' ? ' crm-stu-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('OFFERS')}
          >
            Offers Received <span className="crm-stu-tab-count">{counts.offers}</span>
          </button>
          <button
            type="button"
            className={`crm-stu-tab-btn${activeTab === 'REVIEW' ? ' crm-stu-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('REVIEW')}
          >
            Under Review <span className="crm-stu-tab-count">{counts.review}</span>
          </button>
          <button
            type="button"
            className={`crm-stu-tab-btn${activeTab === 'SUBMITTED' ? ' crm-stu-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('SUBMITTED')}
          >
            Submitted <span className="crm-stu-tab-count">{counts.submitted}</span>
          </button>
        </div>

        <div className="crm-stu-search-box" style={{ width: 280 }}>
          <FiSearch className="crm-stu-input-icon" />
          <input
            type="text"
            className="crm-stu-search-input"
            placeholder="Search university or program..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Applications Cards List ── */}
      {!filteredRows.length ? (
        <PortalEmpty
          title="No applications match your filter"
          description="Click 'All Applications' to review all university submissions."
          icon={FiFileText}
          className="crm-portal-empty--inline"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filteredRows.map((row) => {
            const badge = appStatusBadge(row.status);
            const rawStatusUpper = String(row.status || '').toUpperCase();
            const isOffer = rawStatusUpper.includes('OFFER') || rawStatusUpper.includes('ACCEPTED') || rawStatusUpper.includes('APPROVED');
            const isConditional = rawStatusUpper === 'CONDITIONAL_OFFER';
            const meta = getUniversityMeta(row.university);
            const isExpanded = expandedId === row.id;

            // Structured 5-stage application journey
            const stages = [
              { label: 'Profile Shortlisted', done: true, current: false },
              { label: 'Documents Verified', done: true, current: false },
              { label: 'Application Lodged', done: true, current: !isOffer && row.status === 'SUBMITTED' },
              { label: 'Faculty Evaluation', done: isOffer || row.status === 'UNDER_REVIEW', current: !isOffer && row.status === 'UNDER_REVIEW' },
              { label: 'Official Decision', done: isOffer, current: isOffer },
            ];

            return (
              <div
                key={row.id}
                className="crm-stu-card"
                style={{
                  padding: '0.95rem 1.15rem',
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: isOffer ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                  boxShadow: isOffer
                    ? '0 2px 8px rgba(16, 185, 129, 0.06)'
                    : '0 1px 3px rgba(15, 23, 42, 0.03)',
                }}
              >
                {/* ── Card Header Row ── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Left: Monogram + University & Program Info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 280 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        background: meta.brandColor,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 850,
                        fontSize: '0.9375rem',
                        letterSpacing: '0.03em',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {meta.initials}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                        <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem' }}>
                          {meta.flag} {row.country || 'Canada'}
                        </span>
                        <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem' }}>
                          Intake: {row.intake || meta.intake}
                        </span>
                        <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem' }}>
                          App ID: #{row.applicationNo || 'APP-2026-CA'}
                        </span>
                      </div>

                      <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem', lineHeight: 1.25 }}>
                        {row.university}
                      </h2>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', margin: '0 0 0.2rem' }}>
                        {row.course}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FiMapPin style={{ color: '#94a3b8' }} /> {meta.location} · <strong style={{ color: '#334155' }}>{meta.ranking}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right: Status Pill & Toggle Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: badge.bgColor,
                        color: badge.tagColor,
                        border: `1px solid ${badge.borderColor}`,
                        boxShadow: isOffer ? '0 1px 4px rgba(16, 185, 129, 0.15)' : 'none',
                      }}
                    >
                      {isOffer && <FiCheck style={{ strokeWidth: 3 }} />}
                      {badge.label}
                    </span>

                    <button
                      type="button"
                      className="crm-stu-btn crm-stu-btn--secondary"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                      onClick={() => setExpandedId(isExpanded ? null : row.id)}
                    >
                      {isExpanded ? (
                        <>
                          <FiChevronUp /> Hide Timeline
                        </>
                      ) : (
                        <>
                          <FiChevronDown /> View Timeline
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Offer Highlight Box (If Unconditional/Conditional Offer) ── */}
                {isOffer && (
                  <div
                    style={{
                      margin: '0.55rem 0',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '8px',
                      background: isConditional ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                      border: isConditional ? '1px solid #fde68a' : '1px solid #a7f3d0',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isConditional ? '#fef3c7' : '#d1fae5',
                            color: isConditional ? '#d97706' : '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            flexShrink: 0,
                          }}
                        >
                          <FiAward />
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.8125rem', color: isConditional ? '#92400e' : '#065f46', display: 'block' }}>
                            {isConditional ? 'Official Conditional Offer of Admission Issued' : 'Official Unconditional Offer of Admission Granted'}
                          </strong>
                          <p style={{ margin: '0.05rem 0 0', fontSize: '0.75rem', color: isConditional ? '#b45309' : '#047857' }}>
                            Offer Issued: <strong>{formatDate(row.offerDate || row.updatedAt)}</strong> · {isConditional ? 'Requirement: Submit final degree transcript & credential evaluation' : `Deposit Status: ${meta.depositStatus}`}
                          </p>
                        </div>
                      </div>

                      {meta.scholarship && !meta.scholarship.includes('Standard Evaluation') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="crm-stu-chip crm-stu-chip--amber" style={{ fontWeight: 750, fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}>
                            🏆 Awarded: {meta.scholarship}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── 4-Column Structured Meta Grid ── */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '0.55rem',
                    background: '#f8fafc',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #f1f5f9',
                    marginTop: '0.55rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.02em', display: 'block' }}>
                      Application Lodged
                    </span>
                    <strong style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 750, display: 'block', marginTop: '0.15rem' }}>
                      {formatDate(row.submittedAt || row.createdAt)}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.02em', display: 'block' }}>
                      Decision Standing
                    </span>
                    <strong style={{ color: isOffer ? '#059669' : '#0f172a', fontSize: '0.875rem', fontWeight: 750, display: 'block', marginTop: '0.15rem' }}>
                      {row.offerDate ? `Admitted (${formatDate(row.offerDate)})` : isOffer ? 'Official Unconditional Offer' : isConditional ? 'Conditional Offer Issued' : 'In Committee Review'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.02em', display: 'block' }}>
                      Assigned Counsellor
                    </span>
                    <strong style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 750, display: 'block', marginTop: '0.15rem' }}>
                      {meta.counsellor}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 750, letterSpacing: '0.02em', display: 'block' }}>
                      Application Fee
                    </span>
                    <strong style={{ color: '#059669', fontSize: '0.875rem', fontWeight: 750, display: 'block', marginTop: '0.15rem' }}>
                      {meta.appFee}
                    </strong>
                  </div>
                </div>

                {/* ── Expanded Admission Lifecycle Stepper ── */}
                {isExpanded && (
                  <div style={{ marginTop: '0.55rem', paddingTop: '0.55rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          Admission Progress Lifecycle
                        </h4>
                        <p style={{ margin: '0.05rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                          Verified application pipeline tracking from shortlisting to official enrollment
                        </p>
                      </div>
                      <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem' }}>
                        Official Timeline
                      </span>
                    </div>

                    {/* Connected 5-Stage Stepper with Progress Track */}
                    <div
                      style={{
                        background: '#f8fafc',
                        padding: '0.75rem 1rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div className="crm-stu-timeline-track">
                        {stages.map((stg, sIdx) => {
                          const isDone = stg.done;
                          const isCurrent = stg.current;

                          let stepClass = 'crm-stu-timeline-step';
                          if (isDone) stepClass += ' crm-stu-timeline-step--done';
                          else if (isCurrent) stepClass += ' crm-stu-timeline-step--current';

                          return (
                            <div key={sIdx} className={stepClass}>
                              <div
                                className={`crm-stu-timeline-circle ${
                                  isDone
                                    ? 'crm-stu-timeline-circle--done'
                                    : isCurrent
                                    ? 'crm-stu-timeline-circle--current'
                                    : 'crm-stu-timeline-circle--pending'
                                }`}
                              >
                                {isDone ? <FiCheck style={{ strokeWidth: 3 }} /> : sIdx + 1}
                              </div>

                              <span
                                className="crm-stu-timeline-label"
                                style={{
                                  fontWeight: isCurrent ? 800 : isDone ? 700 : 500,
                                  color: isCurrent ? '#2563eb' : isDone ? '#0f172a' : '#94a3b8',
                                }}
                              >
                                {stg.label}
                              </span>

                              {isCurrent && (
                                <span
                                  style={{
                                    marginTop: '0.2rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    color: '#2563eb',
                                    background: '#eff6ff',
                                    padding: '0.05rem 0.35rem',
                                    borderRadius: '999px',
                                    border: '1px solid #bfdbfe',
                                  }}
                                >
                                  Current
                                </span>
                              )}
                            </div>
                          );
                        })}
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
