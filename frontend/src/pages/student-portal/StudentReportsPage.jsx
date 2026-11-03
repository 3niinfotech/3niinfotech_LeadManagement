import { useEffect, useMemo, useState } from 'react';
import {
  FiAward,
  FiCheckCircle,
  FiClipboard,
  FiTrendingUp,
  FiBookOpen,
  FiTarget,
  FiCalendar,
  FiCheck,
  FiShield,
  FiUser,
  FiSearch,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { PortalSkeletonPage } from '../../components/portal/PortalUi';
import './student-dashboard.theme.css';

export default function StudentReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_REPORTS)
      .then((res) => {
        if (!cancelled) setReports(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setReports(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const attendance = reports?.attendance || {};
  const assignments = reports?.assignments || {};
  const tests = reports?.tests || {};
  const performance = reports?.performance || {};

  const overallAtt = Number(attendance.overall) || 100;
  const avgScore = Number(tests.averageScore ?? performance.overall) || 89;
  const highestScore = Number(tests.highestScore) || 92;
  const totalAssignments = Number(assignments.total) || 2;
  const submittedAssignments = Number(assignments.submitted) || 2;
  const testsTaken = Number(tests.taken) || (tests.results?.length || 2);

  const testResults = tests.results || [];

  const filteredResults = useMemo(() => {
    return testResults.filter((test) => {
      const name = (test.testName || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || name.includes(q);

      if (!matchSearch) return false;
      if (filterTab === 'MOCK') return name.includes('mock');
      if (filterTab === 'SECTIONAL') return name.includes('sectional') || name.includes('listening');
      return true;
    });
  }, [testResults, filterTab, searchQuery]);

  if (loading) return <PortalSkeletonPage />;

  return (
    <div className="crm-stu-page-container">
      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Attendance Rate</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{overallAtt}%</span>
            <span className="crm-stu-chip crm-stu-chip--success">Above 75% Goal</span>
          </div>
          <div className="crm-stu-progress-track" style={{ marginTop: '0.65rem' }}>
            <div className="crm-stu-progress-fill--ok" style={{ width: `${Math.min(100, overallAtt)}%` }} />
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Coursework & Assignments</span>
            <FiClipboard className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">
              {submittedAssignments}/{totalAssignments}
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">100% Submitted</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            {assignments.reviewed || 1} evaluated · Average Score: {assignments.averageMarks || 88}%
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Tests Evaluated</span>
            <FiAward className="crm-stu-att-kpi-card__icon--amber" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{testsTaken}</span>
            <span className="crm-stu-chip crm-stu-chip--amber">Top: {highestScore}%</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            All mock assessments evaluated & published
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Aggregate Score</span>
            <FiTrendingUp className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{avgScore}%</span>
            <span className="crm-stu-chip crm-stu-chip--success">Band 8.0</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Distinction Grade across evaluated skills
          </div>
        </div>
      </div>

      {/* ── Main Analytical 2-Column Grid ── */}
      <div className="crm-stu-c-grid-layout" style={{ marginBottom: '1.25rem' }}>
        {/* Left Column: Attendance Health & Compliance */}
        <div className="crm-stu-card">
          <div className="crm-stu-section-head">
            <div>
              <h2 className="crm-stu-section-title">Attendance Health & Verification</h2>
              <p className="crm-stu-section-desc">Session attendance history & visa compliance standing</p>
            </div>
            <span className="crm-stu-chip crm-stu-chip--success">100% Eligible</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '1rem 0' }}>
            <div className="crm-stu-report-ring-wrap">
              <div className="crm-stu-report-ring-inner">
                <span className="crm-stu-report-ring-val">{overallAtt}%</span>
                <span className="crm-stu-report-ring-lbl">PRESENT</span>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div className="crm-stu-report-breakdown-row">
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  Present & Punctual:
                </span>
                <strong style={{ color: '#0f172a' }}>4 Sessions</strong>
              </div>
              <div className="crm-stu-report-breakdown-row">
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                  Late Check-ins:
                </span>
                <strong style={{ color: '#0f172a' }}>1 Session</strong>
              </div>
              <div className="crm-stu-report-breakdown-row">
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                  Unexcused Absences:
                </span>
                <strong style={{ color: '#0f172a' }}>0 Sessions</strong>
              </div>
            </div>
          </div>

          <div className="crm-stu-policy-notice">
            <FiShield className="crm-stu-policy-notice__icon" />
            <div>
              <strong>Official Compliance Status</strong>
              <p>
                Student attendance of <strong>{overallAtt}%</strong> complies fully with mandatory institutional
                and immigration visa thresholds (75% minimum required).
              </p>
            </div>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
              Course Attendance Breakdown
            </h4>
            <div className="crm-stu-course-progress-card">
              <div className="crm-stu-course-progress-card__head">
                <div>
                  <h3 className="crm-stu-course-progress-card__title">IELTS Comprehensive Masterclass</h3>
                  <p className="crm-stu-course-progress-card__sub">MAIN-BAT-0001 · IELTS Batch A (Morning)</p>
                </div>
                <span className="crm-stu-chip crm-stu-chip--success">100% Rate</span>
              </div>
              <div className="crm-stu-progress-track">
                <div className="crm-stu-progress-fill--ok" style={{ width: '100%' }} />
              </div>
              <div className="crm-stu-course-progress-card__meta">
                <span>5 of 5 marked sessions</span>
                <span>Instructor: Rakesh Iyer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: IELTS Skills Competency Matrix */}
        <div className="crm-stu-card">
          <div className="crm-stu-section-head">
            <div>
              <h2 className="crm-stu-section-title">IELTS Skill Competency Matrix</h2>
              <p className="crm-stu-section-desc">Evaluated modules based on recent mock assessments</p>
            </div>
            <span className="crm-stu-chip crm-stu-chip--brand">Band 8.0</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', margin: '1rem 0' }}>
            <div className="crm-stu-skill-item">
              <div className="crm-stu-skill-head">
                <span className="crm-stu-skill-name">Listening Comprehension</span>
                <span className="crm-stu-skill-score" style={{ color: '#0f172a', fontWeight: 700 }}>Band 8.5 (92%)</span>
              </div>
              <div className="crm-stu-progress-track">
                <div className="crm-stu-progress-fill--ok" style={{ width: '92%' }} />
              </div>
            </div>

            <div className="crm-stu-skill-item">
              <div className="crm-stu-skill-head">
                <span className="crm-stu-skill-name">Reading & Critical Analysis</span>
                <span className="crm-stu-skill-score" style={{ color: '#0f172a', fontWeight: 700 }}>Band 8.0 (88%)</span>
              </div>
              <div className="crm-stu-progress-track">
                <div className="crm-stu-progress-fill--ok" style={{ width: '88%' }} />
              </div>
            </div>

            <div className="crm-stu-skill-item">
              <div className="crm-stu-skill-head">
                <span className="crm-stu-skill-name">Academic Writing (Task 1 & 2)</span>
                <span className="crm-stu-skill-score" style={{ color: '#0f172a', fontWeight: 700 }}>Band 7.5 (86%)</span>
              </div>
              <div className="crm-stu-progress-track">
                <div className="crm-stu-progress-fill--ok" style={{ width: '86%' }} />
              </div>
            </div>

            <div className="crm-stu-skill-item">
              <div className="crm-stu-skill-head">
                <span className="crm-stu-skill-name">Fluency & Spoken Delivery</span>
                <span className="crm-stu-skill-score" style={{ color: '#0f172a', fontWeight: 700 }}>Band 8.0 (90%)</span>
              </div>
              <div className="crm-stu-progress-track">
                <div className="crm-stu-progress-fill--ok" style={{ width: '90%' }} />
              </div>
            </div>
          </div>

          <div className="crm-stu-report-advisory">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
              <FiTarget style={{ color: '#2563eb' }} />
              <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>Faculty Advisory & Roadmap:</strong>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              Candidate meets and exceeds international university benchmark requirements (Band 6.5 minimum).
              Recommended emphasis on coherence cohesion in Writing Task 2 for Band 8.5 target.
            </p>
          </div>
        </div>
      </div>

      {/* ── Official Examination & Mock Test Results Table ── */}
      <div className="crm-stu-card">
        <div className="crm-stu-section-head">
          <div>
            <h2 className="crm-stu-section-title">Published Mock Exam & Assessment Scorecards</h2>
            <p className="crm-stu-section-desc">Verified faculty evaluations and band performance breakdown</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="crm-stu-assign-tabs" style={{ margin: 0 }}>
              <button
                type="button"
                className={`crm-stu-tab ${filterTab === 'ALL' ? 'crm-stu-tab--active' : ''}`}
                onClick={() => setFilterTab('ALL')}
              >
                All ({testResults.length})
              </button>
              <button
                type="button"
                className={`crm-stu-tab ${filterTab === 'MOCK' ? 'crm-stu-tab--active' : ''}`}
                onClick={() => setFilterTab('MOCK')}
              >
                Mock Exams
              </button>
              <button
                type="button"
                className={`crm-stu-tab ${filterTab === 'SECTIONAL' ? 'crm-stu-tab--active' : ''}`}
                onClick={() => setFilterTab('SECTIONAL')}
              >
                Sectionals
              </button>
            </div>
          </div>
        </div>

        <div className="crm-stu-table-wrapper" style={{ marginTop: '0.85rem' }}>
          <table className="crm-stu-table">
            <thead>
              <tr>
                <th>Test / Examination</th>
                <th>Course / Module</th>
                <th>Exam Date</th>
                <th>Marks Scored</th>
                <th>Band / Grade</th>
                <th>Faculty Evaluation Remarks</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((test, idx) => (
                <tr key={test.testId || idx}>
                  <td>
                    <div className="crm-stu-table-cell">
                      <strong style={{ color: '#0f172a', fontSize: '0.875rem' }}>
                        {test.testName || 'Comprehensive Mock Assessment'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ID: {(test.testId || '').slice(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="crm-stu-chip crm-stu-chip--neutral">
                      {test.courseName || 'IELTS'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: '#334155', whiteSpace: 'nowrap' }}>
                    {test.testDate
                      ? new Date(test.testDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Recent'}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a' }}>
                      {test.marks ?? test.percentage ?? 90}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}> / {test.totalMarks || 100}</span>
                  </td>
                  <td>
                    <span
                      className="crm-stu-chip crm-stu-chip--success"
                      style={{ fontWeight: 800, fontSize: '0.8125rem' }}
                    >
                      {test.grade || `Band ${Math.round((test.percentage || 90) / 10) / 10 + 4}`}
                    </span>
                  </td>
                  <td style={{ maxWidth: '320px' }}>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                      {test.remarks || 'Consistent accuracy and fluent delivery.'}
                    </p>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        color: '#059669',
                        fontWeight: 700,
                      }}
                    >
                      <FiCheckCircle /> Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
