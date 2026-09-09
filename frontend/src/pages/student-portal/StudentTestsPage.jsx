import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAward, FiCalendar, FiClock, FiFileText } from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import toastService from '../../services/toast/toast.service';
import {
  PortalPage,
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'results', label: 'Results' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function testWhen(row) {
  return row.startAt || row.testDate;
}

function isUpcoming(row) {
  if (row.myResult) return false;
  const when = testWhen(row);
  if (row.status === 'PUBLISHED') {
    if (!when) return true;
    return new Date(when) >= new Date();
  }
  return false;
}

function isCompleted(row) {
  if (row.myResult) return false;
  if (row.status === 'COMPLETED') return !row.resultsPublished;
  const when = testWhen(row);
  return when && new Date(when) < new Date();
}

function classifyTest(row) {
  const hasResult = Boolean(row.myResult);
  return {
    upcoming: !hasResult && isUpcoming(row),
    completed: !hasResult && isCompleted(row),
    results: hasResult,
  };
}

function filterByTab(rows, tab) {
  return rows.filter((row) => classifyTest(row)[tab]);
}

function typeLabel(type) {
  return (type || 'TEST').replace(/_/g, ' ');
}

export default function StudentTestsPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_TESTS, { limit: 100 });
      setTests(res.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to load tests');
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const filtered = useMemo(() => filterByTab(tests, tab), [tests, tab]);

  const tabCounts = useMemo(() => {
    const counts = {};
    TABS.forEach(({ id }) => {
      counts[id] = filterByTab(tests, id).length;
    });
    return counts;
  }, [tests]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_TEST(id));
      setDetail(res.data || res);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to load test');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <PortalSkeletonPage />;

  return (
    <PortalPage>
      <div className="crm-portal-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`crm-portal-tab${tab === id ? ' crm-portal-tab--active' : ''}`}
          >
            {label}
            <span className="ml-1.5 text-[11px] opacity-80">({tabCounts[id] ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="crm-portal-split">
        <div className="crm-portal-split__list">
          {!filtered.length ? (
            <PortalEmpty
              title="No tests in this category"
              description="Try another tab or check back later."
              icon={FiFileText}
              className="crm-portal-empty--inline"
            />
          ) : (
            filtered.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => openDetail(row.id)}
                className={`crm-portal-pick-card${selectedId === row.id ? ' crm-portal-pick-card--active' : ''}`}
              >
                <div className="crm-portal-pick-card__row">
                  <div className="min-w-0">
                    <p className="crm-portal-pick-card__eyebrow">
                      {row.batch?.courseName || row.batch?.name} · {typeLabel(row.type)}
                    </p>
                    <h3 className="crm-portal-pick-card__title truncate">{row.name}</h3>
                    <p className="crm-portal-pick-card__meta">
                      <FiCalendar size={12} /> {formatDateTime(testWhen(row))}
                    </p>
                  </div>
                  {row.myResult && (
                    <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-success">
                      {row.myResult.grade || `${row.myResult.percentage ?? row.myResult.marks}%`}
                    </span>
                  )}
                </div>
                {row.myResult?.marks != null && (
                  <p className="crm-portal-pick-card__score">
                    {row.myResult.marks} / {row.totalMarks ?? 100}
                  </p>
                )}
              </button>
            ))
          )}
        </div>

        <div className="crm-portal-split__detail">
          {!selectedId ? (
            <PortalEmpty
              title="Select a test"
              description="View schedule, marks, and results here."
              icon={FiFileText}
              className="crm-portal-empty--panel"
            />
          ) : detailLoading ? (
            <p className="crm-portal-empty crm-portal-empty--panel text-text-secondary">Loading…</p>
          ) : detail ? (
            <div className="crm-portal-split__detail-body">
              <div>
                <p className="crm-portal-pick-card__eyebrow">
                  {detail.batch?.courseName || detail.batch?.name} · {typeLabel(detail.type)}
                </p>
                <h3 className="crm-portal-pick-card__title" style={{ fontSize: '1rem' }}>{detail.name}</h3>
              </div>

              {detail.instructions && (
                <p className="whitespace-pre-wrap text-sm text-text-secondary">{detail.instructions}</p>
              )}

              <div className="crm-portal-split__detail-meta">
                <div className="crm-portal-split__meta-cell">
                  <span className="crm-portal-split__meta-label">Date</span>
                  <p className="font-medium text-text">{formatDateTime(testWhen(detail))}</p>
                </div>
                <div className="crm-portal-split__meta-cell">
                  <span className="crm-portal-split__meta-label">Duration</span>
                  <p className="font-medium text-text">
                    {detail.durationMinutes ? `${detail.durationMinutes} min` : '—'}
                  </p>
                </div>
                <div className="crm-portal-split__meta-cell">
                  <span className="crm-portal-split__meta-label">Total marks</span>
                  <p className="font-medium text-text">{detail.totalMarks ?? 100}</p>
                </div>
                <div className="crm-portal-split__meta-cell">
                  <span className="crm-portal-split__meta-label">Passing marks</span>
                  <p className="font-medium text-text">{detail.passingMarks ?? '—'}</p>
                </div>
              </div>

              {detail.startAt && detail.endAt && (
                <p className="flex items-center gap-2 text-xs text-text-secondary">
                  <FiClock size={12} />
                  Window: {formatDateTime(detail.startAt)} – {formatDateTime(detail.endAt)}
                </p>
              )}

              {detail.myResult ? (
                <div className="rounded-lg border border-success/30 bg-success-soft/30 p-3 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-success text-sm">
                    <FiAward /> Your result
                  </div>
                  <div className="crm-portal-split__detail-meta">
                    <div className="crm-portal-split__meta-cell">
                      <span className="crm-portal-split__meta-label">Marks</span>
                      <p className="text-lg font-bold text-text">
                        {detail.myResult.marks ?? '—'} / {detail.totalMarks ?? 100}
                      </p>
                    </div>
                    <div className="crm-portal-split__meta-cell">
                      <span className="crm-portal-split__meta-label">Grade</span>
                      <p className="text-lg font-bold text-text">{detail.myResult.grade || '—'}</p>
                    </div>
                    {detail.myResult.percentage != null && (
                      <div className="crm-portal-split__meta-cell">
                        <span className="crm-portal-split__meta-label">Percentage</span>
                        <p className="font-semibold text-text">{detail.myResult.percentage}%</p>
                      </div>
                    )}
                  </div>
                  {detail.myResult.remarks && (
                    <p className="text-sm text-text-secondary">
                      <span className="font-medium text-text">Remarks: </span>
                      {detail.myResult.remarks}
                    </p>
                  )}
                </div>
              ) : detail.status === 'COMPLETED' && detail.resultsPublished ? (
                <p className="text-sm text-text-secondary">Results are being processed.</p>
              ) : tab === 'upcoming' ? (
                <p className="text-sm text-brand">Prepare for this assessment. Good luck!</p>
              ) : (
                <p className="text-sm text-text-secondary">Results not published yet.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </PortalPage>
  );
}
