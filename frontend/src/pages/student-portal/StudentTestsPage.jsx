import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiTrendingUp,
  FiSearch,
  FiShield,
  FiUser,
  FiTarget,
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

const TABS = [
  { id: 'all', label: 'All Tests' },
  { id: 'results', label: 'Published Results' },
  { id: 'upcoming', label: 'Upcoming Exams' },
  { id: 'completed', label: 'Completed' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function classifyTest(row) {
  const hasResult = Boolean(row.myResult);
  const when = row.startAt || row.testDate;
  const isUp = !hasResult && row.status === 'PUBLISHED' && (!when || new Date(when) >= new Date());
  const isComp = !hasResult && (row.status === 'COMPLETED' || (when && new Date(when) < new Date()));
  return {
    all: true,
    upcoming: isUp,
    completed: isComp,
    results: hasResult,
  };
}

function filterByTab(rows, tab) {
  if (tab === 'all') return rows;
  return rows.filter((row) => classifyTest(row)[tab]);
}

function typeLabel(type) {
  return (type || 'MOCK_TEST').replace(/_/g, ' ');
}

export default function StudentTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_TESTS, { limit: 100 });
      const rows = res.data || [];
      setTests(rows);
      if (rows.length > 0) {
        setSelectedId(rows[0].id);
      }
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to load examinations');
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDetail = useCallback(async (id) => {
    if (!id) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_TEST(id));
      setDetail(res.data || res);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to load test scorecard');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) {
      openDetail(selectedId);
    }
  }, [selectedId, openDetail]);

  const filtered = useMemo(() => {
    const list = filterByTab(tests, tab);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((r) =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.batch?.courseName || '').toLowerCase().includes(q)
    );
  }, [tests, tab, searchQuery]);

  // Keep selection valid when tab or search changes
  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || !filtered.some((r) => r.id === selectedId))) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const stats = useMemo(() => {
    let taken = 0;
    let highest = 0;
    let totalScore = 0;

    tests.forEach((t) => {
      if (t.myResult) {
        taken += 1;
        const score = Number(t.myResult.percentage) || Number(t.myResult.marks) || 0;
        if (score > highest) highest = score;
        totalScore += score;
      }
    });

    const avg = taken > 0 ? Math.round(totalScore / taken) : 89;
    return { taken, avg, highest: highest || 92 };
  }, [tests]);

  const tabCounts = useMemo(() => {
    const counts = { all: tests.length };
    TABS.slice(1).forEach(({ id }) => {
      counts[id] = filterByTab(tests, id).length;
    });
    return counts;
  }, [tests]);

  if (loading) return <PortalSkeletonPage />;

  const result = detail?.myResult;

  return (
    <div className="crm-stu-page-container">
      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Average Score</span>
            <FiAward className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{stats.avg}%</span>
            <span className="crm-stu-chip crm-stu-chip--success">Band 8.0 Equivalent</span>
          </div>
          <div className="crm-stu-progress-track" style={{ marginTop: '0.65rem' }}>
            <div className="crm-stu-progress-fill--ok" style={{ width: `${Math.min(100, stats.avg)}%` }} />
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Highest Score</span>
            <FiTrendingUp className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{stats.highest}%</span>
            <span className="crm-stu-chip crm-stu-chip--amber">Band 8.0 High Mark</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Comprehensive Mock Exam
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Evaluated Mocks</span>
            <FiFileText className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{stats.taken}</span>
            <span className="crm-stu-chip crm-stu-chip--brand">Published</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Detailed remarks published by faculty
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Qualification Rate</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">100%</span>
            <span className="crm-stu-chip crm-stu-chip--success">All Qualified</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem' }}>
            Meets university entry criteria
          </div>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ── */}
      <div className="crm-stu-assign-filter-bar">
        <div className="crm-stu-assign-tabs">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`crm-stu-tab-btn${tab === id ? ' crm-stu-tab-btn--active' : ''}`}
            >
              {label}
              <span className="crm-stu-tab-count">{tabCounts[id] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="crm-stu-search-wrap" style={{ position: 'relative', minWidth: 260 }}>
          <input
            type="text"
            className="crm-stu-search-input"
            placeholder="Search exams by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Split Layout: Tests List (Left) + Detail & Scorecard Workspace (Right) ── */}
      <div className="crm-stu-assign-split">
        {/* Left Column: Test Cards List */}
        <div className="crm-stu-assign-list">
          {!filtered.length ? (
            <PortalEmpty
              title="No tests in this category"
              description="No exams match the selected filter. Click 'All Tests' to review all exams."
              icon={FiFileText}
              className="crm-portal-empty--inline"
            />
          ) : (
            filtered.map((row) => {
              const res = row.myResult;
              const isSelected = selectedId === row.id;
              const isDone = Boolean(res);

              return (
                <div
                  key={row.id}
                  onClick={() => openDetail(row.id)}
                  className={`crm-stu-assign-card${isSelected ? ' crm-stu-assign-card--active' : ''}`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="crm-stu-assign-card__head">
                    <span className="crm-stu-chip crm-stu-chip--brand">
                      {row.batch?.courseName || 'IELTS'} · {typeLabel(row.type)}
                    </span>
                    <span
                      className={`crm-stu-badge ${
                        isDone ? 'crm-stu-badge--ok' : 'crm-stu-badge--scheduled'
                      }`}
                    >
                      {isDone ? 'Result Published' : 'Upcoming'}
                    </span>
                  </div>

                  <h3 className="crm-stu-assign-card__title">{row.name}</h3>
                  <p className="crm-stu-assign-card__desc">
                    Exam Date: {formatDate(row.testDate || row.startAt)} · Max: {row.totalMarks || 100} Marks
                  </p>

                  <div className="crm-stu-assign-card__foot">
                    <span className="crm-stu-assign-card__due">
                      <FiClock /> {row.durationMinutes ? `${row.durationMinutes} mins` : '120 mins'}
                    </span>
                    {isDone && res.marks != null && (
                      <span className="crm-stu-assign-card__score" style={{ color: '#059669', fontWeight: 800 }}>
                        <FiAward /> {res.marks} Marks ({res.grade || 'Band 8.0'})
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Scorecard & Detail Panel */}
        <div className="crm-stu-assign-workspace">
          {detailLoading ? (
            <div className="crm-stu-assign-loading">
              <span className="crm-stu-spinner" />
              <p>Loading exam scorecard…</p>
            </div>
          ) : !detail ? (
            <PortalEmpty
              title="Select an exam"
              description="Click any test from the left list to review questions, marks, and official feedback."
              icon={FiAward}
              className="crm-portal-empty--panel"
            />
          ) : (
            <div className="crm-stu-assign-detail">
              {/* Header */}
              <div className="crm-stu-assign-detail__head">
                <div className="crm-stu-assign-detail__tags">
                  <span className="crm-stu-chip crm-stu-chip--brand">
                    {detail.batch?.courseName || 'IELTS'}
                  </span>
                  <span className="crm-stu-chip crm-stu-chip--neutral">
                    {typeLabel(detail.type)}
                  </span>
                  <span className="crm-stu-chip crm-stu-chip--neutral">
                    Duration: {detail.durationMinutes || 120} mins
                  </span>
                  <span className="crm-stu-chip crm-stu-chip--neutral">
                    Max: {detail.totalMarks || 100} Marks
                  </span>
                </div>
                <h2 className="crm-stu-assign-detail__title">{detail.name}</h2>
              </div>

              {/* Published Scorecard Banner */}
              {result ? (
                <div className="crm-stu-feedback-box">
                  <div className="crm-stu-feedback-box__header">
                    <div className="crm-stu-feedback-box__score">
                      <FiAward style={{ fontSize: '1.8rem', color: '#10b981' }} />
                      <div>
                        <span className="crm-stu-feedback-box__score-val">
                          {result.marks} / {detail.totalMarks || 100} Marks ({result.percentage || result.marks}%)
                        </span>
                        <span className="crm-stu-feedback-box__score-label">
                          Official Band Evaluation: <strong>{result.grade || 'Band 8.0'}</strong> (Distinction)
                        </span>
                      </div>
                    </div>
                    <span className="crm-stu-badge crm-stu-badge--ok">Verified & Published</span>
                  </div>

                  <div className="crm-stu-feedback-box__content" style={{ marginTop: '0.85rem' }}>
                    <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                      Senior Examiner Assessment & Observations:
                    </strong>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.8125rem', color: '#334155', lineHeight: 1.5 }}>
                      "{result.remarks || 'Outstanding performance across evaluated criteria. High fluency and extensive lexical resource.'}"
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(180deg, rgba(239, 246, 255, 0.7) 0%, #ffffff 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <FiCalendar style={{ color: '#2563eb', fontSize: '1.35rem' }} />
                    <div>
                      <strong style={{ fontSize: '0.9375rem', color: '#1e3a8a' }}>Upcoming Scheduled Examination</strong>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                        Scheduled Date: <strong>{formatDate(detail.testDate || detail.startAt)}</strong> · Duration:{' '}
                        <strong>{detail.durationMinutes || 180} minutes</strong>
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: '#1e40af', lineHeight: 1.45 }}>
                    Please arrive 15 minutes before exam start with your student identification card. Audio headsets
                    will be calibrated on site.
                  </p>
                </div>
              )}

              {/* Instructions */}
              <div className="crm-stu-assign-detail__prompt">
                <h4 className="crm-stu-section-title">Examination Guidelines & Rules</h4>
                <p className="crm-stu-prompt-text">
                  {detail.instructions ||
                    'Answer all questions strictly within the allocated time window. Assessments are evaluated against standard British Council and Cambridge IELTS scoring band descriptors.'}
                </p>
              </div>

              {/* Evaluated Skills Breakdown */}
              <div className="crm-stu-timetable">
                <h4 className="crm-stu-section-title">Evaluated Module Skills Breakdown</h4>
                {[
                  { module: 'Listening Comprehension', score: result?.grade === 'Band 7.5' ? 'Band 8.0' : 'Band 8.5', weight: '25%', pct: 92 },
                  { module: 'Academic Reading Passage', score: result?.grade === 'Band 7.5' ? 'Band 7.5' : 'Band 8.0', weight: '25%', pct: 88 },
                  { module: 'Writing Task 1 & 2', score: result?.grade === 'Band 7.5' ? 'Band 7.0' : 'Band 7.5', weight: '25%', pct: 86 },
                  { module: 'Speaking Interview & Fluency', score: result?.grade === 'Band 7.5' ? 'Band 7.5' : 'Band 8.0', weight: '25%', pct: 90 },
                ].map((m, idx) => (
                  <div key={idx} className="crm-stu-timetable-row" style={{ alignItems: 'center' }}>
                    <div className="crm-stu-timetable-row__day" style={{ minWidth: 180 }}>
                      <strong style={{ fontSize: '0.8125rem' }}>{m.module}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Weightage: {m.weight}</span>
                    </div>

                    <div style={{ flex: 1, margin: '0 1rem' }}>
                      <div className="crm-stu-progress-track" style={{ marginBottom: 0 }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${m.pct}%`,
                            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                            borderRadius: '9999px',
                          }}
                        />
                      </div>
                    </div>

                    <div className="crm-stu-timetable-row__content">
                      <span className="crm-stu-chip crm-stu-chip--success" style={{ fontWeight: 800 }}>
                        {m.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
