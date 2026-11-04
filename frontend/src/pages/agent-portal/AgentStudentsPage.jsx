import { useEffect, useMemo, useState } from 'react';
import {
  FiUsers,
  FiSearch,
  FiFilter,
  FiMail,
  FiPhone,
  FiMapPin,
  FiAward,
  FiBookOpen,
  FiChevronRight,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import GlobalLoader from '../../components/ui/GlobalLoader';
import Avatar from '../../components/ui/Avatar';

export default function AgentStudentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

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
    return () => { cancelled = true; };
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

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Top Header Strip ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiUsers className="text-primary w-6 h-6" />
            My Referred Students
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Students referred by your agency and enrolled in courses & study abroad programs.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 text-blue-700 dark:text-blue-300 text-xs font-bold self-start sm:self-auto">
          <span>Total: {rows.length} Students</span>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name, student code, course..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedStatus === st
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* ── Students Cards Grid ── */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <FiUsers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No students found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {search ? 'Try adjusting your search criteria.' : 'Your agency has not referred any enrolled students yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student) => {
            const sName = [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student';
            return (
              <div
                key={student.id}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md hover:border-primary/40 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={sName} size="md" className="!w-11 !h-11 !rounded-2xl" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{sName}</h3>
                        <span className="text-[11px] font-semibold text-primary block mt-0.5">
                          {student.studentCode || 'STU'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 shrink-0">
                      {student.status || 'Active'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <FiBookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{student.course || 'Study Abroad Program'}</span>
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-2">
                        <FiMail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-2">
                        <FiPhone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{student.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Referred Candidate
                  </span>
                  <span className="font-semibold text-primary inline-flex items-center gap-0.5">
                    Enrolled <FiChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
