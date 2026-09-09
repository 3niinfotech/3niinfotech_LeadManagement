import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { apiGet, apiPost } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import toastService from '../../../services/toast/toast.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';

export default function TeacherStudentProfilePage() {
  const { id } = useParams();
  const { can } = usePermissions();
  const canRemark = can(PERMISSIONS.ATTENDANCE_MARK) || can(PERMISSIONS.ATTENDANCE_EDIT);
  const [data, setData] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [remarkText, setRemarkText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, remarksRes] = await Promise.all([
        apiGet(API.ACADEMIC_STUDENT(id)),
        apiGet(API.ACADEMIC_REMARKS(id)).catch(() => ({ data: [] })),
      ]);
      setData(summaryRes?.data || summaryRes);
      const list = remarksRes?.data ?? remarksRes ?? [];
      setRemarks(Array.isArray(list) ? list : []);
    } catch {
      setData(null);
      setRemarks([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addRemark = async () => {
    if (!remarkText.trim()) return;
    setSaving(true);
    try {
      await apiPost(API.ACADEMIC_REMARKS(id), { remark: remarkText.trim() });
      setRemarkText('');
      toastService.success('Remark added');
      const remarksRes = await apiGet(API.ACADEMIC_REMARKS(id));
      const list = remarksRes?.data ?? remarksRes ?? [];
      setRemarks(Array.isArray(list) ? list : []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to save remark');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ContentLoader />;
  if (!data?.student) {
    return (
      <ModulePageCard title="Student">
        <EmptyState title="Student not found" description="This student is outside your assigned classes." />
      </ModulePageCard>
    );
  }

  const totals = data.totals || {};

  return (
    <ModulePageCard
      title={`${data.student.firstName} ${data.student.lastName}`}
      subtitle={data.student.studentCode}
      actions={(
        <Link to={ROUTES.TEACHER_STUDENTS} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
          <FiArrowLeft /> Back
        </Link>
      )}
    >
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {[
            ['Attendance', `${totals.percent ?? 0}%`],
            ['Present', totals.present],
            ['Absent', totals.absent],
            ['Late', totals.late],
            ['Leave', (totals.leave || 0) + (totals.excused || 0)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border bg-page/50 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase text-text-muted">{label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-text">{value ?? 0}</p>
            </div>
          ))}
        </div>

        {data.lowAttendance && (
          <div className="rounded-xl border border-warning/25 bg-warning-soft px-3.5 py-2 text-xs text-text-secondary">
            Attendance is below the branch threshold ({data.threshold}%).
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">Teacher remarks</h3>
          {canRemark && (
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <textarea
                className="min-h-[72px] flex-1 rounded-xl border border-border bg-card-bg px-3 py-2 text-sm text-text"
                placeholder="Academic remark (visible to the student)"
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
              />
              <Button size="sm" loading={saving} onClick={addRemark}>Add remark</Button>
            </div>
          )}
          {!remarks.length ? (
            <EmptyState title="No remarks yet" />
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {remarks.map((row) => (
                <div key={row.id} className="px-3.5 py-2.5 text-sm">
                  <p className="text-text">{row.remark}</p>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {[row.teacher?.firstName, row.teacher?.lastName].filter(Boolean).join(' ') || 'Teacher'}
                    {' · '}
                    {row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN') : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-text">Academic attendance history</h3>
          {!data.history?.length ? (
            <EmptyState title="No records yet" />
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {data.history.slice(0, 40).map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text">{row.course || row.batch}</p>
                    <p className="text-[11px] text-text-muted">
                      {row.startAt ? new Date(row.startAt).toLocaleString('en-IN') : '—'}
                    </p>
                  </div>
                  <Badge color={row.status === 'PRESENT' ? 'success' : row.status === 'ABSENT' ? 'danger' : 'warning'}>
                    {row.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModulePageCard>
  );
}
