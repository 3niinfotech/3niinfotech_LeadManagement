import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiUsers,
  FiSend,
  FiFileText,
  FiAward,
  FiArrowRight,
  FiPlus,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiBriefcase,
} from 'react-icons/fi';
import { selectUser } from '../../redux/slices/authSlice';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import GlobalLoader from '../../components/ui/GlobalLoader';
import Avatar from '../../components/ui/Avatar';

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [stats, setStats] = useState({ total: 0, students: [], referrals: [], applicationsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet(API.STUDENTS, { limit: 100 }).catch(() => ({ data: [] })),
      apiGet(API.ENQUIRIES, { limit: 20 }).catch(() => ({ data: [] })),
      apiGet(API.APPLICATIONS, { limit: 20 }).catch(() => ({ data: [] })),
    ])
      .then(([studentRes, enquiryRes, appRes]) => {
        if (cancelled) return;
        const students = studentRes?.data || [];
        const referrals = enquiryRes?.data || [];
        const applications = appRes?.data || [];
        setStats({
          total: students.length,
          students: students.slice(0, 6),
          referrals: referrals.slice(0, 6),
          applicationsCount: applications.length,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <GlobalLoader />;

  const agencyName = user?.company?.name || 'Partner Agency';
  const partnerName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Partner';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Top Hero Greeting Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-700 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-white">
              <FiBriefcase className="w-3.5 h-3.5" />
              <span>Partner Agent Portal</span>
              <span className="opacity-60">•</span>
              <span>{agencyName}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Welcome back, {partnerName}!
            </h1>
            <p className="text-sm text-blue-100 max-w-xl">
              Track candidate referrals, admissions progress, and commissions in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(ROUTES.AGENT_ENQUIRIES || '/agent/enquiries')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 text-sm font-semibold shadow hover:bg-blue-50 transition-colors"
            >
              <FiPlus className="w-4 h-4" /> Refer Candidate
            </button>
            <button
              type="button"
              onClick={() => navigate(ROUTES.AGENT_STUDENTS || '/agent/students')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold backdrop-blur-sm transition-colors border border-white/20"
            >
              <FiUsers className="w-4 h-4" /> My Students
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Executive KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Enrolled</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 inline-block">
              ✓ Active admissions
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
            <FiUsers />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Referrals</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.referrals.length}</div>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 inline-block">
              In counseling pipeline
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
            <FiSend />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Applications</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.applicationsCount}</div>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 inline-block">
              College & University
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
            <FiFileText />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Success Rate</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">98.4%</div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 inline-block">
              Visa & admissions grant
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
            <FiAward />
          </div>
        </div>
      </div>

      {/* ── 2 Columns: Recent Enrolled Students + Recent Referrals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Enrolled Students Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Enrolled Students</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Referred candidates confirmed and enrolled</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.AGENT_STUDENTS || '/agent/students')}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              View All <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.students.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No enrolled students yet. Submit a referral to begin!
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.students.map((student) => {
                const sName = [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student';
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={sName} size="sm" className="!w-9 !h-9 !rounded-xl" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{sName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {student.studentCode || 'STU'} • {student.course || 'Study Abroad'}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
                      {student.status || 'Active'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Referrals Pipeline */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Referrals Pipeline</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Leads and candidates submitted by your agency</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.AGENT_ENQUIRIES || '/agent/enquiries')}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              View Pipeline <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.referrals.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No recent referrals in the pipeline.
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.referrals.map((ref) => {
                const rName = [ref.firstName, ref.lastName].filter(Boolean).join(' ') || 'Candidate';
                return (
                  <div
                    key={ref.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {rName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{rName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {ref.enquiryCode || 'ENQ'} • {ref.source || 'Partner Referral'}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50">
                      {ref.status || 'In Review'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
