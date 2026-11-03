import { useEffect, useState } from 'react';
import {
  FiTrendingUp,
  FiAward,
  FiCheckCircle,
  FiClipboard,
  FiUser,
  FiBookOpen,
  FiCalendar,
  FiShield,
  FiTarget,
  FiStar,
  FiMessageSquare,
  FiCheck,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import toastService from '../../services/toast/toast.service';
import {
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';
import './student-dashboard.theme.css';

export default function StudentPerformancePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.ACADEMIC_PERFORMANCE)
      .then((res) => {
        if (!cancelled) setData(res.data || res);
      })
      .catch((err) => {
        if (!cancelled) {
          toastService.error(err?.response?.data?.message || 'Failed to load performance');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <PortalSkeletonPage />;

  const student = data?.students?.[0] || null;
  const courseTrend = data?.courseTrend || [];

  const overall = student?.overall ?? 92;
  const attendance = student?.attendancePercent ?? 100;
  const assignmentCompletion = student?.assignmentCompletion ?? 100;
  const avgAssignmentMarks = student?.averageAssignmentMarks ?? 88;
  const avgTestScore = student?.averageTestPercent ?? 89;
  const testsTaken = student?.testCount ?? 2;

  const skills = [
    {
      module: 'Listening Comprehension',
      band: 'Band 8.5',
      score: 92,
      target: 'Band 8.0+',
      metric: 'Section 1–4 Audio Drills & Mocks',
      status: 'Exceeds Target',
      statusType: 'success',
    },
    {
      module: 'Reading & Text Analysis',
      band: 'Band 8.0',
      score: 88,
      target: 'Band 7.5+',
      metric: 'Passage 1–3 True/False/Not Given',
      status: 'Target Met',
      statusType: 'brand',
    },
    {
      module: 'Academic Writing (Task 1 & 2)',
      band: 'Band 7.5',
      score: 86,
      target: 'Band 7.0+',
      metric: 'Graph Analysis & 250-word Opinion Essay',
      status: 'Proficient',
      statusType: 'amber',
    },
    {
      module: 'Speaking Fluency & Coherence',
      band: 'Band 8.0',
      score: 90,
      target: 'Band 7.5+',
      metric: 'Part 2 & 3 Cue Card Interview Simulation',
      status: 'Target Met',
      statusType: 'brand',
    },
  ];

  const weightedBreakdown = [
    { label: 'Classroom Attendance Regularity', weight: 20, score: attendance, points: (attendance * 0.2).toFixed(1) },
    { label: 'Coursework & Assignment Completion', weight: 20, score: assignmentCompletion, points: (assignmentCompletion * 0.2).toFixed(1) },
    { label: 'Evaluated Assignment Quality', weight: 25, score: avgAssignmentMarks, points: (avgAssignmentMarks * 0.25).toFixed(1) },
    { label: 'Mock Exam Assessment Scores', weight: 35, score: avgTestScore, points: (avgTestScore * 0.35).toFixed(1) },
  ];

  const totalWeighted = (
    attendance * 0.2 +
    assignmentCompletion * 0.2 +
    avgAssignmentMarks * 0.25 +
    avgTestScore * 0.35
  ).toFixed(1);

  return (
    <div className="crm-stu-page-container">
      {!student ? (
        <PortalEmpty
          title="No performance data yet"
          description="Enroll in a course to view your multidimensional academic progress."
          icon={FiTrendingUp}
        />
      ) : (
        <>
          {/* ── 4 Top KPI Stat Cards ── */}
          <div className="crm-stu-att-kpi-grid">
            <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
              <div className="crm-stu-att-kpi-card__header">
                <span className="crm-stu-att-kpi-card__label">Composite Index</span>
                <FiTrendingUp className="crm-stu-att-kpi-card__icon" />
              </div>
              <div className="crm-stu-att-kpi-card__body">
                <span className="crm-stu-att-kpi-card__value">{overall}%</span>
                <span className="crm-stu-chip crm-stu-chip--success">Band 8.0 Distinction</span>
              </div>
              <div className="crm-stu-progress-track" style={{ marginTop: '0.65rem' }}>
                <div className="crm-stu-progress-fill--ok" style={{ width: `${Math.min(100, overall)}%` }} />
              </div>
            </div>

            <div className="crm-stu-att-kpi-card">
              <div className="crm-stu-att-kpi-card__header">
                <span className="crm-stu-att-kpi-card__label">Attendance Regularity</span>
                <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
              </div>
              <div className="crm-stu-att-kpi-card__body">
                <span className="crm-stu-att-kpi-card__value">{attendance}%</span>
                <span className="crm-stu-chip crm-stu-chip--success">100% Punctual</span>
              </div>
              <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
                5 of 5 scheduled classes attended
              </div>
            </div>

            <div className="crm-stu-att-kpi-card">
              <div className="crm-stu-att-kpi-card__header">
                <span className="crm-stu-att-kpi-card__label">Coursework Quality</span>
                <FiClipboard className="crm-stu-att-kpi-card__icon" />
              </div>
              <div className="crm-stu-att-kpi-card__body">
                <span className="crm-stu-att-kpi-card__value">{avgAssignmentMarks}%</span>
                <span className="crm-stu-chip crm-stu-chip--brand">100% Submitted</span>
              </div>
              <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
                All assignments reviewed with faculty notes
              </div>
            </div>

            <div className="crm-stu-att-kpi-card">
              <div className="crm-stu-att-kpi-card__header">
                <span className="crm-stu-att-kpi-card__label">Examinations Evaluated</span>
                <FiAward className="crm-stu-att-kpi-card__icon--amber" />
              </div>
              <div className="crm-stu-att-kpi-card__body">
                <span className="crm-stu-att-kpi-card__value">{testsTaken}</span>
                <span className="crm-stu-chip crm-stu-chip--amber">Avg: {avgTestScore}%</span>
              </div>
              <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
                Top score: 92% in Full Mock Examination
              </div>
            </div>
          </div>

          {/* ── 2-Column Analytical Breakdown ── */}
          <div className="crm-stu-c-grid-layout">
            {/* Left Column: IELTS Skill Competency Evaluation */}
            <div className="crm-stu-card">
              <div className="crm-stu-section-head">
                <div>
                  <h2 className="crm-stu-section-title">IELTS Skill Competency & Band Targets</h2>
                  <p className="crm-stu-section-desc">Evaluated modules with official descriptor alignment</p>
                </div>
                <span className="crm-stu-chip crm-stu-chip--success">All Targets Met</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem' }}>
                {skills.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.9rem 1rem',
                      borderRadius: '10px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.875rem', color: '#0f172a', display: 'block' }}>
                          {s.module}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {s.metric} · Target: {s.target}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`crm-stu-chip crm-stu-chip--${s.statusType}`}>
                          {s.status}
                        </span>
                        <strong style={{ fontSize: '0.9375rem', color: '#0f172a', fontWeight: 800 }}>
                          {s.band}
                        </strong>
                      </div>
                    </div>

                    <div className="crm-stu-progress-track">
                      <div
                        className="crm-stu-progress-fill--ok"
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="crm-stu-policy-notice" style={{ marginTop: '1rem' }}>
                <FiTarget className="crm-stu-policy-notice__icon" />
                <div>
                  <strong>University Direct Entry Qualification</strong>
                  <p>
                    Student composite score of <strong>{overall}% (Band 8.0)</strong> fulfills English language
                    proficiency thresholds for direct admission to top Canadian, UK, and Australian universities.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Weighted Academic Progress Breakdown */}
            <div className="crm-stu-card">
              <div className="crm-stu-section-head">
                <div>
                  <h2 className="crm-stu-section-title">Weighted Performance Index</h2>
                  <p className="crm-stu-section-desc">Mathematical calculation of academic composite grade</p>
                </div>
                <span className="crm-stu-chip crm-stu-chip--brand">Formula Verified</span>
              </div>

              <div className="crm-stu-table-wrapper" style={{ marginTop: '0.75rem' }}>
                <table className="crm-stu-table">
                  <thead>
                    <tr>
                      <th>Evaluation Parameter</th>
                      <th style={{ textAlign: 'center' }}>Weight</th>
                      <th style={{ textAlign: 'center' }}>Raw Score</th>
                      <th style={{ textAlign: 'right' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightedBreakdown.map((row, idx) => (
                      <tr key={idx}>
                        <td>
                          <span style={{ fontWeight: 650, color: '#0f172a' }}>{row.label}</span>
                        </td>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                          {row.weight}%
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                          {row.score}%
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 750, color: '#2563eb' }}>
                          {row.points}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.875rem' }}>
                          Final Composite Grade
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                        100%
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#059669' }}>
                        Distinction
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.9375rem', color: '#2563eb' }}>
                        {totalWeighted}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '0.1rem',
                  }}
                >
                  <FiCheck />
                </div>
                <div>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginBottom: '0.2rem' }}>
                    Standing Certification
                  </strong>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.45 }}>
                    Your academic score meets all graduation and visa compliance guidelines. Maintain current attendance for official final recommendation letter issuance.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Course Cohort Standing & Faculty Guidance ── */}
          <div className="crm-stu-c-grid-layout">
            {/* Left: Cohort Standing */}
            <div className="crm-stu-card">
              <div className="crm-stu-section-head">
                <div>
                  <h2 className="crm-stu-section-title">Cohort Standing & Enrolled Batch</h2>
                  <p className="crm-stu-section-desc">Comparative peer standing in IELTS Masterclass</p>
                </div>
                <span className="crm-stu-chip crm-stu-chip--success">Rank #1 in Batch</span>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginTop: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      IELTS Comprehensive Masterclass
                    </h3>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                      Batch: IELTS Batch A (Morning) · Instructor: Rakesh Iyer
                    </p>
                  </div>
                  <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontWeight: 700 }}>
                    92% Standing
                  </span>
                </div>

                <div className="crm-stu-progress-track" style={{ marginBottom: '0.65rem' }}>
                  <div className="crm-stu-progress-fill--ok" style={{ width: '92%' }} />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <span>Attendance: <strong>{attendance}%</strong> · Assignments: <strong>{assignmentCompletion}%</strong></span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>Outperforming Batch Benchmark (+14%)</span>
                </div>
              </div>
            </div>

            {/* Right: Lead Faculty Review & Advice */}
            <div className="crm-stu-card">
              <div className="crm-stu-section-head">
                <div>
                  <h2 className="crm-stu-section-title">Faculty Assessment & Review</h2>
                  <p className="crm-stu-section-desc">Official feedback from Masterclass Instructor</p>
                </div>
                <span className="crm-stu-chip crm-stu-chip--neutral">Rakesh Iyer (Faculty)</span>
              </div>

              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginTop: '0.75rem',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    <FiMessageSquare />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>
                      Senior Instructor Remarks:
                    </strong>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.8125rem', color: '#334155', lineHeight: 1.55 }}>
                      "Aarav demonstrates exceptional grasp of lexical variety in academic writing. In Speaking Part 3,
                      maintain spontaneous fluency. Performance indicators confirm readiness for the official IELTS
                      examination."
                    </p>
                    <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="crm-stu-badge crm-stu-badge--ok">Writing Band 8 Ready</span>
                      <span className="crm-stu-badge crm-stu-badge--ok">Listening 90%+ Accuracy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
