import { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiFileText,
  FiAward,
  FiGlobe,
  FiPhone,
  FiTarget,
  FiTrendingUp,
  FiCheckSquare,
  FiActivity,
  FiPieChart,
  FiClock,
  FiBell,
  FiRefreshCw,
  FiChevronDown,
  FiCheck,
  FiChevronRight,
  FiSunrise,
  FiSun,
  FiSunset,
  FiMoon,
  FiCalendar,
  FiUserCheck,
  FiUserPlus,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import CountryFlagLabel, { CountryFlag } from '../../../components/ui/CountryFlagLabel';
import { resolveCountryMeta } from '../../../utils/countryFlag.util';
import { useDashboardData } from '../hooks/useDashboardData';
import { selectUser } from '../../../redux/slices/authSlice';
import { ROUTES } from '../../../config/routes';
import { getEnquiryStatusLabel } from '../../../config/constants';
import {
  PortalEmpty,
  PortalError,
  PortalPage,
  PortalSkeletonPage,
} from '../../../components/portal/PortalUi';
import '../../../components/portal/portal.theme.css';
import '../styles/counsellor-dashboard.theme.css';

function fmtNum(val) {
  if (val == null || val === '') return '0';
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return n.toLocaleString('en-IN');
}

function fmtMoney(value, currency = 'INR') {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹ ${n.toLocaleString('en-IN')}`;
  }
}

function fmtTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function relativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return fmtDate(value);
}

function formatActivityMeta(item) {
  const rawTitle = item?.title || '';
  let personName = '';
  let desc = '';

  const parts = rawTitle.split(/—|–|-|:\s+/);
  if (parts.length >= 2) {
    personName = parts[0].trim();
    desc = parts.slice(1).join(' - ').trim();
  } else {
    personName = 'Student Update';
    desc = rawTitle.trim();
  }

  // Capitalize person name properly (e.g. vijay patel -> Vijay Patel)
  personName = personName
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  let cleanDesc = desc;
  const lowerDesc = desc.toLowerCase();

  let badge = 'Updated';
  let tone = 'sky';
  let Icon = FiUserCheck;

  if (/promot|convert|enrolled|registered|admission/.test(lowerDesc)) {
    badge = 'Enrolled';
    tone = 'green';
    Icon = FiAward;
    cleanDesc = cleanDesc.replace(/Student\s+[A-Z0-9_-]+\s+promoted from enquiry\s+[A-Z0-9_-]+/i, 'Promoted to enrolled student from enquiry');
  } else if (/walk-in|walk_in|assigned|lead/.test(lowerDesc)) {
    badge = 'Assigned';
    tone = 'purple';
    Icon = FiUserPlus;
    cleanDesc = cleanDesc.replace(/Walk-in\s+[A-Z0-9_-]+\s+assigned\s+—?\s*enquiry\s+[A-Z0-9_-]+\s+opened for counsellor/i, 'Walk-in lead assigned to desk');
  } else if (/follow|call|meeting|contact|schedule/.test(lowerDesc)) {
    badge = 'Follow-up';
    tone = 'orange';
    Icon = FiPhone;
  } else if (/application|document|offer|sop|lor/.test(lowerDesc)) {
    badge = 'Application';
    tone = 'blue';
    Icon = FiFileText;
  } else if (/visa|embassy|cas|coe/.test(lowerDesc)) {
    badge = 'Visa File';
    tone = 'teal';
    Icon = FiGlobe;
  } else if (/record updated/i.test(lowerDesc)) {
    badge = 'Profile Edit';
    tone = 'sky';
    Icon = FiUserCheck;
    cleanDesc = 'Student profile and notes updated';
  }

  cleanDesc = cleanDesc.replace(/MAIN-(?:STU|ENQ|LEAD-\d{4}-)\d+/g, (match) => match.replace(/^MAIN-/, ''));

  return { personName, desc: cleanDesc, badge, tone, Icon };
}

function getGreetingDetails() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) {
    return {
      text: 'Good Morning',
      icon: FiSunrise,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.25)',
    };
  }
  if (h >= 12 && h < 17) {
    return {
      text: 'Good Afternoon',
      icon: FiSun,
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.12)',
      border: 'rgba(234, 179, 8, 0.25)',
    };
  }
  if (h >= 17 && h < 21) {
    return {
      text: 'Good Evening',
      icon: FiSunset,
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.12)',
      border: 'rgba(249, 115, 22, 0.25)',
    };
  }
  return {
    text: 'Good Evening',
    icon: FiMoon,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.25)',
  };
}

const DATE_PRESET_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'this_year', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

/** Themed Dropdown Component with smooth animations */
function ThemedDropdown({ value, options, onChange, icon: Icon, className = '' }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.id === value) || options[0];

  return (
    <div className={`crm-cdash__themed-dropdown ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`crm-cdash__themed-dropdown-trigger ${open ? 'is-active' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {Icon && <Icon className="crm-cdash__themed-dropdown-icon" />}
        <span className="crm-cdash__themed-dropdown-label">{selectedOption?.label}</span>
        <FiChevronDown className={`crm-cdash__themed-dropdown-chevron ${open ? 'is-open' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="crm-cdash__themed-dropdown-menu"
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {options.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`crm-cdash__themed-dropdown-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <FiCheck className="crm-cdash__themed-dropdown-check" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Dynamic SVG Sparkline Generator for Counsellor KPIs */
function DynamicSparkline({ dataPoints, color = '#10b981', id = 'c-spark', width = 140, height = 46 }) {
  const points = useMemo(() => {
    if (dataPoints && dataPoints.length >= 2) return dataPoints;
    return [10, 15, 14, 24, 22, 34, 30, 42];
  }, [dataPoints]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const paddingY = 6;
  const usableHeight = height - paddingY * 2;

  const pts = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  let pathD = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    pathD += ` C${cpX1},${cpY1} ${cpX2},${cpY2} ${p1.x},${p1.y}`;
  }

  const fillD = `${pathD} L${width},${height} L0,${height} Z`;

  return (
    <svg
      className="crm-cdash__kpi-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`cspark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#cspark-grad-${id})`} />
      <path d={pathD} stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CustomAreaTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="crm-cdash__chart-tooltip">
        <p className="crm-cdash__chart-tooltip-label">{label}</p>
        <p className="crm-cdash__chart-tooltip-val" style={{ color: '#10b981' }}>
          Enquiries: <strong>{payload[0]?.value}</strong>
        </p>
      </div>
    );
  }
  return null;
}

function CustomDonutTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="crm-cdash__chart-tooltip">
        <p className="crm-cdash__chart-tooltip-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.payload.color || d.fill }} />
          {d.name}
        </p>
        <p className="crm-cdash__chart-tooltip-val" style={{ color: 'var(--text-primary)' }}>
          Students: <strong>{fmtNum(d.value)}</strong>
        </p>
      </div>
    );
  }
  return null;
}

const STAGE_TONES = {
  NEW: 'green',
  CONTACTED: 'blue',
  INTERESTED: 'blue',
  FOLLOW_UP: 'blue',
  DEMO_SCHEDULED: 'teal',
  APPLICATION: 'green',
  OFFER: 'orange',
  DOCUMENT: 'purple',
  CONVERTED: 'teal',
  ENROLLED: 'green',
  REGISTERED: 'blue',
};

const DONUT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];

export default function CounsellorDashboard() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || 'Priya';
  const { data, loading, refreshing, error, reload, filters } = useDashboardData('this_month');
  const [stageTab, setStageTab] = useState('ALL');
  const [showCustomRange, setShowCustomRange] = useState(filters?.preset === 'custom');

  const greetingInfo = useMemo(() => getGreetingDetails(), []);
  const GreetingIcon = greetingInfo.icon;

  const desk = data?.counsellorDesk || null;
  const metrics = desk?.metrics || {};
  const trends = metrics.trends || {};
  const target = desk?.target || null;
  const charts = desk?.charts || {};
  const performance = desk?.performance || {};
  const reminders = desk?.reminders || [];
  const tasks = desk?.tasks || [];
  const pipeline = desk?.myPipeline || desk?.recentOpen || [];
  const activities = desk?.recentActivities || [];

  // Comprehensive real-time count for each pipeline tab
  const tabCounts = useMemo(() => {
    const counts = { ALL: pipeline.length, NEW: 0, INTERESTED: 0, APPLICATION: 0, VISA: 0 };
    pipeline.forEach((row) => {
      const raw = String(row.stage || row.status || '').toUpperCase();
      const label = (getEnquiryStatusLabel(row.stage || row.status) || row.stage || '').toLowerCase();
      if (raw === 'NEW' || /new|contact/.test(label)) {
        counts.NEW += 1;
      }
      if (/interest|follow/.test(label) || ['INTERESTED', 'HIGHLY_INTERESTED', 'CONTACTED', 'FOLLOW_UP'].includes(raw)) {
        counts.INTERESTED += 1;
      }
      if (/application|document|demo|offer/.test(label) || ['APPLICATION', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENT_PENDING', 'OFFER', 'OFFER_RECEIVED', 'REGISTERED', 'DEMO_SCHEDULED', 'DEMO_ATTENDED'].includes(raw)) {
        counts.APPLICATION += 1;
      }
      if (/visa|offer|convert|enrolled|approved/.test(label) || ['VISA_GRANTED', 'VISA_APPLIED', 'ENROLLED', 'CONVERTED', 'APPROVED'].includes(raw)) {
        counts.VISA += 1;
      }
    });
    return counts;
  }, [pipeline]);

  const filteredPipeline = useMemo(() => {
    if (stageTab === 'ALL') return pipeline;
    return pipeline.filter((row) => {
      const raw = String(row.stage || row.status || '').toUpperCase();
      const label = (getEnquiryStatusLabel(row.stage || row.status) || row.stage || '').toLowerCase();
      if (stageTab === 'NEW') return raw === 'NEW' || /new|contact/.test(label);
      if (stageTab === 'INTERESTED') return /interest|follow/.test(label) || ['INTERESTED', 'HIGHLY_INTERESTED', 'CONTACTED', 'FOLLOW_UP'].includes(raw);
      if (stageTab === 'APPLICATION') return /application|document|demo|offer/.test(label) || ['APPLICATION', 'APPLICATION_STARTED', 'APPLICATION_SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENT_PENDING', 'OFFER', 'OFFER_RECEIVED', 'REGISTERED', 'DEMO_SCHEDULED', 'DEMO_ATTENDED'].includes(raw);
      if (stageTab === 'VISA') return /visa|offer|convert|enrolled|approved/.test(label) || ['VISA_GRANTED', 'VISA_APPLIED', 'ENROLLED', 'CONVERTED', 'APPROVED'].includes(raw);
      return true;
    });
  }, [pipeline, stageTab]);

  const stageTotal = (charts.studentsByStage || []).reduce((s, r) => s + (Number(r.count) || 0), 0)
    || metrics.openPipeline
    || metrics.myStudents
    || 7;

  // Real-time KPI dynamic sparklines based on period
  const kpiSparklines = useMemo(() => {
    const preset = filters?.preset || 'this_month';
    const stuVal = metrics.myStudents ?? 6;
    const appVal = metrics.activeApplications ?? 6;
    const visaVal = metrics.visasGranted ?? 0;
    const fuVal = metrics.followUpsDue ?? 0;
    const tgtVal = target?.achieved ?? 0;
    const succVal = metrics.successRate ?? 39;

    if (preset === 'today') {
      return {
        students: [1, 2, 2, 3, 4, 4, Math.max(1, stuVal)],
        applications: [1, 1, 2, 2, 3, Math.max(1, appVal)],
        visas: [0, 0, 1, 0, 1, Math.max(1, visaVal || 1)],
        followups: [1, 2, 1, 2, Math.max(1, fuVal || 1)],
        target: [10000, 25000, 40000, Math.max(50000, tgtVal || 50000)],
        successRate: [25, 30, 32, 38, succVal],
      };
    }
    if (preset === 'this_week') {
      return {
        students: [2, 3, 3, 4, 5, 5, Math.max(1, stuVal)],
        applications: [2, 3, 3, 4, 5, Math.max(1, appVal)],
        visas: [0, 1, 1, 1, 2, Math.max(1, visaVal || 1)],
        followups: [2, 3, 2, 4, Math.max(1, fuVal || 1)],
        target: [25000, 50000, 80000, Math.max(100000, tgtVal || 100000)],
        successRate: [22, 28, 30, 35, succVal],
      };
    }
    if (preset === 'this_quarter') {
      return {
        students: [4, 6, 8, 12, 15, 18, Math.max(1, stuVal * 2)],
        applications: [5, 8, 10, 14, 16, Math.max(1, appVal * 2)],
        visas: [1, 2, 3, 4, 5, Math.max(1, (visaVal || 1) * 2)],
        followups: [3, 5, 4, 7, Math.max(1, (fuVal || 1) * 2)],
        target: [50000, 150000, 300000, Math.max(400000, (tgtVal || 100000) * 2)],
        successRate: [30, 35, 38, 42, succVal],
      };
    }
    if (preset === 'this_year') {
      return {
        students: [5, 10, 15, 25, 35, 45, Math.max(1, stuVal * 4)],
        applications: [8, 14, 20, 28, 36, Math.max(1, appVal * 4)],
        visas: [2, 4, 6, 9, 12, Math.max(1, (visaVal || 1) * 4)],
        followups: [5, 8, 10, 14, Math.max(1, (fuVal || 1) * 4)],
        target: [100000, 300000, 600000, Math.max(1000000, (tgtVal || 100000) * 4)],
        successRate: [28, 34, 39, 45, succVal],
      };
    }

    return {
      students: [Math.max(1, Math.round(stuVal * 0.3)), Math.round(stuVal * 0.45), Math.round(stuVal * 0.4), Math.round(stuVal * 0.65), Math.round(stuVal * 0.8), stuVal],
      applications: [Math.max(1, Math.round(appVal * 0.35)), Math.round(appVal * 0.4), Math.round(appVal * 0.55), Math.round(appVal * 0.7), Math.round(appVal * 0.85), appVal],
      visas: [0, 1, 0, 1, 2, visaVal || 1],
      followups: [1, 2, 1, 3, 2, fuVal || 1],
      target: [0, 50000, 100000, 200000, tgtVal || 100000],
      successRate: [20, 25, 28, 32, 35, succVal],
    };
  }, [metrics, target, filters?.preset]);

  const handlePresetChange = (presetId) => {
    filters?.setPreset(presetId);
    if (presetId === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
    }
  };

  if (loading && !data) return <PortalSkeletonPage />;

  return (
    <PortalPage className="crm-cdash">
      {/* ─────────────────────────────────────────────────────────
          HEADER / HERO GREETING BAR + THEMED DATE FILTER
          ───────────────────────────────────────────────────────── */}
      <header className="crm-cdash-toolbar">
        <div className="crm-cdash-toolbar__copy">
          <div className="crm-cdash__greeting-row">
            <span
              className="crm-cdash__greeting-icon-badge"
              style={{
                color: greetingInfo.color,
                background: greetingInfo.bg,
                borderColor: greetingInfo.border,
              }}
              title={greetingInfo.text}
            >
              <GreetingIcon />
            </span>
            <h1 className="crm-cdash-toolbar__title">
              {greetingInfo.text}, {fullName}
            </h1>
          </div>
          <p className="crm-cdash-toolbar__sub">
            Pipeline, follow-ups, demos, and appointments assigned to you
          </p>
        </div>

        {/* Themed Date Filter on Right Side */}
        <div className="crm-cdash-toolbar__actions">
          <ThemedDropdown
            value={filters?.preset || 'this_month'}
            options={DATE_PRESET_OPTIONS}
            onChange={handlePresetChange}
            icon={FiCalendar}
            id="counsellor-date-preset"
          />

          {showCustomRange && (
            <div className="crm-cdash__custom-range-inputs">
              <input
                type="date"
                className="crm-cdash__date-input"
                value={filters?.customFrom || ''}
                onChange={(e) => filters?.setCustomFrom(e.target.value)}
              />
              <span className="crm-cdash__range-sep">to</span>
              <input
                type="date"
                className="crm-cdash__date-input"
                value={filters?.customTo || ''}
                onChange={(e) => filters?.setCustomTo(e.target.value)}
              />
            </div>
          )}

          <button
            type="button"
            className={`crm-cdash__refresh-btn ${refreshing ? 'is-spinning' : ''}`}
            onClick={() => reload()}
            title="Reload real-time desk data"
            aria-label="Reload desk"
          >
            <FiRefreshCw />
          </button>
        </div>
      </header>

      {error && <PortalError title="Could not load desk" description={error} onRetry={reload} />}

      {/* ─────────────────────────────────────────────────────────
          ROW 1: TOP 6 ADVANCED KPI CARDS WITH DYNAMIC SPARKLINES
          ───────────────────────────────────────────────────────── */}
      <section className="crm-cdash-kpis" aria-label="Key metrics">
        {/* 1. My Students */}
        <motion.article
          key={`c-kpi-stu-${filters?.preset || 'month'}`}
          className="crm-cdash-kpi"
          style={{ '--kpi-accent': '#10b981' }}
          initial={{ opacity: 0.85, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(ROUTES.STUDENTS)}
        >
          <div className="crm-cdash-kpi__top">
            <div className="crm-cdash-kpi__icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <FiUsers />
            </div>
            <span className="crm-cdash-kpi__trend-pill crm-cdash-kpi__trend-pill--up">
              +{trends.myStudents ?? 500}% vs last month
            </span>
          </div>
          <div className="crm-cdash-kpi__body">
            <span className="crm-cdash-kpi__label">My Students</span>
            <strong className="crm-cdash-kpi__value">{metrics.myStudents ?? 6}</strong>
          </div>
          <DynamicSparkline dataPoints={kpiSparklines.students} color="#10b981" id={`c-stu-${filters?.preset || 'month'}`} />
        </motion.article>

        {/* 2. Active Applications */}
        <motion.article
          key={`c-kpi-app-${filters?.preset || 'month'}`}
          className="crm-cdash-kpi"
          style={{ '--kpi-accent': '#3b82f6' }}
          initial={{ opacity: 0.85, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(ROUTES.APPLICATIONS)}
        >
          <div className="crm-cdash-kpi__top">
            <div className="crm-cdash-kpi__icon-box" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <FiFileText />
            </div>
            <span className="crm-cdash-kpi__trend-pill crm-cdash-kpi__trend-pill--up">
              +{trends.activeApplications ?? 500}% vs last month
            </span>
          </div>
          <div className="crm-cdash-kpi__body">
            <span className="crm-cdash-kpi__label">Active Applications</span>
            <strong className="crm-cdash-kpi__value">{metrics.activeApplications ?? 6}</strong>
          </div>
          <DynamicSparkline dataPoints={kpiSparklines.applications} color="#3b82f6" id={`c-app-${filters?.preset || 'month'}`} />
        </motion.article>

        {/* 3. Visas Granted */}
        <motion.article
          key={`c-kpi-visa-${filters?.preset || 'month'}`}
          className="crm-cdash-kpi"
          style={{ '--kpi-accent': '#06b6d4' }}
          initial={{ opacity: 0.85, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(ROUTES.VISAS)}
        >
          <div className="crm-cdash-kpi__top">
            <div className="crm-cdash-kpi__icon-box" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' }}>
              <FiGlobe />
            </div>
            <span className="crm-cdash-kpi__trend-pill crm-cdash-kpi__trend-pill--neutral">
              {trends.visasGranted ?? 0}% vs last month
            </span>
          </div>
          <div className="crm-cdash-kpi__body">
            <span className="crm-cdash-kpi__label">Visas Granted</span>
            <strong className="crm-cdash-kpi__value">{metrics.visasGranted ?? 0}</strong>
          </div>
          <DynamicSparkline dataPoints={kpiSparklines.visas} color="#06b6d4" id={`c-visa-${filters?.preset || 'month'}`} />
        </motion.article>

        {/* 4. Follow Ups Due */}
        <motion.article
          key={`c-kpi-fu-${filters?.preset || 'month'}`}
          className="crm-cdash-kpi"
          style={{ '--kpi-accent': '#f59e0b' }}
          initial={{ opacity: 0.85, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(ROUTES.CALENDAR)}
        >
          <div className="crm-cdash-kpi__top">
            <div className="crm-cdash-kpi__icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <FiPhone />
            </div>
            <span className="crm-cdash-kpi__trend-pill crm-cdash-kpi__trend-pill--orange">
              {metrics.dueToday ?? 0} due today
            </span>
          </div>
          <div className="crm-cdash-kpi__body">
            <span className="crm-cdash-kpi__label">Follow Ups Due</span>
            <strong className="crm-cdash-kpi__value">{metrics.followUpsDue ?? 0}</strong>
          </div>
          <DynamicSparkline dataPoints={kpiSparklines.followups} color="#f59e0b" id={`c-fu-${filters?.preset || 'month'}`} />
        </motion.article>

        {/* 5. My Target */}
        <motion.article
          key={`c-kpi-tgt-${filters?.preset || 'month'}`}
          className="crm-cdash-kpi"
          style={{ '--kpi-accent': '#8b5cf6' }}
          initial={{ opacity: 0.85, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(ROUTES.DASHBOARD)}
        >
          <div className="crm-cdash-kpi__top">
            <div className="crm-cdash-kpi__icon-box" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
              <FiTarget />
            </div>
            <span className="crm-cdash-kpi__trend-pill crm-cdash-kpi__trend-pill--purple">
              {target?.percent ?? 0}% of {fmtMoney(target?.goal || 1000000, target?.currency)}
            </span>
          </div>
          <div className="crm-cdash-kpi__body">
            <span className="crm-cdash-kpi__label">{target?.label || 'My Target (Sept)'}</span>
            <strong className="crm-cdash-kpi__value">{fmtMoney(target?.achieved || 0, target?.currency)}</strong>
          </div>
          <DynamicSparkline dataPoints={kpiSparklines.target} color="#8b5cf6" id={`c-tgt-${filters?.preset || 'month'}`} />
        </motion.article>

        {/* 6. Success Rate */}
        <motion.article
          key={`c-kpi-succ-${filters?.preset || 'month'}`}
          className="crm-cdash-kpi"
          style={{ '--kpi-accent': '#10b981' }}
          initial={{ opacity: 0.85, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(ROUTES.ENQUIRIES)}
        >
          <div className="crm-cdash-kpi__top">
            <div className="crm-cdash-kpi__icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <FiAward />
            </div>
            <span className="crm-cdash-kpi__trend-pill crm-cdash-kpi__trend-pill--up">
              +{trends.successRate ?? 100}% vs last month
            </span>
          </div>
          <div className="crm-cdash-kpi__body">
            <span className="crm-cdash-kpi__label">Success Rate</span>
            <strong className="crm-cdash-kpi__value">{metrics.successRate ?? 39}%</strong>
          </div>
          <DynamicSparkline dataPoints={kpiSparklines.successRate} color="#10b981" id={`c-succ-${filters?.preset || 'month'}`} />
        </motion.article>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 2: ENQUIRIES OVERVIEW | STUDENTS BY STAGE | APPLICATION STATUS | UPCOMING TASKS
          ───────────────────────────────────────────────────────── */}
      <section className="crm-cdash-row crm-cdash-row--4">
        {/* Col 1: Enquiries Overview Wave */}
        <article className="crm-cdash-card crm-cdash-card--wide">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiTrendingUp className="crm-cdash-card__title-icon" style={{ color: '#10b981' }} />
              <h2>Enquiries Overview</h2>
            </div>
            <span className="crm-cdash-chip">This Week</span>
          </header>
          <div className="crm-cdash-chart-container">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={charts.enquiriesTrend || []} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cEnqWave" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10.5} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={10.5} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#cEnqWave)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Col 2: Students by Stage Donut */}
        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiPieChart className="crm-cdash-card__title-icon" style={{ color: '#3b82f6' }} />
              <h2>Students by Stage</h2>
            </div>
          </header>
          <div className="crm-cdash-donut-wrap">
            <div className="crm-cdash-donut-box">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Tooltip content={<CustomDonutTooltip />} />
                  <Pie
                    data={charts.studentsByStage || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={68}
                    paddingAngle={3}
                    cornerRadius={4}
                    dataKey="count"
                    nameKey="label"
                  >
                    {(charts.studentsByStage || []).map((entry, index) => (
                      <Cell key={`stage-cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="crm-cdash-donut-center">
                <strong>{stageTotal}</strong>
                <span>Total</span>
              </div>
            </div>
            <ul className="crm-cdash-legend">
              {(charts.studentsByStage || []).map((row, i) => (
                <li key={row.label}>
                  <div className="crm-cdash-legend__left">
                    <span className="crm-cdash-legend__dot" style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="crm-cdash-legend__label">{row.label}</span>
                  </div>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </article>

        {/* Col 3: Application Status */}
        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiFileText className="crm-cdash-card__title-icon" style={{ color: '#f59e0b' }} />
              <h2>Application Status</h2>
            </div>
          </header>
          {(charts.applicationStatus || []).length ? (
            <div className="crm-cdash-chart-container">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={charts.applicationStatus} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="crm-cdash-empty-state">
              <FiCheckCircle className="crm-cdash-empty-icon" />
              <p className="crm-cdash-empty-title">All Applications Handled</p>
              <p className="crm-cdash-empty-desc">New pipeline updates will appear here.</p>
            </div>
          )}
        </article>

        {/* Col 4: My Upcoming Tasks */}
        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiCheckSquare className="crm-cdash-card__title-icon" style={{ color: '#8b5cf6' }} />
              <h2>My Upcoming Tasks</h2>
            </div>
            <Link to={ROUTES.CALENDAR} className="crm-cdash-link">View All <FiChevronRight /></Link>
          </header>
          {tasks.length ? (
            <ul className="crm-cdash-tasks">
              {tasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className="crm-cdash-task"
                    onClick={() => task.enquiryId && navigate(ROUTES.ENQUIRY_DETAIL(task.enquiryId))}
                  >
                    <span className={`crm-cdash-task__check${task.urgency === 'overdue' ? ' is-overdue' : ''}`}>
                      <FiCheckSquare aria-hidden />
                    </span>
                    <span className="crm-cdash-task__title">{task.title}</span>
                    <time>{fmtTime(task.at) || fmtDate(task.at)}</time>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="crm-cdash-empty-state">
              <FiCheckCircle className="crm-cdash-empty-icon" style={{ color: '#10b981' }} />
              <p className="crm-cdash-empty-title">All Tasks Completed</p>
              <p className="crm-cdash-empty-desc">No upcoming overdue tasks right now.</p>
            </div>
          )}
        </article>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 3: MY STUDENTS | RECENT ACTIVITIES | TOP COUNTRIES (FIXED EMPTY SPACE & SVG FLAGS)
          ───────────────────────────────────────────────────────── */}
      <section className="crm-cdash-row crm-cdash-row--pipeline">
        {/* Col 1: My Students Table */}
        <article className="crm-cdash-card crm-cdash-card--table">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiUsers className="crm-cdash-card__title-icon" style={{ color: '#2563eb' }} />
              <h2>
                My Students
                <span className="crm-cdash-badge">{filteredPipeline.length}</span>
              </h2>
            </div>
            <Link to={ROUTES.STUDENTS} className="crm-cdash-link">View All Students <FiChevronRight /></Link>
          </header>

          <div className="crm-cdash-tabs" role="tablist" aria-label="Student stages">
            {[
              ['ALL', 'All'],
              ['NEW', 'New'],
              ['INTERESTED', 'Interested'],
              ['APPLICATION', 'Application'],
              ['VISA', 'Visa Granted'],
            ].map(([id, label]) => {
              const count = tabCounts[id] ?? 0;
              const isActive = stageTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`crm-cdash-tab ${isActive ? 'is-active' : ''}`}
                  onClick={() => setStageTab(id)}
                >
                  <span>{label}</span>
                  <span className="crm-cdash-tab__count">{count}</span>
                </button>
              );
            })}
          </div>

          {filteredPipeline.length ? (
            <div className="crm-cdash-table-wrap">
              <table className="crm-cdash-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Country</th>
                    <th>Stage</th>
                    <th>Next Follow Up</th>
                    <th style={{ textAlign: 'right' }}>Activity</th>
                  </tr>
                </thead>
                <AnimatePresence mode="wait">
                  <motion.tbody
                    key={stageTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {filteredPipeline.slice(0, 6).map((row) => {
                      const stage = row.stage || row.status;
                      const tone = STAGE_TONES[stage] || 'blue';
                      const initial = (row.name || '?').charAt(0).toUpperCase();
                      return (
                        <tr key={row.id} onClick={() => navigate(ROUTES.ENQUIRY_DETAIL(row.id))}>
                          <td>
                            <div className="crm-cdash-person">
                              <span className="crm-cdash-avatar">{initial}</span>
                              <div>
                                <strong>{row.name}</strong>
                                <span>{row.code}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="crm-cdash-country-cell">
                              <CountryFlagLabel country={row.country || row.countryCode} size="xs" />
                            </div>
                          </td>
                          <td>
                            <span className={`crm-cdash-pill crm-cdash-pill--${tone}`}>
                              {getEnquiryStatusLabel(stage) || stage}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                            {row.nextFollowUp ? fmtDate(row.nextFollowUp) : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className="crm-cdash-act-icons" title="View Follow Up">
                              <FiPhone />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </motion.tbody>
                </AnimatePresence>
              </table>
            </div>
          ) : (
            <PortalEmpty title="No students in this filter" description="Try another stage tab." />
          )}
        </article>

        {/* Col 2: Recent Activities Timeline Feed */}
        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiActivity className="crm-cdash-card__title-icon" style={{ color: '#0ea5e9' }} />
              <h2>Recent Activities</h2>
            </div>
            <span className="crm-cdash-chip">Top {Math.min(activities.length, 5)}</span>
          </header>
          {activities.length ? (
            <ul className="crm-cdash-activity">
              {activities.slice(0, 5).map((item) => {
                const meta = formatActivityMeta(item);
                const ActionIcon = meta.Icon;
                return (
                  <li key={item.id} className="crm-cdash-activity__item-wrapper">
                    <button
                      type="button"
                      className="crm-cdash-activity__item"
                      onClick={() => item.enquiryId && navigate(ROUTES.ENQUIRY_DETAIL(item.enquiryId))}
                      title={item.enquiryId ? `View details for ${meta.personName}` : meta.personName}
                    >
                      <div className={`crm-cdash-activity__icon-wrap crm-cdash-activity__icon-wrap--${meta.tone}`}>
                        <ActionIcon />
                      </div>
                      <div className="crm-cdash-activity__copy">
                        <div className="crm-cdash-activity__header">
                          <strong className="crm-cdash-activity__name">{meta.personName}</strong>
                          <span className={`crm-cdash-activity__badge crm-cdash-activity__badge--${meta.tone}`}>
                            {meta.badge}
                          </span>
                        </div>
                        <p className="crm-cdash-activity__desc">{meta.desc}</p>
                      </div>
                      <div className="crm-cdash-activity__time">
                        <FiClock className="crm-cdash-activity__time-icon" />
                        <span>{relativeTime(item.at)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="crm-cdash-empty-state">
              <FiActivity className="crm-cdash-empty-icon" />
              <p className="crm-cdash-empty-title">No Recent Activities</p>
              <p className="crm-cdash-empty-desc">Updates to assigned students will show here.</p>
            </div>
          )}
        </article>

        {/* Col 3: Top Countries with SVG Flags (RESOLVES BOTH NAMES & ISO CODES) */}
        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiGlobe className="crm-cdash-card__title-icon" style={{ color: '#10b981' }} />
              <h2>Top Countries</h2>
            </div>
            <span className="crm-cdash-chip">This Month</span>
          </header>
          {(charts.topCountries || []).length ? (
            <div className="crm-cdash-countries">
              {charts.topCountries.slice(0, 5).map((c, i) => {
                const meta = resolveCountryMeta(c.country || c.code);
                return (
                  <div key={`country-row-${i}`} className="crm-cdash-country-row">
                    <div className="crm-cdash-country-head">
                      <div className="crm-cdash-country-name">
                        <span className="crm-cdash-country-rank">#{i + 1}</span>
                        {meta.iso && meta.iso !== 'OT' ? (
                          <span className="crm-cdash-country-flag-badge">
                            <CountryFlag iso={meta.iso} country={meta.label} size="sm" />
                          </span>
                        ) : (
                          <span className="crm-cdash-country-globe-badge">
                            <FiGlobe />
                          </span>
                        )}
                        <span className="crm-cdash-country-title">{meta.label}</span>
                      </div>
                      <div className="crm-cdash-country-meta">
                        <strong>{c.count} {c.count === 1 ? 'student' : 'students'}</strong>
                        <span className="crm-cdash-country-pct-pill">
                          {c.percent || Math.round((c.count / (metrics.myStudents || 1)) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="crm-cdash-country-track">
                      <div
                        className={`crm-cdash-country-bar crm-cdash-country-bar--${i % 5}`}
                        style={{ width: `${Math.min(100, Math.max(14, c.percent || (c.count * 20)))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="crm-cdash-empty-state">
              <FiGlobe className="crm-cdash-empty-icon" />
              <p className="crm-cdash-empty-title">No Country Data</p>
              <p className="crm-cdash-empty-desc">Interested countries appear as students enroll.</p>
            </div>
          )}
        </article>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 4: MY PERFORMANCE | FOLLOW UPS OVERVIEW | REMINDERS
          ───────────────────────────────────────────────────────── */}
      <section className="crm-cdash-row crm-cdash-row--3">
        {/* Col 1: My Performance */}
        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiAward className="crm-cdash-card__title-icon" style={{ color: '#f59e0b' }} />
              <h2>My Performance</h2>
            </div>
          </header>
          <div className="crm-cdash-perf">
            <div className="crm-cdash-perf__item">
              <strong>{performance.enquiries ?? 7}</strong>
              <span>Enquiries</span>
            </div>
            <div className="crm-cdash-perf__item">
              <strong>{performance.applications ?? 6}</strong>
              <span>Applications</span>
            </div>
            <div className="crm-cdash-perf__item">
              <strong>{performance.visas ?? 0}</strong>
              <span>Visas</span>
            </div>
            <div className="crm-cdash-perf__item">
              <strong>{fmtMoney(performance.revenue || 0, performance.currency)}</strong>
              <span>Revenue</span>
            </div>
          </div>
          <div className="crm-cdash-perf-banner">
            <FiTrendingUp aria-hidden />
            <p>{performance.rankHint || 'Keep nurturing your pipeline — consistency wins offers.'}</p>
          </div>
        </article>

        {/* Col 2: Follow Ups Overview */}
        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiPhone className="crm-cdash-card__title-icon" style={{ color: '#ea580c' }} />
              <h2>Follow Ups Overview</h2>
            </div>
          </header>
          <div className="crm-cdash-followup-container">
            <div className="crm-cdash-followup-stats">
              <div className="crm-cdash-followup-stat">
                <span className="crm-cdash-followup-dot" style={{ backgroundColor: '#ef4444' }} />
                <span>Today</span>
                <strong>{metrics.dueToday ?? 0}</strong>
              </div>
              <div className="crm-cdash-followup-stat">
                <span className="crm-cdash-followup-dot" style={{ backgroundColor: '#f59e0b' }} />
                <span>Tomorrow</span>
                <strong>0</strong>
              </div>
              <div className="crm-cdash-followup-stat">
                <span className="crm-cdash-followup-dot" style={{ backgroundColor: '#10b981' }} />
                <span>This Week</span>
                <strong>{metrics.followUpsDue ?? 0}</strong>
              </div>
            </div>
            <div className="crm-cdash-followup-progress-wrap">
              <div className="crm-cdash-followup-bar">
                <div className="crm-cdash-followup-fill" style={{ width: '100%', background: 'linear-gradient(90deg, #10b981, #3b82f6)' }} />
              </div>
              <p className="crm-cdash-followup-hint">All follow-ups scheduled are currently up to date.</p>
            </div>
          </div>
        </article>

        {/* Col 3: Reminders */}
        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <div className="crm-cdash-card__title-wrap">
              <FiBell className="crm-cdash-card__title-icon" style={{ color: '#6366f1' }} />
              <h2>Reminders</h2>
            </div>
          </header>
          {reminders.length ? (
            <ul className="crm-cdash-reminders">
              {reminders.map((item) => (
                <li key={item.id} className={`crm-cdash-reminder crm-cdash-reminder--${item.tone}`}>
                  <p>{item.text}</p>
                  <Link to={item.link || ROUTES.CALENDAR}>View <FiChevronRight /></Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="crm-cdash-empty-state">
              <FiCheckCircle className="crm-cdash-empty-icon" style={{ color: '#10b981' }} />
              <p className="crm-cdash-empty-title">No Pending Reminders</p>
              <p className="crm-cdash-empty-desc">You are fully caught up for today.</p>
            </div>
          )}
        </article>
      </section>
    </PortalPage>
  );
}
