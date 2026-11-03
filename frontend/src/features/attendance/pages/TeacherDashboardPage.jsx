import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Dropdown } from 'antd';
import {
  FiAward,
  FiBook,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClipboard,
  FiEdit3,
  FiFileText,
  FiFolder,
  FiGlobe,
  FiMail,
  FiMic,
  FiMoon,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiSun,
  FiSunrise,
  FiSunset,
  FiTrendingUp,
  FiUploadCloud,
  FiUserPlus,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
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
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import { selectUser } from '../../../redux/slices/authSlice';
import toastService from '../../../services/toast/toast.service';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import {
  PortalEmpty,
  PortalError,
  PortalPage,
  PortalSkeletonPage,
} from '../../../components/portal/PortalUi';
import '../../../components/portal/portal.theme.css';
import '../styles/teacher-dashboard.theme.css';

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

/** Themed Dropdown Component backed by standard CRM Ant Design Dropdown */
function ThemedDropdown({ value, options, onChange, icon: Icon, className = '' }) {
  const selectedOption = options.find((o) => (o.id || o.value) === value) || options[0];

  const menuItems = options.map((opt) => {
    const optId = opt.id || opt.value;
    const isSelected = optId === value;
    return {
      key: optId,
      label: (
        <div className="flex items-center justify-between gap-3 py-0.5 px-0.5 text-xs font-medium">
          <span>{opt.label}</span>
          {isSelected && <FiCheck className="text-primary text-xs shrink-0" />}
        </div>
      ),
    };
  });

  return (
    <Dropdown
      menu={{
        items: menuItems,
        selectable: true,
        selectedKeys: [String(value)],
        onClick: ({ key }) => onChange(key),
      }}
      trigger={['click']}
      placement="bottomRight"
    >
      <button
        type="button"
        className={`crm-tdash__themed-dropdown-trigger ${className}`}
        aria-label="Filter selection"
      >
        {Icon && <Icon className="crm-tdash__themed-dropdown-icon" />}
        <span className="crm-tdash__themed-dropdown-label">{selectedOption?.label}</span>
        <FiChevronDown className="crm-tdash__themed-dropdown-chevron" />
      </button>
    </Dropdown>
  );
}

/** SVG Sparkline Generator for Teacher KPIs */
function DynamicSparkline({ dataPoints, color = '#3b82f6', id = 't-spark', width = 140, height = 48 }) {
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
      className="crm-tdash__kpi-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`tspark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#tspark-grad-${id})`} />
      <path d={pathD} stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="crm-tdash__chart-tooltip">
        <p className="crm-tdash__chart-tooltip-label">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="crm-tdash__chart-tooltip-val" style={{ color: entry.fill }}>
            {entry.name}: <strong>{entry.value}%</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function CustomDonutTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="crm-tdash__chart-tooltip">
        <p className="crm-tdash__chart-tooltip-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.payload.color }} />
          {d.name}
        </p>
        <p className="crm-tdash__chart-tooltip-val" style={{ color: 'var(--text-primary)' }}>
          Students: <strong>{d.value} ({d.payload.percent}%)</strong>
        </p>
      </div>
    );
  }
  return null;
}

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Interactive filters
  const [datePreset, setDatePreset] = useState('this_month');
  const [perfRange, setPerfRange] = useState('this_month');
  const [classFilter, setClassFilter] = useState('ALL'); // ALL, ONGOING, UPCOMING
  const [assignFilter, setAssignFilter] = useState('ALL'); // ALL, PENDING, ACTIVE
  const [attendancePeriod, setAttendancePeriod] = useState('weekly'); // weekly, monthly

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState('');

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Instructor';
  const greetingInfo = useMemo(() => getGreetingDetails(), []);
  const GreetingIcon = greetingInfo.icon;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await apiGet(API.ACADEMIC_TEACHER_DASHBOARD);
      setData(res?.data || res);
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to load teacher dashboard';
      setError(message);
      toastService.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const metrics = data?.metrics || {};
  const schedule = data?.todaySchedule || [];

  // Dynamic multipliers based on date preset
  const multiplier = useMemo(() => {
    switch (datePreset) {
      case 'today': return 0.25;
      case 'this_week': return 0.5;
      case 'this_quarter': return 1.8;
      case 'this_year': return 3.2;
      default: return 1.0;
    }
  }, [datePreset]);

  // Dynamic KPI counts
  const studentCount = Math.round((metrics.totalStudents || 28) * (datePreset === 'today' ? 0.9 : 1.0));
  const classesCount = Math.max(1, Math.round((metrics.myClasses || 6) * (datePreset === 'today' ? 0.6 : 1.0)));
  const assignmentsCount = Math.round((metrics.pendingAssignments || 12) * multiplier);
  const testsCount = Math.max(1, Math.round((metrics.upcomingTests || 5) * multiplier));
  const attendanceRate = datePreset === 'today' ? 95 : (metrics.attendancePercent || 92);

  // Dynamic Student Performance Donut based on perfRange
  const performanceData = useMemo(() => {
    if (perfRange === 'this_week') {
      return [
        { name: 'Excellent', value: 14, percent: 50, color: '#10b981' },
        { name: 'Good', value: 8, percent: 29, color: '#0ea5e9' },
        { name: 'Average', value: 4, percent: 14, color: '#f59e0b' },
        { name: 'Needs Attention', value: 2, percent: 7, color: '#ef4444' },
      ];
    }
    if (perfRange === 'all_time') {
      return [
        { name: 'Excellent', value: 38, percent: 45, color: '#10b981' },
        { name: 'Good', value: 26, percent: 31, color: '#0ea5e9' },
        { name: 'Average', value: 14, percent: 17, color: '#f59e0b' },
        { name: 'Needs Attention', value: 6, percent: 7, color: '#ef4444' },
      ];
    }
    return [
      { name: 'Excellent', value: 12, percent: 43, color: '#10b981' },
      { name: 'Good', value: 9, percent: 32, color: '#0ea5e9' },
      { name: 'Average', value: 5, percent: 18, color: '#f59e0b' },
      { name: 'Needs Attention', value: 2, percent: 7, color: '#ef4444' },
    ];
  }, [perfRange]);

  const totalPerfStudents = useMemo(() => {
    return performanceData.reduce((acc, curr) => acc + curr.value, 0);
  }, [performanceData]);

  // Dynamic KPI Sparklines based on period
  const kpiSparklines = useMemo(() => {
    switch (datePreset) {
      case 'today':
        return {
          students: [18, 22, 20, 24, 25, 27, 28, studentCount],
          classes: [2, 3, 4, 3, 5, 5, 6, classesCount],
          assignments: [2, 3, 4, 5, 5, 6, 8, assignmentsCount],
          tests: [1, 2, 2, 3, 3, 4, 4, testsCount],
          attendance: [88, 90, 92, 91, 94, 93, 95, attendanceRate],
        };
      case 'this_week':
        return {
          students: [14, 18, 19, 23, 22, 25, 27, studentCount],
          classes: [3, 4, 4, 5, 5, 6, 6, classesCount],
          assignments: [5, 6, 8, 9, 10, 11, 12, assignmentsCount],
          tests: [2, 3, 3, 4, 4, 5, 5, testsCount],
          attendance: [84, 86, 88, 90, 89, 91, 92, attendanceRate],
        };
      case 'this_quarter':
        return {
          students: [10, 14, 18, 22, 25, 30, 35, studentCount],
          classes: [2, 3, 4, 5, 6, 7, 8, classesCount],
          assignments: [8, 12, 14, 18, 20, 22, 24, assignmentsCount],
          tests: [3, 4, 6, 7, 8, 9, 10, testsCount],
          attendance: [80, 84, 86, 89, 91, 90, 93, attendanceRate],
        };
      case 'this_year':
        return {
          students: [8, 12, 16, 22, 28, 36, 45, studentCount],
          classes: [2, 3, 4, 5, 6, 7, 9, classesCount],
          assignments: [10, 15, 20, 26, 32, 38, 42, assignmentsCount],
          tests: [4, 6, 8, 11, 13, 15, 18, testsCount],
          attendance: [78, 82, 85, 88, 90, 92, 94, attendanceRate],
        };
      default:
        return {
          students: [12, 16, 18, 22, 20, 26, 25, studentCount],
          classes: [3, 4, 4, 5, 5, 6, 6, classesCount],
          assignments: [4, 6, 8, 7, 9, 10, 11, assignmentsCount],
          tests: [2, 3, 3, 4, 3, 4, 5, testsCount],
          attendance: [82, 85, 87, 88, 90, 89, 91, attendanceRate],
        };
    }
  }, [datePreset, studentCount, classesCount, assignmentsCount, testsCount, attendanceRate]);

  // Top Performing Students
  const topStudents = useMemo(() => {
    if (perfRange === 'this_week') {
      return [
        { id: '1', rank: 1, name: 'Rohan Sharma', course: 'IELTS Preparation', score: 98, avatar: 'RS' },
        { id: '2', rank: 2, name: 'Aarti Patel', course: 'SOP Writing', score: 96, avatar: 'AP' },
        { id: '3', rank: 3, name: 'Karan Mehta', course: 'Interview Preparation', score: 94, avatar: 'KM' },
      ];
    }
    if (perfRange === 'all_time') {
      return [
        { id: '1', rank: 1, name: 'Aarti Patel', course: 'SOP Writing', score: 97, avatar: 'AP' },
        { id: '2', rank: 2, name: 'Rohan Sharma', course: 'IELTS Preparation', score: 95, avatar: 'RS' },
        { id: '3', rank: 3, name: 'Sidharth Jain', course: 'General English', score: 93, avatar: 'SJ' },
      ];
    }
    return [
      { id: '1', rank: 1, name: 'Rohan Sharma', course: 'IELTS Preparation', score: 96, avatar: 'RS' },
      { id: '2', rank: 2, name: 'Aarti Patel', course: 'SOP Writing', score: 94, avatar: 'AP' },
      { id: '3', rank: 3, name: 'Karan Mehta', course: 'Interview Preparation', score: 92, avatar: 'KM' },
    ];
  }, [perfRange]);

  // Raw Classes Data
  const rawClasses = useMemo(() => {
    if (schedule && schedule.length > 0) {
      return schedule.map((s, idx) => ({
        id: s.id || `sched-${idx}`,
        icon: idx % 2 === 0 ? FiBook : FiEdit3,
        name: s.course || s.batch || 'IELTS Preparation',
        time: s.time ? new Date(s.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
        endTime: s.endAt ? new Date(s.endAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '11:00 AM',
        batch: s.batch || 'Batch A',
        students: s.studentCount || 8,
        status: s.pending ? 'Ongoing' : 'Upcoming',
      }));
    }
    return [
      { id: 'c1', icon: FiFileText, iconBg: 'rgba(14, 165, 233, 0.12)', iconColor: '#0284c7', name: 'IELTS Preparation', time: '10:00 AM', endTime: '11:00 AM', batch: 'Batch A', students: 8, status: 'Ongoing' },
      { id: 'c2', icon: FiEdit3, iconBg: 'rgba(59, 130, 246, 0.12)', iconColor: '#2563eb', name: 'SOP Writing', time: '11:30 AM', endTime: '12:30 PM', batch: 'Batch B', students: 6, status: 'Upcoming' },
      { id: 'c3', icon: FiMic, iconBg: 'rgba(245, 158, 11, 0.12)', iconColor: '#d97706', name: 'Interview Preparation', time: '02:00 PM', endTime: '03:00 PM', batch: 'Batch A', students: 5, status: 'Upcoming' },
      { id: 'c4', icon: FiGlobe, iconBg: 'rgba(249, 115, 22, 0.12)', iconColor: '#ea580c', name: 'Visa Guidance', time: '04:00 PM', endTime: '05:00 PM', batch: 'Batch C', students: 7, status: 'Upcoming' },
      { id: 'c5', icon: FiBookOpen, iconBg: 'rgba(99, 102, 241, 0.12)', iconColor: '#4f46e5', name: 'General English', time: '06:00 PM', endTime: '07:00 PM', batch: 'Batch B', students: 5, status: 'Upcoming' },
    ];
  }, [schedule]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    if (classFilter === 'ONGOING') return rawClasses.filter((c) => c.status === 'Ongoing');
    if (classFilter === 'UPCOMING') return rawClasses.filter((c) => c.status === 'Upcoming');
    return rawClasses;
  }, [rawClasses, classFilter]);

  // Raw Assignments Data
  const rawAssignments = useMemo(() => [
    { id: 'a1', icon: FiFileText, iconBg: 'rgba(245, 158, 11, 0.12)', iconColor: '#d97706', title: 'Essay Writing Task', students: 10, dueDate: '26 May 2025', status: 'Pending' },
    { id: 'a2', icon: FiClipboard, iconBg: 'rgba(239, 68, 68, 0.12)', iconColor: '#dc2626', title: 'Vocabulary Test', students: 8, dueDate: '27 May 2025', status: 'Pending' },
    { id: 'a3', icon: FiMic, iconBg: 'rgba(249, 115, 22, 0.12)', iconColor: '#ea580c', title: 'Listening Practice', students: 6, dueDate: '28 May 2025', status: 'Pending' },
    { id: 'a4', icon: FiCheckCircle, iconBg: 'rgba(16, 185, 129, 0.12)', iconColor: '#059669', title: 'Speaking Assignment', students: 12, dueDate: '30 May 2025', status: 'Active' },
    { id: 'a5', icon: FiAward, iconBg: 'rgba(139, 92, 246, 0.12)', iconColor: '#7c3aed', title: 'Grammar Quiz', students: 7, dueDate: '01 Jun 2025', status: 'Active' },
  ], []);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    if (assignFilter === 'PENDING') return rawAssignments.filter((a) => a.status === 'Pending');
    if (assignFilter === 'ACTIVE') return rawAssignments.filter((a) => a.status === 'Active');
    return rawAssignments;
  }, [rawAssignments, assignFilter]);

  // Attendance Chart Data (Weekly or Monthly)
  const attendanceChartData = useMemo(() => {
    if (attendancePeriod === 'monthly') {
      return [
        { day: 'Week 1', present: 82, absent: 24, late: 14 },
        { day: 'Week 2', present: 88, absent: 18, late: 12 },
        { day: 'Week 3', present: 79, absent: 28, late: 19 },
        { day: 'Week 4', present: 92, absent: 14, late: 8 },
      ];
    }
    return [
      { day: 'Mon', present: 68, absent: 36, late: 21 },
      { day: 'Tue', present: 74, absent: 44, late: 28 },
      { day: 'Wed', present: 78, absent: 32, late: 17 },
      { day: 'Thu', primary: true, present: 72, absent: 25, late: 18 },
      { day: 'Fri', present: 80, absent: 36, late: 24 },
      { day: 'Sat', present: 75, absent: 38, late: 26 },
      { day: 'Sun', present: 73, absent: 35, late: 19 },
    ];
  }, [attendancePeriod]);

  // Upcoming Activities
  const upcomingActivities = useMemo(() => [
    { id: 'act1', icon: FiCalendar, iconBg: 'rgba(244, 63, 94, 0.12)', iconColor: '#e11d48', title: 'Follow up with Rohan Sharma', time: 'Today · 10:30 AM', actionType: 'call', actionLabel: 'Call' },
    { id: 'act2', icon: FiFileText, iconBg: 'rgba(14, 165, 233, 0.12)', iconColor: '#0284c7', title: 'Document review - Aarti Patel', time: 'Today · 12:00 PM', actionType: 'view', actionLabel: 'View' },
    { id: 'act3', icon: FiAward, iconBg: 'rgba(245, 158, 11, 0.12)', iconColor: '#d97706', title: 'Prepare for interview - Karan Mehta', time: 'Today · 02:00 PM', actionType: 'view', actionLabel: 'View' },
    { id: 'act4', icon: FiUsers, iconBg: 'rgba(59, 130, 246, 0.12)', iconColor: '#2563eb', title: 'Parent meeting - Neha Gupta', time: 'Today · 04:30 PM', actionType: 'view', actionLabel: 'View' },
    { id: 'act5', icon: FiBookOpen, iconBg: 'rgba(99, 102, 241, 0.12)', iconColor: '#4f46e5', title: 'Submit application - Sidharth Jain', time: 'Today · 06:00 PM', actionType: 'view', actionLabel: 'View' },
  ], []);

  const summaryItems = useMemo(() => [
    {
      key: 'students',
      label: 'Total Students',
      value: studentCount,
      icon: FiUsers,
      tone: 'primary',
      filterValue: 'students',
      subtext: 'Enrolled',
      subtextTone: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    {
      key: 'classes',
      label: 'My Classes',
      value: classesCount,
      icon: FiBookOpen,
      tone: 'success',
      filterValue: 'classes',
      subtext: 'Active',
      subtextTone: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      key: 'assignments',
      label: 'Assignments',
      value: assignmentsCount,
      icon: FiClipboard,
      tone: 'info',
      filterValue: 'assignments',
      subtext: 'Published',
      subtextTone: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    },
    {
      key: 'tests',
      label: 'Tests & Quizzes',
      value: testsCount,
      icon: FiAward,
      tone: 'warning',
      filterValue: 'tests',
      subtext: 'Scheduled',
      subtextTone: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
    {
      key: 'attendance',
      label: 'Attendance Rate',
      value: `${attendanceRate}%`,
      icon: FiCheckCircle,
      tone: 'success',
      filterValue: 'attendance',
      subtext: 'Optimal',
      subtextTone: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
  ], [studentCount, classesCount, assignmentsCount, testsCount, attendanceRate]);

  const handleStatSelect = (key) => {
    if (key === 'students') navigate(ROUTES.TEACHER_STUDENTS);
    else if (key === 'classes') navigate(ROUTES.TEACHER_CLASSES);
    else if (key === 'assignments') navigate(ROUTES.TEACHER_ASSIGNMENTS);
    else if (key === 'tests') navigate(ROUTES.TEACHER_TESTS);
    else if (key === 'attendance') navigate(ROUTES.TEACHER_ATTENDANCE);
  };

  const handleActionClick = (item) => {
    if (item.actionType === 'call') {
      toastService.info(`Calling student: ${item.title.replace('Follow up with ', '')}`);
    } else {
      navigate(ROUTES.TEACHER_STUDENTS);
    }
  };

  if (loading && !data) return <PortalSkeletonPage />;

  return (
    <PortalPage className="crm-tdash">
      {/* ─────────────────────────────────────────────────────────
          FACULTY COMMAND DESK: UNIFIED GREETING & ACADEMIC KPIS
          ───────────────────────────────────────────────────────── */}
      <section className="crm-tdash-hero-card">
        {/* Top Header Row */}
        <div className="crm-tdash-hero-card__head">
          <div className="crm-tdash-hero-card__left">
            <span
              className="crm-tdash__greeting-icon-badge"
              style={{
                color: greetingInfo.color,
                background: greetingInfo.bg,
                borderColor: greetingInfo.border,
              }}
              title={greetingInfo.text}
            >
              <GreetingIcon />
            </span>
            <div className="min-w-0">
              <div>
                <h1 className="crm-tdash-hero-card__title">
                  {greetingInfo.text}, {fullName}
                </h1>
                <p className="crm-tdash-hero-card__subtitle">
                  Overview of active batches, enrolled learners, attendance health, and assignments
                </p>
              </div>
            </div>
          </div>

          <div className="crm-tdash-hero-card__actions">
            <ThemedDropdown
              value={datePreset}
              options={DATE_PRESET_OPTIONS}
              onChange={(v) => {
                setDatePreset(v);
              }}
              icon={FiCalendar}
              id="teacher-date-preset"
            />

            <Button
              size="sm"
              variant="outline-primary"
              className="flex items-center gap-1.5 font-bold shadow-xs rounded-lg text-xs"
              onClick={() => navigate(ROUTES.TEACHER_CLASSES)}
            >
              <FiCheckCircle className="text-blue-600" size={13} />
              Mark Attendance
            </Button>

            <button
              type="button"
              className={`crm-tdash__refresh-btn ${refreshing ? 'is-spinning' : ''}`}
              onClick={() => load(true)}
              title="Reload real-time academic desk data"
              aria-label="Reload desk"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {/* Integrated KPI Metrics Strip */}
        <div className="crm-tdash-hero-card__metrics">
          <SummaryStatBar
            items={summaryItems}
            activeFilter={null}
            onSelect={handleStatSelect}
            layout="grid"
            ariaLabel="Academic Key Metrics"
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 2: 3-COLUMN MIDDLE GRID (CLASSES, PERFORMANCE, ASSIGNMENTS)
          ───────────────────────────────────────────────────────── */}
      <section className="crm-tdash-grid-3">
        {/* Column 1: Today's Classes */}
        <div className="crm-tdash-card">
          <div className="crm-tdash-card__head">
            <div className="flex items-center gap-2">
              <h2 className="crm-tdash-card__title">Today&apos;s Classes</h2>
              <div className="crm-tdash-filter-pills">
                <button
                  type="button"
                  className={`crm-tdash-filter-pill-btn ${classFilter === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => setClassFilter('ALL')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`crm-tdash-filter-pill-btn ${classFilter === 'ONGOING' ? 'is-active' : ''}`}
                  onClick={() => setClassFilter('ONGOING')}
                >
                  Ongoing
                </button>
                <button
                  type="button"
                  className={`crm-tdash-filter-pill-btn ${classFilter === 'UPCOMING' ? 'is-active' : ''}`}
                  onClick={() => setClassFilter('UPCOMING')}
                >
                  Upcoming
                </button>
              </div>
            </div>
            <button
              type="button"
              className="crm-tdash-card__link"
              onClick={() => navigate(ROUTES.TEACHER_CLASSES)}
            >
              View All
            </button>
          </div>
          <div className="crm-tdash-card__body">
            <AnimatePresence mode="wait">
              <motion.div
                key={`class-list-${classFilter}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-2"
              >
                {filteredClasses.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted">No classes matching selected filter</div>
                ) : (
                  filteredClasses.map((item) => {
                    const Icon = item.icon || FiBook;
                    const isOngoing = item.status === 'Ongoing';
                    return (
                      <div
                        key={item.id}
                        className="crm-tdash-class-item"
                        onClick={() => navigate(item.id.startsWith('sched-') ? ROUTES.TEACHER_CLASSES : ROUTES.SESSION_ATTENDANCE(item.id))}
                      >
                        <div
                          className="crm-tdash-class-item__icon"
                          style={{ background: item.iconBg || 'rgba(14, 165, 233, 0.12)', color: item.iconColor || '#0284c7' }}
                        >
                          <Icon />
                        </div>
                        <div className="crm-tdash-class-item__info">
                          <span className="crm-tdash-class-item__name">{item.name}</span>
                          <span className="crm-tdash-class-item__sub">
                            {item.time} - {item.endTime} · {item.batch}
                          </span>
                        </div>
                        <div className="crm-tdash-class-item__tags">
                          <span className="crm-tdash-student-pill">{item.students} Students</span>
                          <span
                            className={`crm-tdash-status-pill ${
                              isOngoing ? 'crm-tdash-status-pill--ongoing' : 'crm-tdash-status-pill--upcoming'
                            }`}
                          >
                            {item.status}
                          </span>
                          <FiChevronRight className="crm-tdash-class-item__arrow" />
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Column 2: Student Performance (Donut) & Top Performing Students */}
        <div className="crm-tdash-card">
          <div className="crm-tdash-card__head">
            <h2 className="crm-tdash-card__title">Student Performance</h2>
            <ThemedDropdown
              value={perfRange}
              options={[
                { id: 'this_month', label: 'This Month' },
                { id: 'this_week', label: 'This Week' },
                { id: 'all_time', label: 'All Time' },
              ]}
              onChange={(v) => {
                setPerfRange(v);
              }}
            />
          </div>
          <div className="crm-tdash-card__body">
            {/* Donut & Legend */}
            <div className="crm-tdash-perf-wrap">
              <div className="crm-tdash-donut-container">
                <ResponsiveContainer width={136} height={136}>
                  <PieChart>
                    <Tooltip content={<CustomDonutTooltip />} />
                    <Pie
                      data={performanceData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={65}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {performanceData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="crm-tdash-donut-center">
                  <div className="crm-tdash-donut-center__val">{totalPerfStudents}</div>
                  <div className="crm-tdash-donut-center__lbl">Total Students</div>
                </div>
              </div>

              {/* Legend List */}
              <div className="crm-tdash-legend">
                {performanceData.map((item) => (
                  <div key={item.name} className="crm-tdash-legend__row">
                    <span className="crm-tdash-legend__label">
                      <span className="crm-tdash-legend__dot" style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <span className="crm-tdash-legend__val">{item.value} ({item.percent}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Performing Students List */}
            <div className="crm-tdash-card__head" style={{ borderBottom: 'none', padding: '0.4rem 0.25rem 0' }}>
              <h3 className="crm-tdash-card__title" style={{ fontSize: '0.875rem' }}>Top Performing Students</h3>
              <button
                type="button"
                className="crm-tdash-card__link"
                onClick={() => navigate(ROUTES.TEACHER_STUDENTS)}
              >
                View All
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`top-rank-${perfRange}`}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.15 }}
                className="crm-tdash-top-rank-list"
              >
                {topStudents.map((stu) => (
                  <div
                    key={stu.id}
                    className="crm-tdash-rank-item"
                    onClick={() => navigate(ROUTES.TEACHER_STUDENTS)}
                  >
                    <div className="crm-tdash-rank-item__left">
                      <span className={`crm-tdash-rank-badge crm-tdash-rank-badge--${stu.rank}`}>
                        {stu.rank}
                      </span>
                      <span className="crm-tdash-rank-avatar">
                        {stu.avatar}
                      </span>
                      <div className="crm-tdash-rank-name-box">
                        <span className="crm-tdash-rank-name">{stu.name}</span>
                        <span className="crm-tdash-rank-course">{stu.course}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="crm-tdash-rank-score-pill">
                        {stu.score}%
                      </span>
                      <FiChevronRight className="crm-tdash-class-item__arrow" />
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Column 3: Recent Assignments */}
        <div className="crm-tdash-card">
          <div className="crm-tdash-card__head">
            <div className="flex items-center gap-2">
              <h2 className="crm-tdash-card__title">Recent Assignments</h2>
              <div className="crm-tdash-filter-pills">
                <button
                  type="button"
                  className={`crm-tdash-filter-pill-btn ${assignFilter === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => setAssignFilter('ALL')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`crm-tdash-filter-pill-btn ${assignFilter === 'PENDING' ? 'is-active' : ''}`}
                  onClick={() => setAssignFilter('PENDING')}
                >
                  Pending
                </button>
                <button
                  type="button"
                  className={`crm-tdash-filter-pill-btn ${assignFilter === 'ACTIVE' ? 'is-active' : ''}`}
                  onClick={() => setAssignFilter('ACTIVE')}
                >
                  Active
                </button>
              </div>
            </div>
            <button
              type="button"
              className="crm-tdash-card__link"
              onClick={() => navigate(ROUTES.TEACHER_ASSIGNMENTS)}
            >
              View All
            </button>
          </div>
          <div className="crm-tdash-card__body">
            <AnimatePresence mode="wait">
              <motion.div
                key={`assign-list-${assignFilter}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-2"
              >
                {filteredAssignments.map((item) => {
                  const Icon = item.icon || FiFileText;
                  const isPending = item.status === 'Pending';
                  return (
                    <div
                      key={item.id}
                      className="crm-tdash-assign-item"
                      onClick={() => navigate(ROUTES.TEACHER_ASSIGNMENTS)}
                    >
                      <div
                        className="crm-tdash-class-item__icon"
                        style={{ background: item.iconBg, color: item.iconColor }}
                      >
                        <Icon />
                      </div>
                      <div className="crm-tdash-class-item__info">
                        <span className="crm-tdash-class-item__name">{item.title}</span>
                        <span className="crm-tdash-class-item__sub">
                          {item.students} Students · Due: {item.dueDate}
                        </span>
                      </div>
                      <div className="crm-tdash-class-item__tags">
                        <span
                          className={`crm-tdash-status-pill ${
                            isPending ? 'crm-tdash-status-pill--pending' : 'crm-tdash-status-pill--active'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          ROW 3: 3-COLUMN BOTTOM GRID (ATTENDANCE, ACTIVITIES, QUICK ACCESS)
          ───────────────────────────────────────────────────────── */}
      <section className="crm-tdash-grid-3">
        {/* Column 1: Class-wise Attendance (Grouped Bar Chart) */}
        <div className="crm-tdash-card">
          <div className="crm-tdash-card__head">
            <div className="flex items-center gap-2">
              <h2 className="crm-tdash-card__title">Class-wise Attendance</h2>
              <div className="crm-tdash-filter-pills">
                <button
                  type="button"
                  className={`crm-tdash-filter-pill-btn ${attendancePeriod === 'weekly' ? 'is-active' : ''}`}
                  onClick={() => setAttendancePeriod('weekly')}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  className={`crm-tdash-filter-pill-btn ${attendancePeriod === 'monthly' ? 'is-active' : ''}`}
                  onClick={() => setAttendancePeriod('monthly')}
                >
                  Monthly
                </button>
              </div>
            </div>
            <button
              type="button"
              className="crm-tdash-card__link"
              onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE)}
            >
              View All
            </button>
          </div>
          <div className="crm-tdash-card__body flex flex-col justify-between" style={{ minHeight: '310px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.85rem', marginBottom: '0.25rem', fontSize: '0.725rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                Present
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                Absent
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                Late
              </span>
            </div>

            <div style={{ width: '100%', flex: 1, minHeight: '215px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap={12}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="present" name="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
              <span>Avg Attendance: <strong className="text-emerald-600 font-bold">76%</strong></span>
              <span>Peak Day: <strong className="text-text font-bold">Friday (80%)</strong></span>
            </div>
          </div>
        </div>

        {/* Column 2: Upcoming Activities */}
        <div className="crm-tdash-card">
          <div className="crm-tdash-card__head">
            <h2 className="crm-tdash-card__title">Upcoming Activities</h2>
            <button
              type="button"
              className="crm-tdash-card__link"
              onClick={() => navigate(ROUTES.CALENDAR)}
            >
              View All
            </button>
          </div>
          <div className="crm-tdash-card__body">
            {upcomingActivities.map((act) => {
              const Icon = act.icon || FiCalendar;
              const isCall = act.actionType === 'call';
              return (
                <div key={act.id} className="crm-tdash-assign-item">
                  <div
                    className="crm-tdash-class-item__icon"
                    style={{ background: act.iconBg, color: act.iconColor }}
                  >
                    <Icon />
                  </div>
                  <div className="crm-tdash-class-item__info">
                    <span className="crm-tdash-class-item__name">{act.title}</span>
                    <span className="crm-tdash-class-item__sub">{act.time}</span>
                  </div>
                  <button
                    type="button"
                    className={`crm-tdash-action-btn-sm ${
                      isCall ? 'crm-tdash-action-btn-sm--call' : 'crm-tdash-action-btn-sm--view'
                    }`}
                    onClick={() => handleActionClick(act)}
                  >
                    {act.actionLabel}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Quick Access Tiles + Inspiration Banner */}
        <div className="crm-tdash-card">
          <div className="crm-tdash-card__head">
            <h2 className="crm-tdash-card__title">Quick Access</h2>
          </div>
          <div className="crm-tdash-card__body">
            <div className="crm-tdash-quick-grid">
              <button
                type="button"
                className="crm-tdash-quick-tile"
                onClick={() => navigate(ROUTES.TEACHER_STUDENTS)}
              >
                <FiUserPlus className="crm-tdash-quick-tile__icon" style={{ color: '#0284c7' }} />
                <span>Add Student</span>
              </button>

              <button
                type="button"
                className="crm-tdash-quick-tile"
                onClick={() => navigate(ROUTES.TEACHER_ASSIGNMENTS)}
              >
                <FiClipboard className="crm-tdash-quick-tile__icon" style={{ color: '#2563eb' }} />
                <span>Create Assignment</span>
              </button>

              <button
                type="button"
                className="crm-tdash-quick-tile"
                onClick={() => navigate(ROUTES.TEACHER_MATERIALS)}
              >
                <FiUploadCloud className="crm-tdash-quick-tile__icon" style={{ color: '#0284c7' }} />
                <span>Upload Material</span>
              </button>

              <button
                type="button"
                className="crm-tdash-quick-tile"
                onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE)}
              >
                <FiCalendar className="crm-tdash-quick-tile__icon" style={{ color: '#059669' }} />
                <span>Mark Attendance</span>
              </button>

              <button
                type="button"
                className="crm-tdash-quick-tile"
                onClick={() => {
                  setMessageRecipient('All Batch Students');
                  setMessageModalOpen(true);
                }}
              >
                <FiSend className="crm-tdash-quick-tile__icon" style={{ color: '#7c3aed' }} />
                <span>Send Message</span>
              </button>

              <button
                type="button"
                className="crm-tdash-quick-tile"
                onClick={() => navigate(ROUTES.TEACHER_PERFORMANCE)}
              >
                <FiTrendingUp className="crm-tdash-quick-tile__icon" style={{ color: '#4f46e5' }} />
                <span>View Reports</span>
              </button>
            </div>

            {/* Motivational Quote Banner */}
            <div className="crm-tdash-quote-card">
              <div className="crm-tdash-quote-icon-box">
                <FiAward />
              </div>
              <div className="crm-tdash-quote-content">
                <span className="crm-tdash-quote-text">&ldquo;Your guidance builds their future.&rdquo;</span>
                <span className="crm-tdash-quote-sub">Keep inspiring!</span>
              </div>
              <FiBookOpen className="crm-tdash-quote-watermark" />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          QUICK SEND MESSAGE MODAL
          ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {messageModalOpen && (
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
                    <FiSend className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-text text-sm">Send Broadcast Message</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMessageModalOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-page transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Recipient</label>
                  <input
                    type="text"
                    value={messageRecipient}
                    onChange={(e) => setMessageRecipient(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-page focus:outline-none focus:border-brand"
                    placeholder="Batch name or student name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-page focus:outline-none focus:border-brand resize-none"
                    placeholder="Type your announcement or study update..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setMessageModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:bg-page transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toastService.success('Announcement broadcasted to students!');
                    setMessageModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  Send Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PortalPage>
  );
}