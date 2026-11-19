import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiUsers,
  FiSend,
  FiFileText,
  FiGlobe,
  FiDollarSign,
  FiPlus,
  FiRefreshCw,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiTrendingUp,
  FiSearch,
  FiX,
  FiPhone,
  FiMail,
  FiLayers,
} from 'react-icons/fi';
import { selectUser } from '../../redux/slices/authSlice';
import { apiGet, apiPost } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import GlobalLoader from '../../components/ui/GlobalLoader';
import Avatar from '../../components/ui/Avatar';
import toastService from '../../services/toast/toast.service';

export default function AgentDashboardPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [submittingReferral, setSubmittingReferral] = useState(false);

  // Live datasets
  const [students, setStudents] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [applications, setApplications] = useState([]);
  const [visas, setVisas] = useState([]);

  // Referral form state
  const [newReferral, setNewReferral] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    interestedCountry: 'Canada',
    interestedCourse: 'Postgraduate Diploma',
    preferredIntake: 'Fall 2026',
    remark: '',
  });

  const loadDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [stuRes, enqRes, appRes, visaRes] = await Promise.all([
        apiGet(API.STUDENTS, { limit: 50 }).catch(() => ({ data: [] })),
        apiGet(API.ENQUIRIES, { limit: 50 }).catch(() => ({ data: [] })),
        apiGet(API.APPLICATIONS, { limit: 50 }).catch(() => ({ data: [] })),
        apiGet(API.VISAS, { limit: 50 }).catch(() => ({ data: [] })),
      ]);

      setStudents(stuRes?.data || []);
      setEnquiries(enqRes?.data || []);
      setApplications(appRes?.data || []);
      setVisas(visaRes?.data || []);
    } catch {
      toastService.error('Failed to load live agency stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Computed metrics
  const totalReferrals = enquiries.length;
  const enrolledCount = students.length;
  const activeApps = applications.length;
  const approvedVisas = visas.filter((v) => (v.status || '').toUpperCase().includes('APPROV') || (v.status || '').toUpperCase().includes('GRANT')).length;
  const conversionRate = totalReferrals > 0 ? Math.round((enrolledCount / totalReferrals) * 100) : 0;

  // Pipeline stages distribution
  const pipelineCounts = useMemo(() => {
    let fresh = 0;
    let inProgress = 0;
    let converted = 0;
    enquiries.forEach((e) => {
      const s = (e.status || '').toUpperCase();
      if (s === 'NEW' || s === 'OPEN') fresh += 1;
      else if (s === 'CONVERTED' || s === 'ADMITTED') converted += 1;
      else inProgress += 1;
    });
    return { fresh, inProgress, converted };
  }, [enquiries]);

  // Handle new candidate submission
  const handleCreateReferral = async (e) => {
    e.preventDefault();
    if (!newReferral.firstName.trim() || !newReferral.email.trim() || !newReferral.mobile.trim()) {
      toastService.error('Please enter candidate name, email, and mobile number.');
      return;
    }

    setSubmittingReferral(true);
    try {
      await apiPost(API.ENQUIRIES, {
        firstName: newReferral.firstName.trim(),
        lastName: newReferral.lastName.trim(),
        email: newReferral.email.toLowerCase().trim(),
        mobile: newReferral.mobile.trim(),
        interestedCountry: newReferral.interestedCountry,
        interestedCourse: newReferral.interestedCourse,
        source: 'Partner Referral',
        priority: 'HIGH',
        remark: `Referral submitted by ${user?.firstName || 'Partner'} (${user?.company?.name || 'Partner Agency'}). ${newReferral.remark ? `Notes: ${newReferral.remark}` : ''}`,
      });

      toastService.success('Candidate referral submitted successfully!');
      setReferralModalOpen(false);
      setNewReferral({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        interestedCountry: 'Canada',
        interestedCourse: 'Postgraduate Diploma',
        preferredIntake: 'Fall 2026',
        remark: '',
      });
      loadDashboardData(true);
    } catch (err) {
      toastService.error(err?.message || 'Failed to submit referral. Please verify fields.');
    } finally {
      setSubmittingReferral(false);
    }
  };

  if (loading) return <GlobalLoader />;

  const agencyName = user?.company?.name || 'Authorized Partner Agency';
  const partnerName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Partner';

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-y-auto space-y-4 pr-1 pb-6">
      {/* ── Top Workspace Bar (Counsellor / Admin Style) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              Agency Workspace
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
              {agencyName}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Welcome back, <span className="font-medium text-text-primary">{partnerName}</span> • Real-time referrals, student admissions & commissions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-text-primary text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            title="Refresh dashboard metrics"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.AGENT_COMMISSIONS || '/agent/commissions')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-800 text-text-primary text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <FiDollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Commissions</span>
          </button>

          <button
            type="button"
            onClick={() => setReferralModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>Refer Candidate</span>
          </button>
        </div>
      </div>

      {/* ── 4 High-Density Operational KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total Referrals</span>
            <div className="text-2xl font-bold text-text-primary mt-1">{totalReferrals}</div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
              {pipelineCounts.inProgress} in active processing
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center text-lg shrink-0">
            <FiSend />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Confirmed Enrolled</span>
            <div className="text-2xl font-bold text-text-primary mt-1">{enrolledCount}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              {conversionRate}% conversion rate
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-lg shrink-0">
            <FiUsers />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Active Applications</span>
            <div className="text-2xl font-bold text-text-primary mt-1">{activeApps}</div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
              Institutions & Colleges
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center text-lg shrink-0">
            <FiFileText />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Visas Processed</span>
            <div className="text-2xl font-bold text-text-primary mt-1">{visas.length}</div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              {approvedVisas} granted approvals
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-lg shrink-0">
            <FiGlobe />
          </div>
        </div>
      </div>

      {/* ── Referral Pipeline Stage Visualizer ── */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FiLayers className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Candidate Pipeline Progress</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.AGENT_ENQUIRIES || '/agent/enquiries')}
            className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            Manage Pipeline <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-border">
            <div className="text-[11px] font-semibold text-text-muted">1. Referral Submitted</div>
            <div className="text-lg font-bold text-text-primary mt-0.5">{pipelineCounts.fresh}</div>
            <div className="text-[10px] text-text-muted">Pending initial triage</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-border">
            <div className="text-[11px] font-semibold text-text-muted">2. In Counselling</div>
            <div className="text-lg font-bold text-blue-600 mt-0.5">{pipelineCounts.inProgress}</div>
            <div className="text-[10px] text-text-muted">Course & college selection</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-border">
            <div className="text-[11px] font-semibold text-text-muted">3. Application / Visa</div>
            <div className="text-lg font-bold text-indigo-600 mt-0.5">{activeApps + visas.length}</div>
            <div className="text-[10px] text-text-muted">File lodged & processed</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-border">
            <div className="text-[11px] font-semibold text-text-muted">4. Confirmed Enrolled</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">{enrolledCount}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Eligible for commission</div>
          </div>
        </div>
      </div>

      {/* ── 2 Main Workspaces: Recent Referrals & Recent Enrolled ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Referrals Block */}
        <div className="rounded-xl bg-card border border-border shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Recent Candidate Referrals</h2>
                <p className="text-[11px] text-text-muted">Leads and applicants lodged by your agency</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.AGENT_ENQUIRIES || '/agent/enquiries')}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View All <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {enquiries.length === 0 ? (
              <div className="py-10 text-center text-text-muted text-xs">
                <FiSend className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                No candidate referrals logged yet. Click "+ Refer Candidate" above to submit.
              </div>
            ) : (
              <div className="space-y-2">
                {enquiries.slice(0, 5).map((enq) => {
                  const name = [enq.firstName, enq.lastName].filter(Boolean).join(' ') || 'Candidate';
                  return (
                    <div
                      key={enq.id}
                      onClick={() => navigate(ROUTES.AGENT_ENQUIRIES || '/agent/enquiries')}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-brand/40 bg-card hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-text-primary truncate">{name}</div>
                          <div className="text-[11px] text-text-muted truncate">
                            {enq.interestedCountry || 'Global'} • {enq.interestedCourse || 'Higher Ed'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/50 text-blue-600 border border-blue-200/50 dark:border-blue-800/50">
                        {enq.status || 'Active'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Enrolled Students Block */}
        <div className="rounded-xl bg-card border border-border shadow-xs p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Enrolled Students Roster</h2>
                <p className="text-[11px] text-text-muted">Referred candidates successfully admitted</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.AGENT_STUDENTS || '/agent/students')}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View Roster <FiArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {students.length === 0 ? (
              <div className="py-10 text-center text-text-muted text-xs">
                <FiUsers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                No enrolled students confirmed yet.
              </div>
            ) : (
              <div className="space-y-2">
                {students.slice(0, 5).map((stu) => {
                  const sName = [stu.firstName, stu.lastName].filter(Boolean).join(' ') || 'Student';
                  return (
                    <div
                      key={stu.id}
                      onClick={() => navigate(ROUTES.AGENT_STUDENTS || '/agent/students')}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:border-brand/40 bg-card hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <Avatar name={sName} size="sm" className="!w-8 !h-8 !rounded-lg" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-text-primary truncate">{sName}</div>
                          <div className="text-[11px] text-text-muted truncate">
                            {stu.studentCode || 'STU'} • {stu.course || 'Admitted'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 border border-emerald-200/50 dark:border-emerald-800/50">
                        {stu.status || 'Active'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Candidate Referral Modal (Real Working Submission) ── */}
      {referralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Refer New Candidate</h3>
                <p className="text-[11px] text-text-muted">Submit a prospective applicant under your agency account</p>
              </div>
              <button
                type="button"
                onClick={() => setReferralModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newReferral.firstName}
                    onChange={(e) => setNewReferral({ ...newReferral, firstName: e.target.value })}
                    placeholder="Candidate first name"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newReferral.lastName}
                    onChange={(e) => setNewReferral({ ...newReferral, lastName: e.target.value })}
                    placeholder="Candidate last name"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newReferral.email}
                    onChange={(e) => setNewReferral({ ...newReferral, email: e.target.value })}
                    placeholder="candidate@example.com"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={newReferral.mobile}
                    onChange={(e) => setNewReferral({ ...newReferral, mobile: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Target Country</label>
                  <select
                    value={newReferral.interestedCountry}
                    onChange={(e) => setNewReferral({ ...newReferral, interestedCountry: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="United States">United States</option>
                    <option value="Germany">Germany</option>
                    <option value="New Zealand">New Zealand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Target Course / Level</label>
                  <select
                    value={newReferral.interestedCourse}
                    onChange={(e) => setNewReferral({ ...newReferral, interestedCourse: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="Postgraduate Diploma">Postgraduate Diploma</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Diploma / Pathway">Diploma / Pathway</option>
                    <option value="Tourist Visa">Tourist / Visitor Visa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Special Notes / Educational Background</label>
                <textarea
                  rows={2}
                  value={newReferral.remark}
                  onChange={(e) => setNewReferral({ ...newReferral, remark: e.target.value })}
                  placeholder="e.g. Completed B.Com with 68%, IELTS 6.5 bands. Looking for Sept 2026 intake."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card text-text-primary focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setReferralModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReferral}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-brand hover:bg-brand-hover text-white shadow-xs cursor-pointer transition-colors"
                >
                  {submittingReferral ? 'Submitting...' : 'Submit Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
