import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiCheckCircle, FiClock, FiFileText, FiX } from 'react-icons/fi';
import { apiGet, apiPost } from '../../api/apiClient';
import { API } from '../../config/api';
import Button from '../../components/ui/Button';
import toastService from '../../services/toast/toast.service';
import {
  PortalPage,
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'reviewed', label: 'Reviewed' },
  { id: 'late', label: 'Late' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function submissionLabel(sub) {
  if (!sub) return 'Pending';
  if (sub.status === 'REVIEWED') return 'Reviewed';
  if (sub.status === 'LATE') return 'Late';
  if (sub.status === 'SUBMITTED') return 'Submitted';
  return sub.status;
}

function statusTone(sub, dueDate) {
  if (!sub) {
    if (dueDate && new Date(dueDate) < new Date()) return 'text-danger bg-danger-soft';
    return 'text-warning bg-warning-soft';
  }
  if (sub.status === 'REVIEWED') return 'text-success bg-success-soft';
  if (sub.status === 'LATE') return 'text-danger bg-danger-soft';
  return 'text-brand bg-brand-soft';
}

function classifyAssignment(row) {
  const sub = row.mySubmission;
  const overdue = row.dueDate && new Date(row.dueDate) < new Date();
  return {
    pending: !sub && row.status !== 'CLOSED' && !overdue,
    submitted: sub?.status === 'SUBMITTED',
    reviewed: sub?.status === 'REVIEWED',
    late: sub?.status === 'LATE' || (!sub && overdue),
  };
}

function filterByTab(rows, tab) {
  if (tab === 'all') return rows;
  return rows.filter((row) => classifyAssignment(row)[tab]);
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_ASSIGNMENTS, { limit: 100 });
      setAssignments(res.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const filtered = useMemo(() => filterByTab(assignments, tab), [assignments, tab]);

  const tabCounts = useMemo(() => {
    const counts = { all: assignments.length };
    TABS.slice(1).forEach(({ id }) => {
      counts[id] = filterByTab(assignments, id).length;
    });
    return counts;
  }, [assignments]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetailLoading(true);
    setContent('');
    setFileUrl('');
    try {
      const res = await apiGet(API.ACADEMIC_ASSIGNMENT(id));
      const row = res.data || res;
      setDetail(row);
      setContent(row.mySubmission?.content || '');
      setFileUrl(row.mySubmission?.fileUrl || '');
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to load assignment');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!content.trim() && !fileUrl.trim()) {
      toastService.error('Add written content or a file link to submit');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(API.ACADEMIC_ASSIGNMENT_SUBMIT(selectedId), {
        content: content.trim() || null,
        fileUrl: fileUrl.trim() || null,
      });
      toastService.success('Assignment submitted');
      await loadList();
      await openDetail(selectedId);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PortalSkeletonPage />;

  const canSubmit = detail && detail.status === 'PUBLISHED';

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
              title="No assignments in this category"
              description="Try another tab or check back later."
              icon={FiFileText}
              className="crm-portal-empty--inline"
            />
          ) : (
            filtered.map((row) => {
              const sub = row.mySubmission;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openDetail(row.id)}
                  className={`crm-portal-pick-card${selectedId === row.id ? ' crm-portal-pick-card--active' : ''}`}
                >
                  <div className="crm-portal-pick-card__row">
                    <div className="min-w-0">
                      <p className="crm-portal-pick-card__eyebrow">
                        {row.batch?.courseName || row.batch?.name || 'Course'}
                      </p>
                      <h3 className="crm-portal-pick-card__title truncate">{row.title}</h3>
                      <p className="crm-portal-pick-card__meta">
                        <FiCalendar size={12} /> Due {formatDate(row.dueDate)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusTone(sub, row.dueDate)}`}>
                      {submissionLabel(sub)}
                    </span>
                  </div>
                  {sub?.status === 'REVIEWED' && sub.marks != null && (
                    <p className="crm-portal-pick-card__score">
                      {sub.marks} / {row.maxMarks ?? 100} marks
                    </p>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="crm-portal-split__detail">
          {!selectedId ? (
            <PortalEmpty
              title="Select an assignment"
              description="View details and submit from here."
              icon={FiFileText}
              className="crm-portal-empty--panel"
            />
          ) : detailLoading ? (
            <p className="crm-portal-empty crm-portal-empty--panel text-text-secondary">Loading…</p>
          ) : detail ? (
            <div className="crm-portal-split__detail-body">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="crm-portal-pick-card__eyebrow">
                    {detail.batch?.courseName || detail.batch?.name}
                  </p>
                  <h3 className="crm-portal-pick-card__title" style={{ fontSize: '1rem' }}>{detail.title}</h3>
                </div>
                <button type="button" onClick={closeDetail} className="text-text-secondary hover:text-text">
                  <FiX />
                </button>
              </div>

              {detail.description && (
                <p className="whitespace-pre-wrap text-sm text-text-secondary">{detail.description}</p>
              )}

              <div className="crm-portal-split__detail-meta">
                <div className="crm-portal-split__meta-cell">
                  <span className="crm-portal-split__meta-label">Due date</span>
                  <p className="font-medium text-text">{formatDate(detail.dueDate)}</p>
                </div>
                <div className="crm-portal-split__meta-cell">
                  <span className="crm-portal-split__meta-label">Max marks</span>
                  <p className="font-medium text-text">{detail.maxMarks ?? 100}</p>
                </div>
              </div>

              {detail.attachmentUrl && (
                <a
                  href={detail.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand hover:underline"
                >
                  <FiFileText /> Download assignment file
                </a>
              )}

              {detail.mySubmission && (
                <div className="rounded-lg border border-border bg-page/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-text">
                    {detail.mySubmission.status === 'REVIEWED' ? <FiCheckCircle className="text-success" /> : <FiClock />}
                    Your submission — {submissionLabel(detail.mySubmission)}
                  </div>
                  {detail.mySubmission.submittedAt && (
                    <p className="text-xs text-text-secondary">
                      Submitted {new Date(detail.mySubmission.submittedAt).toLocaleString('en-IN')}
                    </p>
                  )}
                  {detail.mySubmission.content && (
                    <p className="whitespace-pre-wrap text-sm text-text-secondary">{detail.mySubmission.content}</p>
                  )}
                  {detail.mySubmission.fileUrl && (
                    <a href={detail.mySubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline">
                      View submitted file
                    </a>
                  )}
                  {detail.mySubmission.status === 'REVIEWED' && (
                    <div className="mt-2 border-t border-border pt-2">
                      {detail.mySubmission.marks != null && (
                        <p className="text-lg font-semibold text-success">
                          {detail.mySubmission.marks} / {detail.maxMarks ?? 100} marks
                        </p>
                      )}
                      {detail.mySubmission.feedback && (
                        <p className="mt-1 text-sm text-text-secondary">
                          <span className="font-medium text-text">Feedback: </span>
                          {detail.mySubmission.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {canSubmit && (
                <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-3">
                  <h4 className="font-medium text-text text-sm">
                    {detail.mySubmission ? 'Update submission' : 'Submit assignment'}
                  </h4>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    placeholder="Write your answer or notes…"
                    className="w-full rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none"
                  />
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="File link (Google Drive, etc.)"
                    className="w-full rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none"
                  />
                  <Button type="submit" loading={submitting} disabled={submitting}>
                    {detail.mySubmission ? 'Resubmit' : 'Submit'}
                  </Button>
                </form>
              )}

              {detail.status === 'CLOSED' && !detail.mySubmission && (
                <p className="text-sm text-danger">This assignment is closed and no longer accepts submissions.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </PortalPage>
  );
}
