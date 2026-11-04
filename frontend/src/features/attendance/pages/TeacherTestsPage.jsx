import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiFileText,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiCalendar,
  FiSearch,
  FiAward,
  FiUsers,
  FiBarChart2,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import DeleteConfirmModal from '../../../components/ui/DeleteConfirmModal';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Select from '../../../components/ui/Select';
import { apiDelete, apiGet, apiPost, apiPut } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import toastService from '../../../services/toast/toast.service';
import { useTeacherBatches } from '../hooks/useTeacherBatches';
import { formatDate, statusColor } from '../components/teacherWorkspaceUi';
import '../styles/teacher-academic.css';

const EMPTY_FORM = {
  name: '',
  type: 'TEST',
  batchId: '',
  testDate: '',
  totalMarks: 100,
  passingMarks: 40,
  instructions: '',
  status: 'PUBLISHED',
};

export default function TeacherTestsPage() {
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.ATTENDANCE_MARK);
  const { batchOptions, loading: batchesLoading } = useTeacherBatches();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [resultsOpen, setResultsOpen] = useState(false);
  const [testDetail, setTestDetail] = useState(null);
  const [resultDraft, setResultDraft] = useState({});
  const [publishing, setPublishing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [batchFilter, setBatchFilter] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_TESTS, { limit: 100 });
      setRows(res?.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load tests');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      batchId: batchOptions[0]?.value || '',
      testDate: new Date().toISOString().slice(0, 10),
    });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name || '',
      type: row.type || 'TEST',
      batchId: row.batchId || '',
      testDate: row.testDate ? row.testDate.slice(0, 10) : '',
      totalMarks: row.totalMarks ?? 100,
      passingMarks: row.passingMarks ?? 40,
      instructions: row.instructions || '',
      status: row.status || 'DRAFT',
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.batchId) {
      toastService.error('Test name and batch are required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        totalMarks: Number(form.totalMarks) || 100,
        passingMarks: form.passingMarks ? Number(form.passingMarks) : null,
        testDate: form.testDate || null,
      };
      if (editing) {
        await apiPut(API.ACADEMIC_TEST(editing.id), body);
        toastService.success('Test updated successfully');
      } else {
        await apiPost(API.ACADEMIC_TESTS, body);
        toastService.success('Test scheduled successfully');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(API.ACADEMIC_TEST(deleteTarget.id));
      toastService.success('Examination deleted successfully');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const openResults = async (row) => {
    try {
      const [testRes, studentsRes] = await Promise.all([
        apiGet(API.ACADEMIC_TEST(row.id)),
        apiGet(API.ACADEMIC_TEACHER_STUDENTS, { batchId: row.batchId, limit: 100 }),
      ]);
      const detail = testRes?.data || testRes;
      const students = studentsRes?.data || [];
      const existing = Object.fromEntries((detail.results || []).map((r) => [r.studentId, r]));
      const merged = students.map((s) => ({
        studentId: s.id,
        student: s,
        marks: existing[s.id]?.marks ?? null,
        remarks: existing[s.id]?.remarks ?? null,
      }));
      setTestDetail({ ...detail, results: merged });
      const draft = {};
      merged.forEach((r) => {
        draft[r.studentId] = { marks: r.marks ?? '', remarks: r.remarks ?? '' };
      });
      setResultDraft(draft);
      setResultsOpen(true);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load test');
    }
  };

  const saveResults = async (publish = false) => {
    if (!testDetail) return;
    setPublishing(true);
    try {
      const results = Object.entries(resultDraft)
        .filter(([, v]) => v.marks !== '' && v.marks != null)
        .map(([studentId, v]) => ({
          studentId,
          marks: Number(v.marks),
          remarks: v.remarks || null,
        }));
      await apiPut(API.ACADEMIC_TEST_RESULTS(testDetail.id), { results, publish });
      toastService.success(publish ? 'Test results published live' : 'Draft results saved');
      setResultsOpen(false);
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setPublishing(false);
    }
  };

  // KPIs & Summary Stat Items
  const kpis = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.status === 'COMPLETED').length;
    const published = rows.filter((r) => r.status === 'PUBLISHED').length;
    const drafts = rows.filter((r) => r.status === 'DRAFT').length;
    return { total, completed, published, drafts };
  }, [rows]);

  const summaryItems = useMemo(() => [
    {
      key: 'total',
      label: 'Total Tests',
      value: kpis.total,
      icon: FiFileText,
      tone: 'neutral',
      filterValue: 'ALL',
      badge: 'All Quizzes',
      badgeTone: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'completed',
      label: 'Completed / Graded',
      value: kpis.completed,
      icon: FiCheckCircle,
      tone: 'success',
      filterValue: 'COMPLETED',
      badge: 'Graded',
      badgeTone: 'bg-emerald-50 text-emerald-700',
    },
    {
      key: 'published',
      label: 'Upcoming / Active',
      value: kpis.published,
      icon: FiCalendar,
      tone: 'info',
      filterValue: 'PUBLISHED',
      badge: 'Scheduled',
      badgeTone: 'bg-cyan-50 text-cyan-700',
    },
    {
      key: 'drafts',
      label: 'Draft Tests',
      value: kpis.drafts,
      icon: FiAward,
      tone: 'warning',
      filterValue: 'DRAFT',
      badge: kpis.drafts > 0 ? 'Pending' : 'None',
      badgeTone: 'bg-amber-50 text-amber-700',
    },
  ], [kpis]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (batchFilter !== 'ALL' && String(r.batchId) !== String(batchFilter)) return false;
      if (!q) return true;
      const name = (r.name || '').toLowerCase();
      const bname = (r.batch?.name || '').toLowerCase();
      return name.includes(q) || bname.includes(q);
    });
  }, [rows, search, statusFilter, batchFilter]);

  if (loading && !rows.length) return <ContentLoader variant="dashboard" />;

  return (
    <div className="crm-tacademic">
      {/* ── Summary KPI Strip (Standard CRM UI) ── */}
      <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
        <SummaryStatBar
          items={summaryItems}
          activeFilter={statusFilter}
          onSelect={(val) => setStatusFilter(val || 'ALL')}
          layout="grid"
          ariaLabel="Test Statistics"
        />
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="crm-tacademic-toolbar">
        <div className="crm-tacademic-search">
          <FiSearch className="text-slate-400" />
          <input
            type="search"
            placeholder="Search test name, mock exam, or batch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="crm-tacademic-filters">
          <button
            type="button"
            className={`crm-tacademic-pill ${statusFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Tests
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${statusFilter === 'COMPLETED' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            Completed
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${statusFilter === 'PUBLISHED' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('PUBLISHED')}
          >
            Published
          </button>
          <button
            type="button"
            className={`crm-tacademic-pill ${statusFilter === 'DRAFT' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('DRAFT')}
          >
            Drafts
          </button>

          {batchOptions.length > 1 && (
            <div className="w-40">
              <Select
                size="sm"
                searchable={false}
                allowClear={false}
                value={batchFilter}
                onChange={(val) => setBatchFilter(typeof val === 'string' ? val : val?.target?.value || val)}
                options={[{ value: 'ALL', label: 'All Batches' }, ...batchOptions]}
              />
            </div>
          )}

          {canManage && (
            <Button
              size="sm"
              icon={FiPlus}
              onClick={openCreate}
              disabled={batchesLoading || !batchOptions.length}
              className="shadow-xs font-bold shrink-0 ml-auto"
            >
              Schedule New Test
            </Button>
          )}
        </div>
      </div>

      {/* ── Content Grid ── */}
      {!filteredRows.length ? (
        <EmptyState
          title="No tests scheduled"
          description={search ? "No exams match your search criteria." : "Schedule your first sectional or full mock test above."}
          action={canManage && (
            <Button size="sm" icon={FiPlus} onClick={openCreate}>
              Schedule Test
            </Button>
          )}
        />
      ) : (
        <div className="crm-tacademic-grid">
          {filteredRows.map((row) => {
            const hasResults = row.status === 'COMPLETED' || Boolean(row.resultsPublished);
            const isCompleted = row.status === 'COMPLETED';

            return (
              <div key={row.id} className="crm-tacademic-card">
                <div className="crm-tacademic-card__top">
                  <div className="crm-tacademic-card__header">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider bg-brand/10 text-brand border border-brand/20">
                      {row.batch?.name || 'Class Batch'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                          : row.status === 'PUBLISHED'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-emerald-500' : row.status === 'PUBLISHED' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                      {row.status}
                    </span>
                  </div>

                  <h3
                    className="crm-tacademic-card__title cursor-pointer hover:text-brand transition-colors"
                    title={row.name}
                    onClick={() => openResults(row)}
                  >
                    {row.name}
                  </h3>

                  <div className="crm-tacademic-card__meta-bar">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                      <FiCalendar size={13} className="text-brand shrink-0" />
                      Date: <strong>{formatDate(row.testDate)}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <FiAward size={13} className="text-amber-500 shrink-0" />
                      Total: <strong>{row.totalMarks ?? 100} pts</strong>
                      {row.passingMarks ? ` (Pass: ${row.passingMarks})` : ''}
                    </span>
                  </div>

                  <div className="crm-tacademic-card__stat-box">
                    <div className="crm-tacademic-card__stat-item">
                      <strong>{row.totalMarks ?? 100}</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Max Marks</span>
                    </div>
                    <div>
                      {hasResults ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          ✓ Results declared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          ● Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="crm-tacademic-card__foot">
                  <Button
                    size="xs"
                    variant="primary"
                    className="font-bold shadow-xs !py-1.5 !px-3 rounded-xl flex items-center gap-1.5"
                    onClick={() => openResults(row)}
                  >
                    <FiBarChart2 size={13} /> Results & Grading
                  </Button>

                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        title="Edit Test"
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        title="Delete Test"
                        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 text-rose-600 transition-colors cursor-pointer"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Schedule / Edit Modal ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Examination' : 'Schedule New Test'}
        size="md"
        compact
        footer={(
          <div className="flex w-full items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={save} loading={saving}>
              {editing ? 'Update Test' : 'Schedule & Publish'}
            </Button>
          </div>
        )}
      >
        <div className="grid gap-2.5">
          <Input
            label="Examination Name / Title"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. IELTS Sectional Test — Listening & Speaking"
            required
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Select
              label="Assigned Batch"
              value={form.batchId}
              onChange={(v) => setForm({ ...form, batchId: v })}
              options={batchOptions}
              allowClear={false}
            />
            <Select
              label="Publication Status"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              allowClear={false}
              options={[
                { value: 'PUBLISHED', label: 'Published (Upcoming for Students)' },
                { value: 'COMPLETED', label: 'Completed (Grading Active)' },
                { value: 'DRAFT', label: 'Draft' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Test Date"
              type="date"
              value={form.testDate}
              onChange={(e) => setForm({ ...form, testDate: e.target.value })}
            />
            <Select
              label="Test Type"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              allowClear={false}
              options={[
                { value: 'TEST', label: 'Sectional Test' },
                { value: 'MOCK', label: 'Full Mock Exam' },
                { value: 'QUIZ', label: 'Class Quiz' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Total Marks"
              type="number"
              value={form.totalMarks}
              onChange={(e) => setForm({ ...form, totalMarks: e.target.value })}
            />
            <Input
              label="Passing Marks (Optional)"
              type="number"
              value={form.passingMarks}
              onChange={(e) => setForm({ ...form, passingMarks: e.target.value })}
            />
          </div>

          <Textarea
            label="Test Guidelines & Syllabus Instructions"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            rows={2}
            placeholder="Sections covered, exam duration, negative marking, materials permitted..."
          />
        </div>
      </Modal>

      {/* ── Results Grading Modal ── */}
      <Modal
        open={resultsOpen}
        onClose={() => setResultsOpen(false)}
        title={testDetail ? `Grades & Results: ${testDetail.name}` : 'Test Results'}
        size="xl"
        footer={(
          <>
            <Button variant="outline" onClick={() => setResultsOpen(false)}>
              Close
            </Button>
            <Button variant="secondary" onClick={() => saveResults(false)} loading={publishing}>
              Save Draft Marks
            </Button>
            <Button onClick={() => saveResults(true)} loading={publishing}>
              Publish Results to Students
            </Button>
          </>
        )}
      >
        {!testDetail?.results?.length ? (
          <EmptyState
            title="No enrolled students found"
            description="Ensure the batch has students enrolled to record marks."
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-100 p-2.5 rounded-lg">
              <span>Student Roster ({testDetail.results.length})</span>
              <span>Max Marks: {testDetail.totalMarks ?? 100}</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto pr-1">
              {testDetail.results.map((row) => {
                const s = row.student;
                const draft = resultDraft[row.studentId] || { marks: '', remarks: '' };
                const sName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode || 'Student';

                return (
                  <div key={row.studentId} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <strong className="text-slate-900 text-xs block">{sName}</strong>
                      <span className="font-mono text-[11px] text-slate-500">{s.studentCode}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="Marks"
                          className="w-full text-xs p-1.5 border border-slate-300 rounded font-bold text-center"
                          value={draft.marks}
                          onChange={(e) =>
                            setResultDraft((prev) => ({
                              ...prev,
                              [row.studentId]: { ...draft, marks: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="w-48">
                        <input
                          type="text"
                          placeholder="Remarks / Feedback"
                          className="w-full text-xs p-1.5 border border-slate-300 rounded"
                          value={draft.remarks}
                          onChange={(e) =>
                            setResultDraft((prev) => ({
                              ...prev,
                              [row.studentId]: { ...draft, remarks: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      <DeleteConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Examination?"
        itemType="Examination"
        itemName={deleteTarget?.name}
        itemDetails={
          deleteTarget
            ? `${deleteTarget.batch?.name || ''} · ${deleteTarget.totalMarks || 100} Total Marks`
            : ''
        }
        loading={deleting}
        confirmText="Delete Examination"
      />
    </div>
  );
}
