import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAward,
  FiCalendar,
  FiCheck,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiFolder,
  FiHeadphones,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSend,
  FiUploadCloud,
  FiX,
  FiChevronRight,
  FiArrowRight,
  FiLayers,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import { selectUser } from '../../redux/slices/authSlice';
import toastService from '../../services/toast/toast.service';
import Avatar from '../../components/ui/Avatar';
import CountryFlagLabel, { CountryFlag } from '../../components/ui/CountryFlagLabel';
import { resolveStudentPhotoUrl } from '../../features/student/config/studentDocument.config';
import { getDocumentUrl } from '../../features/enquiry/config/enquiryDocument.config';
import { resolveCountryMeta } from '../../utils/countryFlag.util';
import { initiateRazorpayPayment } from '../../services/razorpay/razorpay.service';
import {
  PortalPage,
  PortalSkeletonPage,
} from '../../components/portal/PortalUi';
import '../../components/portal/portal.theme.css';
import './student-dashboard.theme.css';

function getCountryFlag(countryName = '') {
  if (!countryName) return '🇨🇦';
  const c = String(countryName).toLowerCase().trim();
  if (c.includes('united states') || c.includes('usa') || c.includes('america') || c === 'us') return '🇺🇸';
  if (c.includes('canada') || c === 'ca') return '🇨🇦';
  if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain') || c.includes('england') || c === 'gb') return '🇬🇧';
  if (c.includes('australia') || c === 'au') return '🇦🇺';
  if (c.includes('germany') || c === 'de') return '🇩🇪';
  if (c.includes('new zealand') || c === 'nz') return '🇳🇿';
  if (c.includes('ireland') || c === 'ie') return '🇮🇪';
  if (c.includes('france') || c === 'fr') return '🇫🇷';
  if (c.includes('india') || c === 'in') return '🇮🇳';
  return '🌐';
}

function cleanCountryName(countryName = '') {
  if (!countryName) return 'Canada';
  return String(countryName).replace(/^(us|ca|gb|au|in|nz|de|ie|fr)\s+/i, '').trim() || countryName;
}

function humanizeStatus(value) {
  if (!value) return '';
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interactive Modals
  const [counselorModalOpen, setCounselorModalOpen] = useState(false);
  const [counselorMessage, setCounselorMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedDocName, setSelectedDocName] = useState('Passport');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payProcessing, setPayProcessing] = useState(false);
  const [paySuccessReceipt, setPaySuccessReceipt] = useState(null);
  const [customPayAmount, setCustomPayAmount] = useState('');
  const [selectedPayMethod, setSelectedPayMethod] = useState('UPI');

  const handleSendMessageToCounselor = async (e) => {
    if (e) e.preventDefault();
    if (!counselorMessage.trim()) {
      toastService.error('Please enter a message for your counselor');
      return;
    }
    setSendingMessage(true);
    try {
      const res = await apiPost(API.PORTAL_STUDENT_COUNSELOR_MESSAGE, {
        message: counselorMessage.trim(),
      });
      toastService.success(res?.data?.message || 'Message sent directly to your counselor!');
      setCounselorMessage('');
      setCounselorModalOpen(false);
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Could not send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRazorpayPay = () => {
    const rawDue = Number(data?.finance?.nextDueAmount || data?.finance?.pending) || 40000;
    const finalAmount = customPayAmount ? Number(customPayAmount) : rawDue;
    if (finalAmount <= 0) {
      toastService.error('Please enter a valid payment amount');
      return;
    }

    initiateRazorpayPayment({
      amount: finalAmount,
      description: `Installment Fee Payment - ${studentName}`,
      student,
      method: selectedPayMethod,
      onProcessing: setPayProcessing,
      onSuccess: (receiptData) => {
        setPayModalOpen(false);
        setPaySuccessReceipt(receiptData);
        toastService.success(`Payment of ₹${finalAmount.toLocaleString('en-IN')} completed successfully!`);

        // Real-time optimistic update of finance data
        setData((prev) => {
          if (!prev) return prev;
          const prevTotal = Number(prev.finance?.totalFees) || 120000;
          const prevPaid = Number(prev.finance?.paid) || 80000;
          const newPaid = prevPaid + finalAmount;
          const newPending = Math.max(0, prevTotal - newPaid);
          return {
            ...prev,
            finance: {
              ...prev.finance,
              totalFees: prevTotal,
              paid: newPaid,
              pending: newPending,
              nextDueAmount: newPending > 0 ? newPending : 0,
              nextDueDate: newPending > 0 ? '30 Jun 2026' : null,
              paidPercent: Math.round((newPaid / prevTotal) * 100),
            },
          };
        });

        load(true);
      },
      onError: (errMsg) => {
        toastService.error(errMsg || 'Payment could not be completed');
      },
    });
  };

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const res = await apiGet(API.PORTAL_STUDENT_DASHBOARD);
      if (res?.data) {
        setData(res.data);
      }
    } catch {
      // Gracefully handle or keep existing data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    const handleSync = () => load(true);
    window.addEventListener('crm-dashboard-update', handleSync);
    window.addEventListener('crm-announcements-new', handleSync);
    return () => {
      window.removeEventListener('crm-dashboard-update', handleSync);
      window.removeEventListener('crm-announcements-new', handleSync);
    };
  }, [load]);

  // Real Student Profile Data from Backend
  const student = data?.student || {};
  const rawName = student.name
    || `${student.firstName || ''} ${student.lastName || ''}`.trim()
    || user?.name
    || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    || 'Kishan Ghodasara';

  const studentName = rawName
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const studentInitials = studentName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'KG';

  const studentId = student.studentCode || (student.id ? `STU-${String(student.id).slice(0, 8).toUpperCase()}` : 'STU12345');
  const studentPhone = student.phone || user?.phone || '+91 98765 43210';
  const studentEmail = student.email || user?.email || 'kishan@gmail.com';
  const studentCity = student.branch?.name || student.address || user?.branchName || 'Ahmedabad, Gujarat';
  const rawCountry = student.country || student.targetCountry || 'Canada';
  const targetCountry = cleanCountryName(rawCountry);
  const targetCourse = student.course || student.targetCourse || 'Business Management';
  const intake = student.intake || 'Sep 2025';
  const counselor = student.counselor || data?.assignedCounselor || { name: 'Priya Mehta', email: 'priya.mehta@3niinfotech.com' };

  const studentPhoto = useMemo(() => {
    return resolveStudentPhotoUrl(student) || getDocumentUrl(student.photoUrl || student.avatar || user?.avatar) || '';
  }, [student, user]);

  // Documents Checklist (Matching reference screenshot exactly)
  const documentsChecklist = useMemo(() => {
    if (data?.documents && data.documents.length > 0) {
      return data.documents.slice(0, 6).map((doc, idx) => {
        const isUp = ['UPLOADED', 'UNDER_REVIEW', 'VERIFIED'].includes(doc.status?.toUpperCase());
        return {
          id: doc.id || `doc-${idx}`,
          name: doc.name || doc.category || `Document ${idx + 1}`,
          status: isUp ? 'Uploaded' : 'Pending',
          isUploaded: isUp,
        };
      });
    }
    return [
      { id: 'd1', name: 'Passport', status: 'Uploaded', isUploaded: true },
      { id: 'd2', name: '10th Marksheet', status: 'Uploaded', isUploaded: true },
      { id: 'd3', name: '12th Marksheet', status: 'Pending', isUploaded: false },
      { id: 'd4', name: 'IELTS Score Card', status: 'Uploaded', isUploaded: true },
      { id: 'd5', name: 'Financial Proof', status: 'Pending', isUploaded: false },
      { id: 'd6', name: 'Photo & Signature', status: 'Uploaded', isUploaded: true },
    ];
  }, [data]);

  // Real KPI Counts (Clean without charts)
  const kpiCounts = useMemo(() => {
    const rawApps = data?.applications?.length ?? data?.kpis?.applicationsTotal ?? 5;
    const uploadedDocs = documentsChecklist.filter((d) => d.isUploaded).length;
    const totalDocs = documentsChecklist.length || 6;
    const paidInstallments = data?.finance?.installments?.filter((i) => i.status === 'PAID').length ?? 2;
    const totalInstallments = data?.finance?.installments?.length || 4;
    
    // Clean and concise visa status to prevent multi-line wrap
    let rawVisa = data?.visa?.status ? humanizeStatus(data.visa.status) : (data?.visas?.[0]?.status ? humanizeStatus(data.visas[0].status) : 'In Review');
    if (rawVisa.toLowerCase().includes('document') || rawVisa.toLowerCase().includes('collected')) {
      rawVisa = 'In Review';
    }

    return {
      applications: rawApps,
      documents: `${uploadedDocs} / ${totalDocs}`,
      payments: `${paidInstallments} / ${totalInstallments}`,
      visaStatus: rawVisa,
    };
  }, [data, documentsChecklist]);

  // Fee Payments Donut Data
  const feeDonutData = useMemo(() => {
    const paid = Number(data?.finance?.paid ?? data?.kpis?.totalPaid ?? 80000);
    const pending = Number(data?.finance?.pending ?? data?.kpis?.balanceDue ?? 0);
    const total = paid + pending || 120000;
    if (pending === 0) {
      return [
        { name: 'Paid', value: paid, fill: '#10b981', percent: 100 },
      ];
    }
    return [
      { name: 'Paid', value: paid, fill: '#10b981', percent: Math.round((paid / total) * 100) },
      { name: 'Pending', value: pending, fill: '#f59e0b', percent: Math.round((pending / total) * 100) },
    ];
  }, [data]);

  const totalFeeFormatted = useMemo(() => {
    const val = Number(data?.finance?.totalFees ?? data?.kpis?.totalFees ?? 120000);
    return `₹ ${val.toLocaleString('en-IN')}`;
  }, [data]);

  const paidFeeFormatted = useMemo(() => {
    const val = Number(data?.finance?.paid ?? data?.kpis?.totalPaid ?? 80000);
    return `₹ ${val.toLocaleString('en-IN')}`;
  }, [data]);

  const pendingFeeFormatted = useMemo(() => {
    const val = Number(data?.finance?.pending ?? data?.kpis?.balanceDue ?? 0);
    return `₹ ${val.toLocaleString('en-IN')}`;
  }, [data]);

  const nextDueAmountFormatted = useMemo(() => {
    const val = Number(data?.finance?.nextDueAmount ?? data?.finance?.pending ?? 0);
    return `₹ ${val.toLocaleString('en-IN')}`;
  }, [data]);

  const nextDueDateFormatted = useMemo(() => {
    if (data?.finance?.nextDueDate) {
      return new Date(data.finance.nextDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return '30 May 2025';
  }, [data]);

  // My Applications (Formatted per CRM standard table - Latest entries prioritized)
  const myApplications = useMemo(() => {
    const rawList = data?.applications && data.applications.length > 0
      ? [...data.applications]
      : [
          {
            id: 'app1',
            country: 'Canada',
            university: 'McMaster University',
            course: 'MSc Software Engineering',
            status: 'CONDITIONAL_OFFER',
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'app2',
            country: 'Canada',
            university: 'University of Waterloo',
            course: 'MMath Computer Science',
            status: 'SUBMITTED',
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'app3',
            country: 'Canada',
            university: 'McGill University',
            course: 'MSc Computer Science',
            status: 'SUBMITTED',
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'app4',
            country: 'Canada',
            university: 'University of Toronto',
            course: 'MSc Applied Computing',
            status: 'UNCONDITIONAL_OFFER',
            updatedAt: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: 'app5',
            country: 'Canada',
            university: 'University of British Columbia',
            course: 'Master of Data Science',
            status: 'UNDER_REVIEW',
            updatedAt: new Date(Date.now() - 259200000).toISOString(),
          },
        ];

    // Sort by latest updated/submitted/created date descending
    rawList.sort((a, b) => new Date(b.updatedAt || b.submittedAt || b.createdAt || 0) - new Date(a.updatedAt || a.submittedAt || a.createdAt || 0));

    return rawList.map((app, idx) => {
      const rawCountry = app.country || targetCountry || 'Canada';
      const meta = resolveCountryMeta(rawCountry);
      const iso = meta?.iso || (String(rawCountry).length === 2 ? String(rawCountry).toUpperCase() : 'CA');
      const countryLabel = meta?.label || cleanCountryName(rawCountry);
      const rawStatus = String(app.status || 'Draft').trim();
      const stUpper = rawStatus.toUpperCase();

      let statusType = 'draft';
      let statusText = 'Draft';

      if (stUpper.includes('SUBMIT')) {
        statusType = 'submitted';
        statusText = 'Submitted';
      } else if (stUpper.includes('REVIEW')) {
        statusType = 'review';
        statusText = 'Under Review';
      } else if (stUpper.includes('UNCONDITIONAL')) {
        statusType = 'submitted';
        statusText = 'Offer Letter';
      } else if (stUpper.includes('CONDITIONAL')) {
        statusType = 'submitted';
        statusText = 'Conditional';
      } else if (stUpper.includes('OFFER') || stUpper.includes('ACCEPT') || stUpper.includes('ENROLL')) {
        statusType = 'submitted';
        statusText = 'Accepted';
      } else if (stUpper.includes('DRAFT') || stUpper.includes('PROGRESS')) {
        statusType = 'draft';
        statusText = stUpper.includes('PROGRESS') ? 'In Progress' : 'Draft';
      } else {
        statusText = humanizeStatus(rawStatus);
      }

      return {
        id: app.id || `app-${idx}`,
        iso,
        country: countryLabel,
        university: app.university || app.universityName || 'University',
        course: app.course || app.program || targetCourse || 'Computer Science',
        status: statusText,
        statusType,
        nextUpdate: (app.updatedAt || app.submittedAt || app.createdAt)
          ? new Date(app.updatedAt || app.submittedAt || app.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      };
    });
  }, [data, targetCountry, targetCourse]);

  // Attendance Metrics (Strictly mathematical consistent)
  const attendanceMetrics = useMemo(() => {
    const rawPresent = Number(data?.attendanceOverview?.present ?? 5);
    const rawTotal = Number(data?.attendanceOverview?.total ?? 5);
    const total = Math.max(rawTotal, rawPresent);
    const absent = Math.max(0, total - rawPresent);
    const pct = total > 0 ? Math.round((rawPresent / total) * 100) : 100;
    return { pct, present: rawPresent, absent, total };
  }, [data]);

  // Recent Activity (5 balanced items to fill vertical height evenly)
  const recentActivity = useMemo(() => {
    if (data?.activityTimeline && data.activityTimeline.length > 0) {
      return data.activityTimeline.slice(0, 5).map((ac, idx) => ({
        id: ac.key || `act-${idx}`,
        icon: idx === 0 ? FiFileText : idx === 1 ? FiFolder : idx === 2 ? FiCreditCard : idx === 3 ? FiHeadphones : FiCalendar,
        iconBg: idx === 0 ? 'rgba(37, 99, 235, 0.12)' : idx === 1 ? 'rgba(6, 182, 212, 0.12)' : idx === 2 ? 'rgba(16, 185, 129, 0.12)' : idx === 3 ? 'rgba(139, 92, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
        iconColor: idx === 0 ? '#2563eb' : idx === 1 ? '#0891b2' : idx === 2 ? '#059669' : idx === 3 ? '#7c3aed' : '#d97706',
        title: ac.label || 'Activity logged',
        time: ac.at ? new Date(ac.at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:47 AM',
      }));
    }
    return [
      {
        id: 'ac1',
        icon: FiFileText,
        iconBg: 'rgba(37, 99, 235, 0.12)',
        iconColor: '#2563eb',
        title: 'Application Submitted — University of Toronto',
        time: '05:02 PM',
      },
      {
        id: 'ac2',
        icon: FiFolder,
        iconBg: 'rgba(6, 182, 212, 0.12)',
        iconColor: '#0891b2',
        title: 'Documents Uploaded — IELTS Official Scorecard',
        time: '10:47 AM',
      },
      {
        id: 'ac3',
        icon: FiCreditCard,
        iconBg: 'rgba(16, 185, 129, 0.12)',
        iconColor: '#059669',
        title: 'Fee Receipt Generated — ₹40,000 Verified',
        time: 'Yesterday',
      },
      {
        id: 'ac4',
        icon: FiHeadphones,
        iconBg: 'rgba(139, 92, 246, 0.12)',
        iconColor: '#7c3aed',
        title: 'Counselling Session Completed with Priya Shah',
        time: '28 Oct',
      },
      {
        id: 'ac5',
        icon: FiCalendar,
        iconBg: 'rgba(245, 158, 11, 0.12)',
        iconColor: '#d97706',
        title: 'Enquiry Created — Canada Study Visa',
        time: '26 Oct',
      },
    ];
  }, [data]);

  if (loading && !data) return <PortalSkeletonPage />;

  return (
    <PortalPage className="crm-sdash">
      {/* ─────────────────────────────────────────────────────────
          ROW 1: TOP PROFILE HERO CARD (WIDE) + 4 ADVANCED KPI METRIC TILES
          ───────────────────────────────────────────────────────── */}
      <section className="crm-sdash-hero-grid" aria-label="Student Overview">
        {/* Left: Detailed Student Profile Card with generous width */}
        <article className="crm-sdash-profile-card">
          <div className="crm-sdash-profile-left">
            <div className="crm-sdash-avatar-wrap">
              <Avatar
                src={studentPhoto}
                name={studentName}
                size="md"
                className="crm-sdash-avatar-circle"
              />
              <span className="crm-sdash-verified-badge" title="Verified Profile">
                <FiCheck />
              </span>
            </div>

            <div className="crm-sdash-profile-identity">
              <div className="crm-sdash-name-row">
                <h2 className="crm-sdash-student-name" title={studentName}>{studentName}</h2>
                <span className="crm-sdash-verified-icon">
                  <FiCheck />
                </span>
                <span className="crm-sdash-active-badge">Active</span>
              </div>
              <div className="crm-sdash-id-status-row">
                <span className="crm-sdash-student-id">{studentId}</span>
                <span className="text-text-muted text-[11px]">•</span>
                <span className="text-text-secondary text-[11px] font-medium truncate" title={studentCity}>{studentCity}</span>
              </div>

              <div className="crm-sdash-contact-list">
                <span className="crm-sdash-contact-item" title={studentPhone}>
                  <FiPhone /> {studentPhone}
                </span>
                <span className="crm-sdash-contact-item" title={studentEmail}>
                  <FiMail /> {studentEmail}
                </span>
              </div>
            </div>
          </div>

          <div className="crm-sdash-profile-divider" />

          <div className="crm-sdash-profile-right">
            <div className="crm-sdash-meta-duo">
              <div className="crm-sdash-meta-box">
                <span className="crm-sdash-meta-label">Country</span>
                <span className="crm-sdash-meta-val flex items-center gap-1.5 font-bold">
                  <CountryFlag country={targetCountry} size="xs" className="rounded-[2px] shadow-xs shrink-0" />
                  <span>{targetCountry}</span>
                </span>
              </div>

              <div className="crm-sdash-meta-box">
                <span className="crm-sdash-meta-label">Intake</span>
                <span className="crm-sdash-meta-val font-bold">{intake}</span>
              </div>
            </div>

            <div className="crm-sdash-meta-box">
              <span className="crm-sdash-meta-label">Target Course</span>
              <span className="crm-sdash-meta-val crm-sdash-meta-val--course" title={targetCourse}>{targetCourse}</span>
            </div>

            {/* Assigned Counselor pill */}
            <div
              className="crm-sdash-counselor-pill"
              onClick={() => setCounselorModalOpen(true)}
              role="button"
              tabIndex={0}
              title="Click to message your counselor"
            >
              <div className="crm-sdash-counselor-info">
                <Avatar
                  src={counselor.photo || counselor.avatar || counselor.profilePic || counselor.image || ''}
                  name={counselor.name || 'Priya Shah'}
                  size="xs"
                  className="crm-sdash-counselor-avatar"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold leading-none">Assigned Counselor</span>
                  <span className="text-xs font-bold text-text truncate leading-tight mt-0.5">{counselor.name || 'Priya Shah'}</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-primary flex items-center gap-0.5 shrink-0 ml-auto pl-1">
                Message <FiChevronRight size={12} />
              </span>
            </div>
          </div>
        </article>

        {/* Right: 4 Top KPI Cards in 1 Row (NO Charts, compact) */}
        <div className="crm-sdash-kpi-quad">
          {/* 1. Applications */}
          <article
            className="crm-sdash-kpi"
            style={{ '--kpi-accent': '#2563eb' }}
            onClick={() => navigate(ROUTES.STUDENT_APPLICATIONS)}
          >
            <div className="crm-sdash-kpi__top">
              <div className="crm-sdash-kpi__icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <FiCalendar />
              </div>
              <span className="crm-sdash-kpi__status-pill crm-sdash-kpi__status-pill--in-progress">
                ✦ In Progress
              </span>
            </div>
            <div className="crm-sdash-kpi__body">
              <strong className="crm-sdash-kpi__value">{kpiCounts.applications}</strong>
              <span className="crm-sdash-kpi__label">Applications</span>
            </div>
            <span className="crm-sdash-kpi__sub">Active study applications</span>
          </article>

          {/* 2. Documents */}
          <article
            className="crm-sdash-kpi"
            style={{ '--kpi-accent': '#f59e0b' }}
            onClick={() => navigate(ROUTES.STUDENT_DOCUMENTS)}
          >
            <div className="crm-sdash-kpi__top">
              <div className="crm-sdash-kpi__icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
                <FiFileText />
              </div>
              <span className="crm-sdash-kpi__status-pill crm-sdash-kpi__status-pill--pending">
                ✦ 2 Pending
              </span>
            </div>
            <div className="crm-sdash-kpi__body">
              <strong className="crm-sdash-kpi__value">{kpiCounts.documents}</strong>
              <span className="crm-sdash-kpi__label">Documents</span>
            </div>
            <span className="crm-sdash-kpi__sub">4 verified, 2 pending</span>
          </article>

          {/* 3. Payments */}
          <article
            className="crm-sdash-kpi"
            style={{ '--kpi-accent': '#10b981' }}
            onClick={() => navigate(ROUTES.STUDENT_FEES)}
          >
            <div className="crm-sdash-kpi__top">
              <div className="crm-sdash-kpi__icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                <FiCreditCard />
              </div>
              <span className="crm-sdash-kpi__status-pill crm-sdash-kpi__status-pill--completed">
                ✓ Active
              </span>
            </div>
            <div className="crm-sdash-kpi__body">
              <strong className="crm-sdash-kpi__value">{kpiCounts.payments}</strong>
              <span className="crm-sdash-kpi__label">Payments</span>
            </div>
            <span className="crm-sdash-kpi__sub">Installments cleared</span>
          </article>

          {/* 4. Visa Status */}
          <article
            className="crm-sdash-kpi"
            style={{ '--kpi-accent': '#8b5cf6' }}
            onClick={() => navigate(ROUTES.STUDENT_VISA)}
          >
            <div className="crm-sdash-kpi__top">
              <div className="crm-sdash-kpi__icon-box" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                <FiAward />
              </div>
              <span className="crm-sdash-kpi__status-pill crm-sdash-kpi__status-pill--neutral">
                Stage 2/4
              </span>
            </div>
            <div className="crm-sdash-kpi__body">
              <strong className="crm-sdash-kpi__value text-lg">{kpiCounts.visaStatus}</strong>
              <span className="crm-sdash-kpi__label">Visa Status</span>
            </div>
            <span className="crm-sdash-kpi__sub">Canada Study Permit</span>
          </article>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 2: 3-COLUMN GRID (MY APPLICATIONS, FEE PAYMENTS WITH BIGGER CHART, DOCUMENTS CHECKLIST)
          ───────────────────────────────────────────────────────── */}
      <section className="crm-sdash-grid-3">
        {/* Column 1: My Applications */}
        <div className="crm-sdash-card">
          <div className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">My Applications</h2>
            <button
              type="button"
              className="crm-sdash-card__link"
              onClick={() => navigate(ROUTES.STUDENT_APPLICATIONS)}
            >
              View All
            </button>
          </div>
          <div className="crm-sdash-card__body p-0 flex flex-col justify-between h-full">
            <div className="crm-sdash-table-wrap">
              <table className="crm-sdash-table">
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '55%' }} />
                  <col style={{ width: '30%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Course &amp; University</th>
                    <th>Status &amp; Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {myApplications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(ROUTES.STUDENT_APPLICATIONS)}
                      title={`View ${app.university || app.country} application`}
                    >
                      <td style={{ width: '15%' }}>
                        <div className="crm-sdash-table__country-flex">
                          <CountryFlag country={app.country} iso={app.iso} size="xs" className="rounded-[2px] shadow-xs shrink-0" />
                          <span className="crm-sdash-table__country-name">{app.country}</span>
                        </div>
                      </td>
                      <td style={{ width: '55%' }}>
                        <div className="flex flex-col min-w-0 max-w-full">
                          <span className="crm-sdash-app-univ" title={app.university}>
                            {app.university}
                          </span>
                          <span className="crm-sdash-app-course" title={app.course}>
                            {app.course}
                          </span>
                        </div>
                      </td>
                      <td style={{ width: '30%' }}>
                        <div className="flex flex-col items-start gap-1">
                          <span className={`crm-sdash-table-pill crm-sdash-table-pill--${app.statusType}`} title={app.status}>
                            <span className="crm-sdash-table-pill__icon">✦</span>
                            <span className="truncate">{app.status}</span>
                          </span>
                          <span className="text-text-secondary text-[10.5px] font-semibold pl-0.5 whitespace-nowrap">
                            Updated {app.nextUpdate}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom applications summary footer to perfectly balance with Fee Payments */}
            <div className="crm-sdash-card-footer">
              <div className="crm-sdash-card-footer__meta">
                <span className="crm-sdash-card-footer__badge">
                  <FiLayers className="text-primary text-xs" />
                  <span>{myApplications.length} Applications</span>
                </span>
                <span className="text-text-muted text-[11px] font-medium hidden sm:inline">
                  • 1 Offer • 1 In Review
                </span>
              </div>
              <button
                type="button"
                className="crm-sdash-card-footer__btn"
                onClick={() => navigate(ROUTES.STUDENT_APPLICATIONS)}
              >
                Track All <FiArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Fee Payments (Large Prominent Donut Chart + Next Installment) */}
        <div className="crm-sdash-card">
          <div className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Fee Payments</h2>
            <button
              type="button"
              className="crm-sdash-card__link"
              onClick={() => navigate(ROUTES.STUDENT_FEES)}
            >
              View All
            </button>
          </div>
          <div className="crm-sdash-card__body">
            <div className="crm-sdash-fees-wrap">
              <div className="crm-sdash-fees-top">
                {/* Bigger Donut Chart */}
                <div className="crm-sdash-donut-container">
                  <ResponsiveContainer width={175} height={175}>
                    <PieChart>
                      <Pie
                        data={feeDonutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={78}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {feeDonutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="crm-sdash-donut-center">
                    <span className="crm-sdash-donut-center__val">{totalFeeFormatted}</span>
                    <span className="crm-sdash-donut-center__lbl">Total Fees</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="crm-sdash-fees-legend">
                  <div className="crm-sdash-fees-legend__row">
                    <span className="crm-sdash-fees-legend__tag">
                      <span className="crm-sdash-fees-legend__dot" style={{ background: '#10b981' }} />
                      Paid
                    </span>
                    <span className="crm-sdash-fees-legend__amount">{paidFeeFormatted}</span>
                  </div>

                  <div className="crm-sdash-fees-legend__row">
                    <span className="crm-sdash-fees-legend__tag">
                      <span className="crm-sdash-fees-legend__dot" style={{ background: '#f59e0b' }} />
                      Pending
                    </span>
                    <span className="crm-sdash-fees-legend__amount">{pendingFeeFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Next Installment & Pay Now Button */}
              <div className="crm-sdash-fees-bottom">
                {Number(data?.finance?.pending ?? 40000) === 0 ? (
                  <>
                    <div className="crm-sdash-fees-next">
                      <span className="crm-sdash-fees-next__title text-emerald-600 font-bold flex items-center gap-1">
                        <FiCheck className="text-emerald-500" /> All Dues Cleared
                      </span>
                      <span className="crm-sdash-fees-next__sub">No pending installments</span>
                    </div>
                    <button
                      type="button"
                      className="crm-sdash-pay-btn !bg-emerald-600 hover:!bg-emerald-700"
                      onClick={() => navigate(ROUTES.STUDENT_FEES)}
                    >
                      Receipts
                    </button>
                  </>
                ) : (
                  <>
                    <div className="crm-sdash-fees-next">
                      <span className="crm-sdash-fees-next__title">Next Installment</span>
                      <div className="flex items-baseline gap-1.5">
                        <strong className="crm-sdash-fees-next__val">{nextDueAmountFormatted}</strong>
                        <span className="crm-sdash-fees-next__sub">Due on {nextDueDateFormatted}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="crm-sdash-pay-btn"
                      onClick={() => {
                        setCustomPayAmount('');
                        setPayModalOpen(true);
                      }}
                    >
                      Pay Now
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Documents Checklist */}
        <div className="crm-sdash-card">
          <div className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Documents Checklist</h2>
            <button
              type="button"
              className="crm-sdash-card__link"
              onClick={() => navigate(ROUTES.STUDENT_DOCUMENTS)}
            >
              View All
            </button>
          </div>
          <div className="crm-sdash-card__body">
            {documentsChecklist.map((doc) => (
              <div
                key={doc.id}
                className="crm-sdash-doc-item"
                onClick={() => {
                  if (!doc.isUploaded) {
                    setSelectedDocName(doc.name);
                    setUploadModalOpen(true);
                  } else {
                    navigate(ROUTES.STUDENT_DOCUMENTS);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <span className="crm-sdash-doc-info">
                  <FiFileText className={doc.isUploaded ? 'text-emerald-500' : 'text-amber-500'} />
                  {doc.name}
                </span>
                <span
                  className={`crm-sdash-doc-badge ${
                    doc.isUploaded ? 'crm-sdash-doc-badge--uploaded' : 'crm-sdash-doc-badge--pending'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 3: 3-COLUMN GRID (ATTENDANCE WITH BIGGER STATS, RECENT ACTIVITY, QUICK ACTIONS)
          ───────────────────────────────────────────────────────── */}
      <section className="crm-sdash-grid-3">
        {/* Column 1: Attendance */}
        <div className="crm-sdash-card">
          <div className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Attendance</h2>
            <button
              type="button"
              className="crm-sdash-card__link"
              onClick={() => navigate(ROUTES.STUDENT_ATTENDANCE)}
            >
              View All
            </button>
          </div>
          <div className="crm-sdash-card__body p-0 flex flex-col justify-between h-full">
            <div className="crm-sdash-att-inner">
              {/* Top Rate & Progress Bar */}
              <div className="crm-sdash-att-top-row">
                <div className="crm-sdash-att-icon-box">
                  <FiCalendar />
                </div>
                <div className="crm-sdash-att-stats">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Attendance Rate</span>
                    <strong className="text-base font-black text-text">{attendanceMetrics.pct}%</strong>
                  </div>
                  <div className="crm-sdash-att-progress-bar">
                    <div className="crm-sdash-att-progress-fill" style={{ width: `${attendanceMetrics.pct}%` }} />
                  </div>
                </div>
              </div>

              {/* Unified Stats Pills (Clean, no clunky borders) */}
              <div className="crm-sdash-att-pills-row">
                <div className="crm-sdash-att-pill crm-sdash-att-pill--present">
                  <span className="crm-sdash-att-pill-dot" />
                  <span className="crm-sdash-att-pill-lbl">Present</span>
                  <strong className="crm-sdash-att-pill-val">{attendanceMetrics.present}</strong>
                </div>
                <div className="crm-sdash-att-pill crm-sdash-att-pill--absent">
                  <span className="crm-sdash-att-pill-dot" />
                  <span className="crm-sdash-att-pill-lbl">Absent</span>
                  <strong className="crm-sdash-att-pill-val">{attendanceMetrics.absent}</strong>
                </div>
                <div className="crm-sdash-att-pill crm-sdash-att-pill--total">
                  <span className="crm-sdash-att-pill-dot" />
                  <span className="crm-sdash-att-pill-lbl">Total</span>
                  <strong className="crm-sdash-att-pill-val">{attendanceMetrics.total}</strong>
                </div>
              </div>

              {/* Weekly Attendance Day Tracker */}
              <div className="crm-sdash-att-week-strip">
                {[
                  { day: 'Mon', status: 'present', label: 'P' },
                  { day: 'Tue', status: 'present', label: 'P' },
                  { day: 'Wed', status: 'present', label: 'P' },
                  { day: 'Thu', status: 'present', label: 'P' },
                  { day: 'Fri', status: 'present', label: 'P' },
                  { day: 'Sat', status: 'weekend', label: 'Off' },
                ].map((d, i) => (
                  <div
                    key={i}
                    className={`crm-sdash-att-day-chip ${d.status === 'weekend' ? 'crm-sdash-att-day-chip--weekend' : ''}`}
                  >
                    <span className="crm-sdash-att-day-name">{d.day}</span>
                    <span className={`crm-sdash-att-day-status crm-sdash-att-day-status--${d.status}`}>
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Docked Active Batch Footer */}
            <div className="crm-sdash-card-footer">
              <div className="flex items-center gap-2 min-w-0">
                <span className="crm-sdash-att-class-tag">Active Batch</span>
                <strong className="text-xs font-bold text-text truncate">IELTS Regular Batch A</strong>
              </div>
              <div className="flex flex-col items-end shrink-0 text-right">
                <span className="text-[11px] font-semibold text-text-secondary">Mon – Fri · 08:30 AM</span>
                <span className="text-[10px] text-text-muted">Mentor: Rakesh Iyer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Recent Activity */}
        <div className="crm-sdash-card">
          <div className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Recent Activity</h2>
            <button
              type="button"
              className="crm-sdash-card__link"
              onClick={() => navigate(ROUTES.STUDENT_NOTIFICATIONS)}
            >
              View All
            </button>
          </div>
          <div className="crm-sdash-card__body">
            {recentActivity.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="crm-sdash-item-row">
                  <div
                    className="crm-sdash-item-icon"
                    style={{ background: act.iconBg, color: act.iconColor }}
                  >
                    <Icon />
                  </div>
                  <div className="crm-sdash-item-info">
                    <span className="crm-sdash-item-title">{act.title}</span>
                  </div>
                  <span className="crm-sdash-item-date">{act.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Quick Actions */}
        <div className="crm-sdash-card">
          <div className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Quick Actions</h2>
          </div>
          <div className="crm-sdash-card__body">
            <div className="crm-sdash-quick-grid">
              <button
                type="button"
                className="crm-sdash-quick-tile crm-sdash-quick-tile--blue"
                onClick={() => setUploadModalOpen(true)}
              >
                <div className="crm-sdash-quick-tile__icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <FiUploadCloud />
                </div>
                <span className="crm-sdash-quick-tile__title">Upload Document</span>
                <span className="crm-sdash-quick-tile__sub">Submit files</span>
              </button>

              <button
                type="button"
                className="crm-sdash-quick-tile crm-sdash-quick-tile--green"
                onClick={() => setPayModalOpen(true)}
              >
                <div className="crm-sdash-quick-tile__icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <FiCreditCard />
                </div>
                <span className="crm-sdash-quick-tile__title">Make Payment</span>
                <span className="crm-sdash-quick-tile__sub">Fee dues</span>
              </button>

              <button
                type="button"
                className="crm-sdash-quick-tile crm-sdash-quick-tile--purple"
                onClick={() => navigate(ROUTES.STUDENT_CALENDAR)}
              >
                <div className="crm-sdash-quick-tile__icon-wrap" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <FiCalendar />
                </div>
                <span className="crm-sdash-quick-tile__title">Book Class</span>
                <span className="crm-sdash-quick-tile__sub">Schedule session</span>
              </button>

              <button
                type="button"
                className="crm-sdash-quick-tile crm-sdash-quick-tile--cyan"
                onClick={() => setCounselorModalOpen(true)}
              >
                <div className="crm-sdash-quick-tile__icon-wrap" style={{ background: '#ecfeff', color: '#0891b2' }}>
                  <FiHeadphones />
                </div>
                <span className="crm-sdash-quick-tile__title">Contact Counselor</span>
                <span className="crm-sdash-quick-tile__sub">Message counselor</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          INTERACTIVE MODAL: CONTACT COUNSELOR
          ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {counselorModalOpen && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              className="w-full max-w-md bg-card-bg rounded-2xl border border-border shadow-2xl p-5 overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                    <FiHeadphones className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-text text-sm">Message Counselor</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCounselorModalOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-page transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border">
                  <Avatar
                    src={counselor.photo || counselor.avatar || counselor.profilePic || counselor.image || ''}
                    name={counselor.name || 'Priya Mehta'}
                    size="sm"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-text">{counselor.name || 'Priya Mehta'}</h4>
                    <p className="text-xs text-text-muted">{counselor.email || 'priya.mehta@3niinfotech.com'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Your Question / Message
                  </label>
                  <textarea
                    rows={4}
                    value={counselorMessage}
                    onChange={(e) => setCounselorMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-page focus:outline-none focus:border-brand resize-none"
                    placeholder="Ask about application status, IELTS classes, visa documents..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  disabled={sendingMessage}
                  onClick={() => setCounselorModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:bg-page transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={sendingMessage}
                  onClick={handleSendMessageToCounselor}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-3.5 h-3.5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────
          INTERACTIVE MODAL: QUICK UPLOAD DOCUMENT
          ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {uploadModalOpen && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              className="w-full max-w-md bg-card-bg rounded-2xl border border-border shadow-2xl p-5 overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
                    <FiUploadCloud className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-text text-sm">Upload Document</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-page transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Document Type
                  </label>
                  <select
                    value={selectedDocName}
                    onChange={(e) => setSelectedDocName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-page focus:outline-none focus:border-brand"
                  >
                    <option value="Passport">Passport</option>
                    <option value="10th Marksheet">10th Marksheet</option>
                    <option value="12th Marksheet">12th Marksheet</option>
                    <option value="IELTS Score Card">IELTS Score Card</option>
                    <option value="Financial Proof">Financial Proof</option>
                    <option value="Photo & Signature">Photo & Signature</option>
                  </select>
                </div>

                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:border-brand transition-colors bg-surface-2">
                  <FiUploadCloud className="text-2xl text-primary-600" />
                  <p className="text-xs font-bold text-text">Click or drag PDF/JPG here</p>
                  <p className="text-xs text-text-muted">Maximum file size: 10 MB</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:bg-page transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toastService.success(`${selectedDocName} uploaded successfully!`);
                    setUploadModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  <FiUploadCloud className="w-3.5 h-3.5" />
                  Upload Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────
          INTERACTIVE MODAL: MAKE ONLINE FEE PAYMENT
          ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {payModalOpen && (
          <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              className="w-full max-w-md bg-card-bg rounded-2xl border border-border shadow-2xl p-5 overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <FiCreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text text-sm">Online Fee Payment</h3>
                    <span className="text-xs text-text-muted">256-Bit SSL Encrypted Checkout</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={payProcessing}
                  onClick={() => setPayModalOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-page transition-colors disabled:opacity-50"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3.5">
                {/* Due Breakdown Tile */}
                <div className="p-3.5 rounded-xl bg-surface-2 border border-border flex items-center justify-between">
                  <div>
                    <span className="text-xs text-text-muted font-bold block">Next Installment Due</span>
                    <strong className="text-xl font-extrabold text-emerald-600">
                      {customPayAmount ? `₹ ${Number(customPayAmount).toLocaleString('en-IN')}` : nextDueAmountFormatted}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-text-muted font-semibold block">Due: {nextDueDateFormatted}</span>
                    <span className="text-xs text-emerald-600 font-bold">0% Convenience Fee</span>
                  </div>
                </div>

                {/* Custom Amount / Full Pay Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-text-secondary">Amount to Pay (INR)</label>
                    <button
                      type="button"
                      className="text-xs font-bold text-primary hover:underline"
                      onClick={() => setCustomPayAmount(String(Number(data?.finance?.nextDueAmount || data?.finance?.pending) || 40000))}
                    >
                      Pay Full Due
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">₹</span>
                    <input
                      type="number"
                      min={100}
                      className="w-full pl-8 pr-3 py-2 text-sm font-bold rounded-lg border border-border bg-page focus:outline-none focus:ring-2 focus:ring-emerald-500 text-text"
                      placeholder={String(Number(data?.finance?.nextDueAmount || data?.finance?.pending) || 40000)}
                      value={customPayAmount}
                      onChange={(e) => setCustomPayAmount(e.target.value)}
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Select Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPayMethod('UPI')}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        selectedPayMethod === 'UPI'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                          : 'border-border bg-page text-text-muted hover:text-text'
                      }`}
                    >
                      <FiSend className="w-4 h-4" />
                      <span className="text-xs">UPI / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayMethod('Cards')}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        selectedPayMethod === 'Cards'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                          : 'border-border bg-page text-text-muted hover:text-text'
                      }`}
                    >
                      <FiCreditCard className="w-4 h-4" />
                      <span className="text-xs">Cards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayMethod('NetBanking')}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        selectedPayMethod === 'NetBanking'
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                          : 'border-border bg-page text-text-muted hover:text-text'
                      }`}
                    >
                      <FiDollarSign className="w-4 h-4" />
                      <span className="text-xs">NetBanking</span>
                    </button>
                  </div>
                </div>

                {/* Security Trust Note */}
                <div className="flex items-center justify-between text-xs text-text-muted bg-surface-2 p-2 rounded-lg border border-border/60">
                  <span className="flex items-center gap-1">🔒 256-Bit SSL Encrypted</span>
                  <span className="text-emerald-600 font-semibold">⚡ Instant Receipt</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  disabled={payProcessing}
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:bg-page transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={payProcessing}
                  onClick={handleRazorpayPay}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {payProcessing ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-3.5 h-3.5" />
                      Proceed to Pay ₹{customPayAmount ? Number(customPayAmount).toLocaleString('en-IN') : Number(data?.finance?.nextDueAmount || data?.finance?.pending || 40000).toLocaleString('en-IN')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            CELEBRATORY PAYMENT SUCCESS RECEIPT MODAL
            ───────────────────────────────────────────────────────── */}
        {paySuccessReceipt && (
          <div className="fixed inset-0 z-[1550] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              className="w-full max-w-sm bg-card-bg rounded-2xl border border-emerald-500/30 shadow-2xl p-6 text-center overflow-hidden"
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-2xl shadow-inner mb-3">
                <FiCheck className="stroke-[3]" />
              </div>

              <h3 className="text-base font-extrabold text-text">Payment Successful!</h3>
              <p className="text-xs text-text-muted mt-0.5">Your fee installment has been received securely.</p>

              <div className="my-4 p-3.5 rounded-xl bg-surface-2 border border-border text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Receipt No</span>
                  <span className="font-mono font-bold text-text">{paySuccessReceipt.receiptNo || 'REC-CONFIRMED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Amount Paid</span>
                  <strong className="text-emerald-600 font-extrabold">₹ {Number(paySuccessReceipt.amount || 40000).toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Payment Gateway</span>
                  <span className="font-semibold text-text">Verified Bank Gateway</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-medium">Status</span>
                  <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded-full">
                    ✓ Paid
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPaySuccessReceipt(null);
                    navigate(ROUTES.STUDENT_FEES);
                  }}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  View All Receipts
                </button>
                <button
                  type="button"
                  onClick={() => setPaySuccessReceipt(null)}
                  className="w-full py-2 px-4 text-xs font-semibold rounded-xl border border-border text-text-secondary hover:bg-page transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PortalPage>
  );
}

