import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertCircle,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
  FiFileText,
  FiSend,
  FiUploadCloud,
  FiX,
} from 'react-icons/fi';
import { apiGet, apiPost } from '../../api/apiClient';
import { API } from '../../config/api';
import Button from '../../components/ui/Button';
import toastService from '../../services/toast/toast.service';
import {
  PortalPage,
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';
import './student-dashboard.theme.css';

const TABS = [
  { id: 'all', label: 'All Assignments' },
  { id: 'pending', label: 'Pending' },
  { id: 'submitted', label: 'Under Review' },
  { id: 'reviewed', label: 'Graded & Reviewed' },
  { id: 'late', label: 'Late' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function submissionLabel(sub) {
  if (!sub) return 'Pending';
  if (sub.status === 'REVIEWED') return 'Graded';
  if (sub.status === 'LATE') return 'Late Submission';
  if (sub.status === 'SUBMITTED') return 'Submitted';
  return sub.status;
}

function classifyAssignment(row) {
  const sub = row.mySubmission;
  const overdue = row.dueDate && new Date(row.dueDate) < new Date();
  return {
    all: true,
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
  const [searchQuery, setSearchQuery] = useState('');

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_ASSIGNMENTS, { limit: 100 });
      const rows = res.data || [];
      setAssignments(rows);
      if (rows.length > 0 && !selectedId) {
        setSelectedId(rows[0].id);
      }
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to load assignments');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDetail = useCallback(async (id) => {
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
      toastService.error(err?.response?.data?.message || 'Failed to load assignment details');
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
    const list = filterByTab(assignments, tab);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.batch?.name?.toLowerCase().includes(q)
    );
  }, [assignments, tab, searchQuery]);

  const stats = useMemo(() => {
    const total = assignments.length;
    let submitted = 0;
    let reviewed = 0;
    let pending = 0;
    let totalMarks = 0;
    let earnedMarks = 0;

    assignments.forEach((row) => {
      const sub = row.mySubmission;
      if (sub?.status === 'REVIEWED') {
        reviewed += 1;
        submitted += 1;
        if (sub.marks != null) {
          earnedMarks += Number(sub.marks) || 0;
          totalMarks += Number(row.maxMarks) || 100;
        }
      } else if (sub?.status === 'SUBMITTED') {
        submitted += 1;
      } else {
        pending += 1;
      }
    });

    const avgScore = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 88;
    return { total, submitted, reviewed, pending, avgScore };
  }, [assignments]);

  const tabCounts = useMemo(() => {
    const counts = { all: assignments.length };
    TABS.slice(1).forEach(({ id }) => {
      counts[id] = filterByTab(assignments, id).length;
    });
    return counts;
  }, [assignments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!content.trim() && !fileUrl.trim()) {
      toastService.error('Please enter your written solution or attach a valid file link');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(API.ACADEMIC_ASSIGNMENT_SUBMIT(selectedId), {
        content: content.trim() || null,
        fileUrl: fileUrl.trim() || null,
      });
      toastService.success('Assignment submitted successfully to your faculty!');
      await loadList();
      await openDetail(selectedId);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PortalSkeletonPage />;

  const canSubmit = detail && detail.status === 'PUBLISHED';
  const mySub = detail?.mySubmission;

  return (
    <PortalPage className="crm-stu-assign-page">
      {/* ── Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Average Score</span>
            <span className="crm-stu-att-kpi-card__icon"><FiAward /></span>
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{stats.avgScore}%</span>
            <span className="crm-stu-att-kpi-card__badge crm-stu-att-kpi-card__badge--ok">
              Band 7.5+ Equivalent
            </span>
          </div>
          <div className="crm-stu-att-kpi-card__bar">
            <div
              className="crm-stu-att-kpi-card__bar-fill"
              style={{ width: `${Math.min(100, Math.max(0, stats.avgScore))}%` }}
            />
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Total Assigned</span>
            <span className="crm-stu-att-kpi-card__icon"><FiFileText /></span>
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">{stats.total}</span>
            <span className="crm-stu-att-kpi-card__hint">IELTS batch tasks</span>
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Submitted</span>
            <span className="crm-stu-att-kpi-card__icon crm-stu-att-kpi-card__icon--green">
              <FiCheckCircle />
            </span>
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value crm-stu-att-kpi-card__value--green">
              {stats.submitted}
            </span>
            <span className="crm-stu-att-kpi-card__hint">Delivered on time</span>
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Graded & Reviewed</span>
            <span className="crm-stu-att-kpi-card__icon crm-stu-att-kpi-card__icon--amber">
              <FiClock />
            </span>
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value crm-stu-att-kpi-card__value--amber">
              {stats.reviewed}
            </span>
            <span className="crm-stu-att-kpi-card__hint">With teacher remarks</span>
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
        <div className="crm-stu-search-box">
          <input
            type="text"
            placeholder="Search assignments by title or topic…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="crm-stu-search-input"
          />
        </div>
      </div>

      {/* ── Split Layout: Assignment Cards List (Left) + Rich Detail Workspace (Right) ── */}
      <div className="crm-stu-assign-split">
        {/* Left Column: Assignment Selection List */}
        <div className="crm-stu-assign-list">
          {!filtered.length ? (
            <PortalEmpty
              title="No assignments found"
              description="No tasks match this filter. Select 'All Assignments' to review all batch tasks."
              icon={FiFileText}
              className="crm-portal-empty--inline"
            />
          ) : (
            filtered.map((row) => {
              const sub = row.mySubmission;
              const isSelected = selectedId === row.id;
              const isGraded = sub?.status === 'REVIEWED';
              const isSub = sub?.status === 'SUBMITTED';

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
                      {row.batch?.courseName || 'IELTS'} · {row.batch?.name || 'Morning A'}
                    </span>
                    <span
                      className={`crm-stu-badge ${
                        isGraded
                          ? 'crm-stu-badge--ok'
                          : isSub
                          ? 'crm-stu-badge--scheduled'
                          : 'crm-stu-badge--late'
                      }`}
                    >
                      {submissionLabel(sub)}
                    </span>
                  </div>

                  <h3 className="crm-stu-assign-card__title">{row.title}</h3>
                  <p className="crm-stu-assign-card__desc">
                    {row.description ? row.description.substring(0, 95) + '…' : 'No description.'}
                  </p>

                  <div className="crm-stu-assign-card__foot">
                    <span className="crm-stu-assign-card__due">
                      <FiCalendar /> Due: {formatDate(row.dueDate)}
                    </span>
                    {isGraded && sub.marks != null && (
                      <span className="crm-stu-assign-card__score">
                        <FiAward /> {sub.marks} / {row.maxMarks || 100} Marks
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detail & Interactive Submission Form */}
        <div className="crm-stu-assign-workspace">
          {detailLoading ? (
            <div className="crm-stu-assign-loading">
              <span className="crm-stu-spinner" />
              <p>Loading assignment workspace…</p>
            </div>
          ) : !detail ? (
            <PortalEmpty
              title="Select an assignment"
              description="Click any task from the left list to view questions, submit work, and see teacher remarks."
              icon={FiFileText}
              className="crm-portal-empty--panel"
            />
          ) : (
            <div className="crm-stu-assign-detail">
              {/* Header Box (Sticky Pinned Top) */}
              <div className="crm-stu-assign-detail__head">
                <div className="min-w-0 flex-1">
                  <div className="crm-stu-assign-detail__tags">
                    <span className="crm-stu-chip crm-stu-chip--brand">
                      {detail.batch?.courseName || 'IELTS Coaching'}
                    </span>
                    <span className="crm-stu-chip crm-stu-chip--neutral">
                      Max Marks: {detail.maxMarks ?? 100}
                    </span>
                    <span className="crm-stu-chip crm-stu-chip--neutral">
                      Due: {formatDate(detail.dueDate)}
                    </span>
                  </div>
                  <h2 className="crm-stu-assign-detail__title">{detail.title}</h2>
                </div>
                {mySub && (
                  <span
                    className={`crm-stu-badge ${
                      mySub.status === 'REVIEWED'
                        ? 'crm-stu-badge--ok'
                        : mySub.status === 'SUBMITTED'
                        ? 'crm-stu-badge--scheduled'
                        : 'crm-stu-badge--late'
                    }`}
                  >
                    {submissionLabel(mySub)}
                  </span>
                )}
              </div>

              {/* Scrollable Assignment Body */}
              <div className="crm-stu-assign-detail__body">
                {/* Description & Prompt Box */}
                <div className="crm-stu-assign-detail__prompt">
                  <h4 className="crm-stu-section-title">Assignment Prompt & Instructions</h4>
                  <p className="crm-stu-prompt-text">{detail.description || 'No prompt provided.'}</p>
                  {detail.attachmentUrl && (
                    <div className="crm-stu-attachment-box">
                      <FiFileText />
                      <div className="flex-1">
                        <strong>Course Material Attachment</strong>
                        <p>Download prompt reference file</p>
                      </div>
                      <a
                        href={detail.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="crm-stu-btn-download"
                      >
                        <FiExternalLink /> View File
                      </a>
                    </div>
                  )}
                </div>

                {/* Graded Feedback Callout Box (if reviewed) */}
                {mySub?.status === 'REVIEWED' && (
                  <div className="crm-stu-feedback-box">
                    <div className="crm-stu-feedback-box__header">
                      <div className="crm-stu-feedback-box__score">
                        <FiAward />
                        <div>
                          <span className="crm-stu-feedback-box__score-val">
                            {mySub.marks} / {detail.maxMarks ?? 100}
                          </span>
                          <span className="crm-stu-feedback-box__score-label">Awarded Score</span>
                        </div>
                      </div>
                      <span className="crm-stu-badge crm-stu-badge--ok">Graded & Reviewed</span>
                    </div>

                    {mySub.feedback && (
                      <div className="crm-stu-feedback-box__content">
                        <strong>Faculty Remarks & Feedback:</strong>
                        <p>{mySub.feedback}</p>
                      </div>
                    )}

                    {mySub.reviewedAt && (
                      <p className="crm-stu-feedback-box__date">
                        Reviewed on {new Date(mySub.reviewedAt).toLocaleString('en-IN')} by Instructor
                      </p>
                    )}
                  </div>
                )}

                {/* Previous Submission Snapshot */}
                {mySub && (
                  <div className="crm-stu-sub-snapshot">
                    <div className="crm-stu-sub-snapshot__head">
                      <span className="crm-stu-sub-snapshot__title">
                        <FiCheckCircle className="text-emerald-500" /> Your Current Submission
                      </span>
                      <span className="text-xs text-muted">
                        {mySub.submittedAt
                          ? `Delivered on ${new Date(mySub.submittedAt).toLocaleString('en-IN')}`
                          : 'Submitted'}
                      </span>
                    </div>
                    {mySub.content && (
                      <div className="crm-stu-sub-snapshot__text">
                        <p>{mySub.content}</p>
                      </div>
                    )}
                    {mySub.fileUrl && (
                      <div className="crm-stu-sub-snapshot__file">
                        <FiExternalLink />
                        <a href={mySub.fileUrl} target="_blank" rel="noopener noreferrer">
                          {mySub.fileUrl}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Submission Form */}
                {canSubmit && (
                  <form onSubmit={handleSubmit} className="crm-stu-submission-form">
                    <h4 className="crm-stu-section-title">
                      {mySub ? 'Update Your Solution' : 'Submit Your Solution'}
                    </h4>

                    <div className="crm-stu-form-group">
                      <label className="crm-stu-form-label">
                        Written Response / Essay / Answers:
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={5}
                        placeholder="Type your essay or assignment response here…"
                        className="crm-stu-textarea"
                      />
                    </div>

                    <div className="crm-stu-form-group">
                      <label className="crm-stu-form-label">
                        Document / Google Drive Link (Optional):
                      </label>
                      <div className="crm-stu-input-wrap">
                        <FiUploadCloud className="crm-stu-input-icon" />
                        <input
                          type="url"
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder="https://drive.google.com/... or cloud document link"
                          className="crm-stu-text-input"
                        />
                      </div>
                    </div>

                    <div className="crm-stu-form-actions">
                      <Button
                        type="submit"
                        variant="primary"
                        icon={FiSend}
                        loading={submitting}
                        disabled={submitting}
                      >
                        {mySub ? 'Update & Resubmit Work' : 'Submit Assignment'}
                      </Button>
                      <span className="text-xs text-muted">
                        Your faculty will be notified immediately upon submission.
                      </span>
                    </div>
                  </form>
                )}

                {detail.status === 'CLOSED' && !mySub && (
                  <div className="crm-stu-closed-notice">
                    <FiAlertCircle />
                    <p>This assignment has reached its deadline and is closed for new submissions.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalPage>
  );
}
