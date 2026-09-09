import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiUsers } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import EmptyState from '../../../components/ui/EmptyState';
import ContentLoader from '../../../components/ui/ContentLoader';
import Badge from '../../../components/ui/Badge';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';

export default function TeacherStudentsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet(API.ACADEMIC_TEACHER_STUDENTS, {
        page,
        limit: 25,
        search: search.trim() || undefined,
      });
      setRows(res?.data || []);
      setPagination(res?.pagination || { total: 0, totalPages: 0 });
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <ModulePageCard
      title="My Students"
      subtitle="Students enrolled in your assigned classes"
      icon={FiUsers}
      actions={(
        <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}>
          Dashboard
        </Button>
      )}
    >
      <div className="border-b border-border p-3">
        <Input
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder="Search name or student ID…"
          icon={FiSearch}
          size="sm"
        />
      </div>

      {loading ? (
        <ContentLoader />
      ) : !rows.length ? (
        <EmptyState title="No students found" description="Assigned enrollments will appear here." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-page/60 text-[11px] uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Student</th>
                <th className="px-3 py-2.5 font-semibold">Course / Batch</th>
                <th className="px-3 py-2.5 font-semibold">Attendance</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={`${row.id}-${row.batchId}`} className="hover:bg-row-hover">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-text">{row.firstName} {row.lastName}</p>
                    <p className="text-[11px] text-text-muted">{row.studentCode}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-text">{row.courseName}</p>
                    <p className="text-[11px] text-text-muted">{row.batchName}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`font-semibold tabular-nums ${row.attendance?.low ? 'text-danger' : 'text-text'}`}>
                      {row.attendance?.percent ?? 0}%
                    </span>
                    <p className="text-[11px] text-text-muted">
                      {row.attendance?.present || 0}P / {row.attendance?.absent || 0}A
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge color={row.status === 'ACTIVE' ? 'success' : 'secondary'}>{row.status}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.TEACHER_STUDENT(row.id))}>
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-text-muted">
          <span>{pagination.total} students</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </ModulePageCard>
  );
}
