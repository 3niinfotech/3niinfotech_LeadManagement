import { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiFileText, FiPlus, FiTrash2 } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Textarea from '../../../components/ui/Textarea';
import Select from '../../../components/ui/Select';
import { apiDelete, apiGet, apiPost, apiPut } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import toastService from '../../../services/toast/toast.service';
import { useTeacherBatches } from '../hooks/useTeacherBatches';
import { formatDate, Panel, statusColor } from '../components/teacherWorkspaceUi';

const EMPTY_FORM = {
  name: '',
  type: 'TEST',
  batchId: '',
  testDate: '',
  totalMarks: 100,
  passingMarks: '',
  instructions: '',
  status: 'DRAFT',
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
  const [resultsOpen, setResultsOpen] = useState(false);
  const [testDetail, setTestDetail] = useState(null);
  const [resultDraft, setResultDraft] = useState({});
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_TESTS, { limit: 50 });
      setRows(res?.data || []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to load tests');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, batchId: batchOptions[0]?.value || '' });
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
      passingMarks: row.passingMarks ?? '',
      instructions: row.instructions || '',
      status: row.status || 'DRAFT',
    });
    setFormOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.batchId) {
      toastService.error('Name and batch are required');
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
        toastService.success('Test updated');
      } else {
        await apiPost(API.ACADEMIC_TESTS, body);
        toastService.success('Test created');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    try {
      await apiDelete(API.ACADEMIC_TEST(row.id));
      toastService.success('Test removed');
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Delete failed');
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
      toastService.success(publish ? 'Results published' : 'Results saved');
      setResultsOpen(false);
      load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setPublishing(false);
    }
  };

  if (loading && !rows.length) return <ContentLoader variant="dashboard" />;

  return (
    <PageShell className="!space-y-3">
      <PageHeader
        title="Tests"
        subtitle="Schedule tests and enter student results"
        icon={FiFileText}
        iconColor="primary"
        actions={canManage && (
          <Button size="sm" icon={FiPlus} onClick={openCreate} disabled={batchesLoading || !batchOptions.length}>
            New test
          </Button>
        )}
      />

      <Panel title={`All tests (${rows.length})`}>
        {!rows.length ? (
          <EmptyState title="No tests yet" description="Create a test for one of your batches." />
        ) : (
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-text">{row.name}</p>
                  <p className="truncate text-[11px] text-text-muted">
                    {row.batch?.name || '—'} · {formatDate(row.testDate)} · {row.totalMarks} marks
                  </p>
                </div>
                <Badge color={statusColor(row.status)}>{row.status}</Badge>
                {row.resultsPublished && <Badge color="success">Results out</Badge>}
                <div className="flex gap-1.5">
                  {canManage && <Button size="sm" variant="outline" onClick={() => openResults(row)}>Results</Button>}
                  {canManage && (
                    <>
                      <Button size="sm" variant="ghost" icon={FiEdit2} onClick={() => openEdit(row)} />
                      <Button size="sm" variant="ghost" icon={FiTrash2} onClick={() => remove(row)} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit test' : 'New test'}
        variant="form"
        size="lg"
        footer={(
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save' : 'Create'}</Button>
          </>
        )}
      >
        <div className="grid gap-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Select label="Batch" value={form.batchId} onChange={(v) => setForm({ ...form, batchId: v })} options={batchOptions} />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
              options={[
                { value: 'TEST', label: 'Test' },
                { value: 'QUIZ', label: 'Quiz' },
                { value: 'EXAM', label: 'Exam' },
              ]}
            />
            <Input label="Test date" type="date" value={form.testDate} onChange={(e) => setForm({ ...form, testDate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Total marks" type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
            <Input label="Passing marks" type="number" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v })}
            options={[{ value: 'DRAFT', label: 'Draft' }, { value: 'PUBLISHED', label: 'Published' }]}
          />
          <Textarea label="Instructions" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={3} />
        </div>
      </Modal>

      <Modal
        open={resultsOpen}
        onClose={() => setResultsOpen(false)}
        title={`Results — ${testDetail?.name || ''}`}
        subtitle={`Total marks: ${testDetail?.totalMarks ?? '—'}`}
        size="lg"
        footer={canManage && (
          <>
            <Button variant="outline" onClick={() => setResultsOpen(false)}>Close</Button>
            <Button variant="outline" onClick={() => saveResults(false)} loading={publishing}>Save draft</Button>
            <Button onClick={() => saveResults(true)} loading={publishing}>Save & publish</Button>
          </>
        )}
      >
        {!testDetail?.results?.length ? (
          <EmptyState title="No enrolled students" description="Enroll students in the batch to enter marks." />
        ) : (
          <div className="space-y-2">
            {testDetail.results.map((r) => {
              const draft = resultDraft[r.studentId] || { marks: r.marks ?? '', remarks: r.remarks ?? '' };
              return (
                <div key={r.studentId} className="grid grid-cols-1 items-end gap-2 rounded-lg border border-border p-2.5 sm:grid-cols-[1fr_100px_1fr]">
                  <div>
                    <p className="text-sm font-semibold text-text">{r.student?.firstName} {r.student?.lastName}</p>
                    <p className="text-[11px] text-text-muted">{r.student?.studentCode}</p>
                  </div>
                  <Input
                    size="sm"
                    label="Marks"
                    type="number"
                    value={draft.marks}
                    onChange={(e) => setResultDraft({ ...resultDraft, [r.studentId]: { ...draft, marks: e.target.value } })}
                    disabled={!canManage}
                  />
                  <Input
                    size="sm"
                    label="Remarks"
                    value={draft.remarks}
                    onChange={(e) => setResultDraft({ ...resultDraft, [r.studentId]: { ...draft, remarks: e.target.value } })}
                    disabled={!canManage}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
