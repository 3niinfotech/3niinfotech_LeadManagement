import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiSearch,
  FiMail,
  FiPhone,
  FiBookOpen,
  FiGrid,
  FiList,
  FiDownload,
  FiPlus,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import Button from '../../components/ui/Button';
import GlobalLoader from '../../components/ui/GlobalLoader';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ModulePageCard from '../../components/layout/ModulePageLayout';
import toastService from '../../services/toast/toast.service';

export default function AgentStudentsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // Default to table like Admin/Counsellor

  useEffect(() => {
    let cancelled = false;
    apiGet(API.STUDENTS, { limit: 100 })
      .then((res) => {
        if (!cancelled) setRows(res?.data || []);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const statuses = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      if (r.status) set.add(r.status);
    });
    return ['ALL', ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const name = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase();
      const code = (r.studentCode || '').toLowerCase();
      const course = (r.course || '').toLowerCase();
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || name.includes(q) || code.includes(q) || course.includes(q);
      const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, selectedStatus]);

  const handleExportCSV = () => {
    if (!filtered.length) {
      toastService.warning('No student records to export');
      return;
    }
    const headers = ['Student ID', 'Student Name', 'Course', 'Email', 'Phone', 'Status'];
    const dataRows = filtered.map((st) => [
      `"${st.studentCode || 'STU'}"`,
      `"${[st.firstName, st.lastName].filter(Boolean).join(' ').replace(/"/g, '""')}"`,
      `"${(st.course || 'Study Abroad Program').replace(/"/g, '""')}"`,
      `"${st.email || ''}"`,
      `"${st.phone || ''}"`,
      `"${st.status || 'Active'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...dataRows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Referred_Students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastService.success('Student roster downloaded');
  };

  if (loading) return <GlobalLoader />;

  return (
    <ModulePageCard
      title="My Referred Students"
      subtitle="Active admissions and enrolled candidates referred by your partner agency"
      icon={FiUsers}
      iconColor="primary"
      scroll="contain"
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.AGENT_DASHBOARD },
        { label: 'My Students' },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1.5 shadow-xs font-semibold text-xs"
            onClick={handleExportCSV}
          >
            <FiDownload /> Export CSV
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="flex items-center gap-1.5 shadow-xs font-semibold text-xs"
            onClick={() => navigate(ROUTES.AGENT_ENQUIRIES || '/agent/enquiries')}
          >
            <FiPlus /> Refer Candidate
          </Button>
        </div>
      }
    >
      {/* ── Search & Filter Controls Toolbar ── */}
      <ModulePageCard.Toolbar>
        <div className="p-3 border-b border-border bg-card flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, code, course..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-brand text-text-primary"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              {statuses.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    selectedStatus === st
                      ? 'bg-brand/10 text-brand font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {st === 'ALL' ? `All (${rows.length})` : st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 bg-background p-0.5 rounded-lg border border-border">
              <button
                type="button"
                className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-card text-brand shadow-xs font-bold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <FiList />
              </button>
              <button
                type="button"
                className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-card text-brand shadow-xs font-bold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <FiGrid />
              </button>
            </div>
          </div>
        </div>
      </ModulePageCard.Toolbar>

      {/* ── Table or Grid Content ── */}
      <ModulePageCard.Table>
        {filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <EmptyState
              title="No enrolled students yet"
              description={search ? 'Try adjusting your search criteria.' : 'Candidates referred by your agency will appear here once officially admitted and enrolled.'}
              actionLabel="+ Refer Candidate"
              onAction={() => navigate(ROUTES.AGENT_ENQUIRIES || '/agent/enquiries')}
            />
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto flex-1 min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-card border-b border-border text-text-muted uppercase text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Course / Program</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((st) => {
                  const sName = [st.firstName, st.lastName].filter(Boolean).join(' ') || 'Student';
                  return (
                    <tr key={st.id} className="hover:bg-card/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={sName} size="xs" />
                          <div>
                            <span className="font-semibold text-text-primary block">{sName}</span>
                            <span className="font-mono text-[10px] text-text-muted">{st.studentCode || 'STU'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-text-primary">{st.course || 'Study Abroad Program'}</span>
                        {st.country && (
                          <span className="block text-[10px] text-text-muted">{st.country}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 space-y-0.5">
                        {st.email && (
                          <div className="flex items-center gap-1 text-text-muted text-[11px]">
                            <FiMail className="w-3 h-3 text-text-muted" />
                            <span>{st.email}</span>
                          </div>
                        )}
                        {st.phone && (
                          <div className="flex items-center gap-1 text-text-muted text-[11px]">
                            <FiPhone className="w-3 h-3 text-text-muted" />
                            <span>{st.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50">
                          ● {st.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-text-muted">
                        {st.createdAt ? new Date(st.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
            {filtered.map((student) => {
              const sName = [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student';
              return (
                <div
                  key={student.id}
                  className="rounded-xl border border-border bg-card p-3.5 shadow-xs hover:border-brand/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={sName} size="sm" />
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-text-primary truncate">{sName}</h3>
                          <span className="font-mono text-[10px] text-text-muted block">{student.studentCode || 'STU'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 shrink-0">
                        ● {student.status || 'Active'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border space-y-1 text-xs text-text-muted">
                      <div className="flex items-center gap-2">
                        <FiBookOpen className="w-3 h-3 text-text-muted shrink-0" />
                        <span className="truncate text-text-primary text-[11px]">{student.course || 'Study Abroad Program'}</span>
                      </div>
                      {student.email && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <FiMail className="w-3 h-3 text-text-muted shrink-0" />
                          <span className="truncate">{student.email}</span>
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <FiPhone className="w-3 h-3 text-text-muted shrink-0" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ModulePageCard.Table>
    </ModulePageCard>
  );
}
