import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  FiMail,
  FiSend,
  FiRefreshCw,
  FiEye,
  FiX,
  FiCode,
  FiUser,
  FiUsers,
  FiLayers,
  FiAtSign,
  FiSearch,
  FiTrash2,
  FiRepeat,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet, apiPut, apiPost, apiDelete } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Lifecycle Templates' },
  { id: 'Student Journey', label: 'Student Journey' },
  { id: 'Billing & Invoices', label: 'Billing & Invoices' },
  { id: 'Admissions & Visa', label: 'Admissions & Visa' },
  { id: 'Operations', label: 'Operations' },
];

const PRESET_MESSAGES = [
  {
    label: 'Custom Blank Email',
    subject: '',
    message: '',
    ctaText: '',
    ctaUrl: '',
  },
  {
    label: 'Campus Orientation & Document Submission',
    subject: 'Important Notice: Campus Orientation & Document Verification Desk',
    message:
      'We are pleased to invite you to our upcoming Orientation and Document Verification Desk at 3ni InfoTech.\n\nPlease carry your original academic marksheets, degree certificates, passport copies, and language test scorecards.\n\nOur advisory team will be present to review university conditional offers and finalize visa lodging requirements.',
    ctaText: 'View Orientation Details',
    ctaUrl: 'https://www.3niinfotech.com',
  },
  {
    label: 'Upcoming University Admissions Fair',
    subject: 'Invitation: Global University Admissions Fair & Spot Assessment',
    message:
      'Representatives from premier Canadian, UK, and Australian institutions are visiting 3ni InfoTech for spot assessments and conditional scholarship evaluations.\n\nAttend with your academic transcripts to receive on-spot eligibility checks and fee waivers.',
    ctaText: 'Register for Admissions Fair',
    ctaUrl: 'https://www.3niinfotech.com',
  },
  {
    label: 'Pre-Departure & Visa Briefing',
    subject: 'Pre-Departure Briefing & Foreign Exchange Advisory Session',
    message:
      'Congratulations on your study visa grant! We are hosting a mandatory Pre-Departure Briefing covering immigration checkpoint guidelines, student accommodation, SIM cards, and student forex accounts.\n\nPlease join on time.',
    ctaText: 'Pre-Departure Checklist',
    ctaUrl: 'https://www.3niinfotech.com',
  },
  {
    label: 'Internal Staff Operations Notice',
    subject: 'Staff Memo: Application Lodging & Visa Deadlines Review',
    message:
      'All counselors, teachers, and visa executives are requested to complete pending milestone updates in the CRM before the end of the day.\n\nEnsure that all student documentation and intake notes are completely synced.',
    ctaText: 'Open CRM Tasks',
    ctaUrl: 'https://www.3niinfotech.com',
  },
];

export default function EmailTemplatesWorkspace() {
  // Top Workspace Tab: 'templates' | 'history'
  const [activeMainTab, setActiveMainTab] = useState('templates');

  const [smtpStatus, setSmtpStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Override configuration state (Where test emails go)
  const [overrideTo, setOverrideTo] = useState('kachhadiyadarshil2@gmail.com');
  const [overrideActive, setOverrideActive] = useState(true);
  const [savingOverride, setSavingOverride] = useState(false);

  // Active Template Preview Modal
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [testingCode, setTestingCode] = useState(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  // History State
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [viewingHistoryItem, setViewingHistoryItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── Compose & Send Modal State ──
  const [composeOpen, setComposeOpen] = useState(false);
  const [directory, setDirectory] = useState({ students: [], roles: [], staff: [], counts: { students: 0, staff: 0 } });
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // High-Level Channel: 'STUDENTS' | 'STAFF' | 'CUSTOM'
  const [targetChannel, setTargetChannel] = useState('STUDENTS');

  // Students Channel Sub-scope: 'ALL' | 'SINGLE'
  const [studentScope, setStudentScope] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Staff Channel Sub-scope: Role + Member
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [staffScope, setStaffScope] = useState('ALL_ROLE'); // 'ALL_ROLE' | 'SINGLE_MEMBER'
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Custom Direct Email Channel
  const [customEmail, setCustomEmail] = useState('');

  // Content
  const [composeSubject, setComposeSubject] = useState('Important Update from 3ni InfoTech');
  const [composeMessage, setComposeMessage] = useState(
    'We are writing to share an important advisory regarding your overseas application and academic schedule.\n\nPlease review your portal updates or reach out to your assigned counselor if you require any assistance.'
  );
  const [includeCta, setIncludeCta] = useState(false);
  const [ctaText, setCtaText] = useState('Visit Student Portal');
  const [ctaUrl, setCtaUrl] = useState('https://www.3niinfotech.com');

  const [composePreviewHtml, setComposePreviewHtml] = useState('');
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [sendingCompose, setSendingCompose] = useState(false);
  const [composeTab, setComposeTab] = useState('split'); // 'split' | 'editor' | 'preview'

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiGet('/email/status');
      if (res?.data) {
        setSmtpStatus(res.data);
        const savedTo = res.data.override?.overrideEmail || 'kachhadiyadarshil2@gmail.com';
        setOverrideTo(savedTo);
        setOverrideActive(res.data.override?.enabled ?? true);
      }
    } catch (e) {
      console.error('Failed to fetch SMTP status:', e);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet('/email/templates');
      if (res?.data) {
        setTemplates(res.data);
      }
    } catch {
      toastService.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDirectory = useCallback(async () => {
    setLoadingDirectory(true);
    try {
      const res = await apiGet('/email/recipients');
      if (res?.data) {
        setDirectory(res.data);
        if (res.data.students?.length && !selectedStudentId) {
          setSelectedStudentId(res.data.students[0].id);
        }
        if (res.data.roles?.length && !selectedRoleId) {
          setSelectedRoleId(res.data.roles[0].id);
        }
        if (res.data.staff?.length && !selectedStaffId) {
          setSelectedStaffId(res.data.staff[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load recipient directory', err);
    } finally {
      setLoadingDirectory(false);
    }
  }, [selectedStudentId, selectedRoleId, selectedStaffId]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiGet('/email/history');
      if (res?.data) {
        setHistoryLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load email history', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchTemplates();
    fetchHistory();
  }, [fetchStatus, fetchTemplates, fetchHistory]);

  const [searchParams] = useSearchParams();

  // Listen for sidebar click or query param: ?compose=true
  useEffect(() => {
    const isCompose = searchParams.get('compose') === 'true' || searchParams.get('compose') === '1';
    if (isCompose) {
      setComposeOpen(true);
      fetchDirectory();
    }
  }, [searchParams, fetchDirectory]);

  // Listen for custom event when sidebar item is clicked directly
  useEffect(() => {
    const handleOpen = () => {
      setComposeOpen(true);
      fetchDirectory();
    };
    window.addEventListener('crm:open-email-compose', handleOpen);
    return () => window.removeEventListener('crm:open-email-compose', handleOpen);
  }, [fetchDirectory]);

  const handleCloseCompose = () => {
    setComposeOpen(false);
    const params = new URLSearchParams(window.location.search);
    if (params.has('compose')) {
      params.delete('compose');
      const newQuery = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState(null, '', newQuery);
    }
  };

  const handleSaveOverride = async () => {
    setSavingOverride(true);
    try {
      await apiPut('/email/settings', {
        overrideEmail: overrideTo.trim(),
        enabled: overrideActive,
      });
      toastService.success(`Safe test routing updated to ${overrideTo.trim()}`);
      fetchStatus();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to update test address');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleOpenEditor = async (tpl) => {
    setActiveTemplate(tpl);
    setEditSubject(tpl.subject || '');
    setEditIsActive(tpl.isActive ?? true);
    setShowCodeEditor(false);
    setPreviewHtml('<div style="padding: 40px; text-align: center; color: #64748b; font-family: sans-serif;">Loading email preview...</div>');

    try {
      const res = await apiGet(`/email/templates/${tpl.code}`);
      const tplData = res?.data?.template;
      const prevHtml = res?.data?.preview?.html || res?.data?.previewHtml || '';
      if (tplData) {
        setEditSubject(tplData.subject || tpl.subject);
        setEditBody(tplData.body || prevHtml);
        setEditIsActive(tplData.isActive ?? true);
      }
      setPreviewHtml(prevHtml);
    } catch {
      toastService.error('Failed to load template content');
      setPreviewHtml('<div style="padding: 40px; text-align: center; color: #ef4444; font-family: sans-serif;">Preview unavailable</div>');
    }
  };

  const handleSaveTemplate = async () => {
    if (!activeTemplate) return;
    setSavingTemplate(true);
    try {
      await apiPut(`/email/templates/${activeTemplate.code}`, {
        subject: editSubject,
        body: editBody,
        isActive: editIsActive,
      });
      toastService.success(`Template saved successfully!`);
      setActiveTemplate(null);
      fetchTemplates();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to update template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSendTest = async (templateCode) => {
    setTestingCode(templateCode);
    const target = (overrideTo || 'kachhadiyadarshil2@gmail.com').trim();
    try {
      const res = await apiPost(`/email/templates/${templateCode}/test-send`, {
        to: target,
        recipient: target,
        subject: activeTemplate?.code === templateCode ? editSubject : undefined,
        body: activeTemplate?.code === templateCode && showCodeEditor ? editBody : undefined,
      });
      const deliveredTo = res?.data?.targetEmail || target;
      toastService.success(`Live test email sent to ${deliveredTo}!`);
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to send test email');
    } finally {
      setTestingCode(null);
    }
  };

  // ── Compose Modal Handlers ──
  const handleOpenCompose = () => {
    setComposeOpen(true);
    fetchDirectory();
  };

  // Staff filtered by the currently chosen role
  const staffInSelectedRole = useMemo(() => {
    if (!selectedRoleId) return directory.staff;
    return directory.staff.filter((s) => s.roleId === selectedRoleId);
  }, [directory.staff, selectedRoleId]);

  // When selected role changes, default staff member
  useEffect(() => {
    if (staffInSelectedRole.length > 0) {
      if (!staffInSelectedRole.some((s) => s.id === selectedStaffId)) {
        setSelectedStaffId(staffInSelectedRole[0].id);
      }
    }
  }, [selectedRoleId, staffInSelectedRole, selectedStaffId]);

  // Resolved dynamic audience descriptor
  const audienceSummary = useMemo(() => {
    if (targetChannel === 'STUDENTS') {
      if (studentScope === 'ALL') {
        return {
          type: 'ALL_STUDENTS',
          label: `All Active Students (${directory.counts.students} recipients)`,
          previewName: 'Student',
          count: directory.counts.students,
        };
      }
      const s = directory.students.find((item) => item.id === selectedStudentId);
      return {
        type: 'SINGLE_STUDENT',
        label: s ? `${s.name} (${s.email})` : 'Select Student',
        previewName: s ? s.name : 'Student',
        count: 1,
      };
    }

    if (targetChannel === 'STAFF') {
      const roleObj = directory.roles.find((r) => r.id === selectedRoleId);
      const roleName = roleObj?.name || 'Staff';

      if (staffScope === 'ALL_ROLE') {
        const count = roleObj?.userCount || staffInSelectedRole.length || 1;
        return {
          type: 'ROLE_STAFF',
          label: `All ${roleName}s (${count} members)`,
          previewName: `${roleName} Team Member`,
          count,
        };
      }
      const u = staffInSelectedRole.find((item) => item.id === selectedStaffId);
      return {
        type: 'SINGLE_STAFF',
        label: u ? `${u.name} (${u.roleName} • ${u.email})` : 'Select Staff Member',
        previewName: u ? u.name : 'Staff Member',
        count: 1,
      };
    }

    if (targetChannel === 'CUSTOM') {
      return {
        type: 'CUSTOM_EMAIL',
        label: customEmail ? customEmail.trim() : 'Enter direct email',
        previewName: 'Valued Recipient',
        count: 1,
      };
    }

    return { type: 'CUSTOM_EMAIL', label: '', previewName: 'Recipient', count: 1 };
  }, [
    targetChannel,
    studentScope,
    selectedStudentId,
    selectedRoleId,
    staffScope,
    selectedStaffId,
    customEmail,
    directory,
    staffInSelectedRole,
  ]);

  // Live preview update
  const updateComposePreview = useCallback(async () => {
    setGeneratingPreview(true);
    try {
      const res = await apiPost('/email/preview-custom', {
        subject: composeSubject,
        message: composeMessage,
        ctaText: includeCta ? ctaText : null,
        ctaUrl: includeCta ? ctaUrl : null,
        recipientName: audienceSummary.previewName,
      });
      if (res?.data?.previewHtml) {
        setComposePreviewHtml(res.data.previewHtml);
      }
    } catch {
      // preview error handled
    } finally {
      setGeneratingPreview(false);
    }
  }, [composeSubject, composeMessage, includeCta, ctaText, ctaUrl, audienceSummary.previewName]);

  useEffect(() => {
    if (!composeOpen) return;
    const timer = setTimeout(() => {
      updateComposePreview();
    }, 280);
    return () => clearTimeout(timer);
  }, [composeOpen, composeSubject, composeMessage, includeCta, ctaText, ctaUrl, audienceSummary.previewName, updateComposePreview]);

  // Dynamic Page Title in Email Hub
  useEffect(() => {
    if (composeOpen) {
      document.title = 'Compose & Send Email | 3ni InfoTech';
    } else if (activeTemplate) {
      document.title = `${activeTemplate.name} — Preview | 3ni InfoTech`;
    } else if (activeMainTab === 'history') {
      document.title = 'Sent Email History & Logs | 3ni InfoTech';
    } else {
      document.title = 'Email Lifecycle Templates | 3ni InfoTech';
    }
  }, [composeOpen, activeTemplate, activeMainTab]);

  // Filter students in dropdown
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return directory.students;
    const q = studentSearch.toLowerCase();
    return directory.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q)
    );
  }, [directory.students, studentSearch]);

  const handleApplyPreset = (preset) => {
    if (!preset) return;
    setComposeSubject(preset.subject);
    setComposeMessage(preset.message);
    if (preset.ctaText) {
      setIncludeCta(true);
      setCtaText(preset.ctaText);
      setCtaUrl(preset.ctaUrl || 'https://www.3niinfotech.com');
    } else {
      setIncludeCta(false);
    }
  };

  const handleSendCustomEmail = async () => {
    if (!composeSubject.trim()) {
      toastService.error('Please enter an email subject');
      return;
    }
    if (!composeMessage.trim()) {
      toastService.error('Please write an email message');
      return;
    }

    const payload = {
      audienceType: audienceSummary.type,
      studentId: audienceSummary.type === 'SINGLE_STUDENT' ? selectedStudentId : undefined,
      roleId: audienceSummary.type === 'ROLE_STAFF' ? selectedRoleId : undefined,
      staffId: audienceSummary.type === 'SINGLE_STAFF' ? selectedStaffId : undefined,
      customEmail: audienceSummary.type === 'CUSTOM_EMAIL' ? customEmail : undefined,
      subject: composeSubject,
      message: composeMessage,
      ctaText: includeCta ? ctaText : null,
      ctaUrl: includeCta ? ctaUrl : null,
    };

    setSendingCompose(true);
    try {
      const res = await apiPost('/email/dispatch-custom', payload);

      const count = res?.data?.successCount || 1;
      const isOverridden = res?.data?.overrideActive;
      const targetBox = res?.data?.overrideEmail || overrideTo;

      if (isOverridden) {
        toastService.success(
          `Dispatched ${count} email(s)! (Safe Test Override: delivered to ${targetBox})`
        );
      } else {
        toastService.success(`Dispatched email successfully to ${count} recipient(s)!`);
      }

      setComposeOpen(false);
      fetchHistory(); // Refresh history table immediately
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to dispatch email');
    } finally {
      setSendingCompose(false);
    }
  };

  // ── Edit & Resend From History ──
  const handleEditAndResend = (log) => {
    setComposeSubject(log.subject || '');
    setComposeMessage(log.message || '');
    if (log.ctaText) {
      setIncludeCta(true);
      setCtaText(log.ctaText);
      setCtaUrl(log.ctaUrl || 'https://www.3niinfotech.com');
    } else {
      setIncludeCta(false);
    }

    // Set audience channels
    if (log.audienceType === 'ALL_STUDENTS') {
      setTargetChannel('STUDENTS');
      setStudentScope('ALL');
    } else if (log.audienceType === 'SINGLE_STUDENT') {
      setTargetChannel('STUDENTS');
      setStudentScope('SINGLE');
      if (log.student?.id) setSelectedStudentId(log.student.id);
    } else if (log.audienceType === 'ROLE_STAFF') {
      setTargetChannel('STAFF');
      setStaffScope('ALL_ROLE');
    } else if (log.audienceType === 'SINGLE_STAFF') {
      setTargetChannel('STAFF');
      setStaffScope('SINGLE_MEMBER');
    } else {
      setTargetChannel('CUSTOM');
      if (log.recipients?.[0]?.email) setCustomEmail(log.recipients[0].email);
    }

    setComposeOpen(true);
    fetchDirectory();
  };

  // ── Delete History Log ──
  const handleDeleteHistory = async (id) => {
    setDeletingId(id);
    try {
      await apiDelete(`/email/history/${id}`);
      toastService.success('Email record removed from log');
      setHistoryLogs((prev) => prev.filter((item) => item.id !== id));
      if (viewingHistoryItem?.id === id) setViewingHistoryItem(null);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return historyLogs;
    const q = historySearch.toLowerCase();
    return historyLogs.filter(
      (h) =>
        (h.subject && h.subject.toLowerCase().includes(q)) ||
        (h.sender?.name && h.sender.name.toLowerCase().includes(q)) ||
        (h.audienceLabel && h.audienceLabel.toLowerCase().includes(q))
    );
  }, [historyLogs, historySearch]);

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto px-4 sm:px-4 py-5 space-y-5 mx-auto">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiMail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Email Communications Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated lifecycle notifications, role announcements, targeted student dispatches, and audit history.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* SMTP Status Pill */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Hostinger SMTP Active
          </span>

          {/* Test Email Target Input */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pl-2">
              Send Tests To:
            </span>
            <input
              type="email"
              value={overrideTo}
              onChange={(e) => setOverrideTo(e.target.value)}
              placeholder="kachhadiyadarshil2@gmail.com"
              className="text-xs px-2.5 py-1 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 font-mono w-52 focus:outline-none focus:border-primary-500"
            />
            <button
              type="button"
              onClick={handleSaveOverride}
              disabled={savingOverride}
              className="px-3 py-1 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {savingOverride ? '...' : 'Save'}
            </button>
          </div>

          {/* Primary Action Button: Compose Email */}
          <button
            type="button"
            onClick={handleOpenCompose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <FiSend className="w-3.5 h-3.5" />
            Compose Email
          </button>
        </div>
      </div>

      {/* ── Main Section Tabs: Templates vs Sent History ── */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainTab('templates')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'templates'
                ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <FiLayers className="w-3.5 h-3.5" />
            Lifecycle Templates
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeMainTab === 'templates'
                ? 'bg-blue-700/90 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {templates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMainTab('history');
              fetchHistory();
            }}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMainTab === 'history'
                ? 'bg-blue-600 text-white shadow-xs dark:bg-blue-600 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
            }`}
          >
            <FiClock className="w-3.5 h-3.5" />
            Sent History &amp; Logs
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeMainTab === 'history'
                ? 'bg-blue-700/90 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {historyLogs.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchTemplates();
            fetchHistory();
          }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: SYSTEM LIFECYCLE TEMPLATES ─────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'templates' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORY_TABS.map((tab) => {
              const count =
                tab.id === 'all'
                  ? templates.length
                  : templates.filter((t) => t.category === tab.id).length;
              const isSelected = selectedCategory === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <ContentLoader message="Loading email templates..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
              {filteredTemplates.map((tpl) => {
                const isTesting = testingCode === tpl.code;
                return (
                  <div
                    key={tpl.code}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {tpl.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
                            {tpl.name}
                          </h3>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tpl.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {tpl.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>

                      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 truncate">
                        <strong className="text-slate-400 dark:text-slate-500">Subject:</strong> {tpl.subject}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenEditor(tpl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <FiEye className="w-3.5 h-3.5 text-slate-500" />
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendTest(tpl.code)}
                        disabled={isTesting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <FiSend className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
                        {isTesting ? 'Sending...' : 'Send Test'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: SENT HISTORY & DISPATCH LOGS ───────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeMainTab === 'history' && (
        <div className="space-y-3">
          {/* History Search & Controls */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <FiSearch className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search history by subject, sender, or audience..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <span className="text-xs text-slate-500">
              Showing <strong>{filteredHistory.length}</strong> sent logs
            </span>
          </div>

          {loadingHistory ? (
            <ContentLoader message="Loading sent email logs..." />
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <FiMail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Email History Records Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Emails composed and dispatched to students or staff will be permanently logged here with sender info, delivery status, and re-send capabilities.
              </p>
              <button
                type="button"
                onClick={handleOpenCompose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                <FiSend className="w-3.5 h-3.5" />
                Compose First Email
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Date &amp; Time</th>
                      <th className="py-2.5 px-3.5">Sender (Staff)</th>
                      <th className="py-2.5 px-3.5">Target Audience</th>
                      <th className="py-2.5 px-3.5">Subject</th>
                      <th className="py-2.5 px-3.5">Status</th>
                      <th className="py-2.5 px-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {filteredHistory.map((item) => {
                      const isDeleting = deletingId === item.id;
                      const dateStr = new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {dateStr}
                          </td>

                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {item.sender?.name || 'Admin'}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                {item.sender?.role || 'Staff'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3.5">
                            <span className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded text-[11px]">
                              {item.audienceLabel || 'Direct Email'}
                            </span>
                          </td>

                          <td className="py-3 px-3.5 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                            {item.subject}
                          </td>

                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              Delivered ({item.successCount || 1})
                            </span>
                          </td>

                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setViewingHistoryItem(item)}
                                title="View Email Details"
                                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                              >
                                <FiEye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit & Resend */}
                              <button
                                type="button"
                                onClick={() => handleEditAndResend(item)}
                                title="Edit & Resend"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                              >
                                <FiRepeat className="w-3 h-3" />
                                Edit &amp; Resend
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => handleDeleteHistory(item.id)}
                                disabled={isDeleting}
                                title="Delete from log"
                                className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── COMPOSE & SEND EMAIL MODAL (CLEAN & STREAMLINED) ──────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {composeOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[94vh]">
              {/* Modal Header */}
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900/50">
                    <FiSend className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Compose Email
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Targeted notifications for students, entire batches, or staff teams.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Switcher */}
                  <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setComposeTab('split')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                        composeTab === 'split'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Side-by-Side
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposeTab('editor')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                        composeTab === 'editor'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposeTab('preview')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                        composeTab === 'preview'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Preview
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseCompose}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 min-h-0 overflow-hidden flex flex-row divide-x divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                {/* ── LEFT PANE: Form Controls ── */}
                {(composeTab === 'split' || composeTab === 'editor') && (
                  <div
                    className={`${
                      composeTab === 'split' ? 'w-full md:w-1/2' : 'w-full max-w-3xl mx-auto'
                    } p-4 space-y-3.5 overflow-y-auto`}
                  >
                    {/* Audience Channel Pill Switcher */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Recipient Channel:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTargetChannel('STUDENTS')}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            targetChannel === 'STUDENTS'
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <FiUsers className="w-3.5 h-3.5 text-blue-500" />
                          <span>Students</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTargetChannel('STAFF')}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            targetChannel === 'STAFF'
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <FiLayers className="w-3.5 h-3.5 text-blue-500" />
                          <span>Staff Team</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTargetChannel('CUSTOM')}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            targetChannel === 'CUSTOM'
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <FiAtSign className="w-3.5 h-3.5 text-blue-500" />
                          <span>Custom Email</span>
                        </button>
                      </div>
                    </div>

                    {/* CHANNEL 1: STUDENTS TARGET PICKER */}
                    {targetChannel === 'STUDENTS' && (
                      <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStudentScope('ALL')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              studentScope === 'ALL'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            All Students ({directory.counts.students})
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentScope('SINGLE')}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              studentScope === 'SINGLE'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Specific Student
                          </button>
                        </div>

                        {studentScope === 'SINGLE' && (
                          <div className="space-y-1.5 pt-1">
                            <div className="relative">
                              <FiSearch className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search by name, student ID, or email..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <select
                              value={selectedStudentId}
                              onChange={(e) => setSelectedStudentId(e.target.value)}
                              className="w-full text-xs p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium"
                            >
                              <option value="">-- Choose Student ({filteredStudents.length} matches) --</option>
                              {filteredStudents.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.studentCode}) • {s.email}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CHANNEL 2: STAFF & ROLE TARGET PICKER */}
                    {targetChannel === 'STAFF' && (
                      <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            1. Select Staff Role:
                          </label>
                          <select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="w-full text-xs p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium"
                          >
                            <option value="">-- Choose Staff Role --</option>
                            {directory.roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.userCount} member{r.userCount > 1 ? 's' : ''})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 pt-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            2. Member Scope:
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setStaffScope('ALL_ROLE')}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                staffScope === 'ALL_ROLE'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              All in this Role ({staffInSelectedRole.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setStaffScope('SINGLE_MEMBER')}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                staffScope === 'SINGLE_MEMBER'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              Specific Member
                            </button>
                          </div>

                          {staffScope === 'SINGLE_MEMBER' && (
                            <div className="pt-1.5">
                              <select
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                className="w-full text-xs p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium"
                              >
                                <option value="">-- Choose Staff Member ({staffInSelectedRole.length}) --</option>
                                {staffInSelectedRole.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name} • {u.email}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CHANNEL 3: CUSTOM DIRECT EMAIL */}
                    {targetChannel === 'CUSTOM' && (
                      <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Recipient Email Address:
                        </label>
                        <input
                          type="email"
                          placeholder="client@example.com, parent@mail.com"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Quick Template Starters */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Template Starters (Optional):
                        </label>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold truncate max-w-[200px]">
                          Target: {audienceSummary.label}
                        </span>
                      </div>
                      <select
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          if (!isNaN(idx) && PRESET_MESSAGES[idx]) {
                            handleApplyPreset(PRESET_MESSAGES[idx]);
                          }
                        }}
                        defaultValue=""
                        className="w-full text-xs p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        <option value="" disabled>
                          -- Choose a preset message starter --
                        </option>
                        {PRESET_MESSAGES.map((preset, idx) => (
                          <option key={idx} value={idx}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Line */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Subject Line:
                      </label>
                      <input
                        type="text"
                        value={composeSubject}
                        onChange={(e) => setComposeSubject(e.target.value)}
                        placeholder="e.g. Important Notice: Upcoming Campus Orientation"
                        className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    {/* Email Message */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        Message Content:
                      </label>
                      <textarea
                        rows={4}
                        value={composeMessage}
                        onChange={(e) => setComposeMessage(e.target.value)}
                        placeholder="Write your email message here (paragraphs supported)..."
                        className="w-full text-xs p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Action Button CTA */}
                    <div className="p-2.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={includeCta}
                          onChange={(e) => setIncludeCta(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Include Action Button (Link)
                      </label>

                      {includeCta && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <input
                            type="text"
                            value={ctaText}
                            onChange={(e) => setCtaText(e.target.value)}
                            placeholder="Button Label"
                            className="text-xs px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                          />
                          <input
                            type="url"
                            value={ctaUrl}
                            onChange={(e) => setCtaUrl(e.target.value)}
                            placeholder="https://..."
                            className="text-xs px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── RIGHT PANE: Live Email Preview ── */}
                {(composeTab === 'split' || composeTab === 'preview') && (
                  <div
                    className={`${
                      composeTab === 'split' ? 'w-full md:w-1/2' : 'w-full'
                    } p-4 flex flex-col bg-slate-100 dark:bg-black/40 min-h-[420px]`}
                  >
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FiEye className="w-3.5 h-3.5 text-blue-600" />
                        Live Inbox Preview (Official 3ni Layout)
                      </span>
                      {generatingPreview && (
                        <span className="text-[10px] text-slate-400 animate-pulse">
                          Updating preview...
                        </span>
                      )}
                    </div>

                    <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col min-h-[400px]">
                      <iframe
                        title="Custom Email Preview"
                        srcDoc={
                          composePreviewHtml ||
                          '<div style="padding:40px;text-align:center;color:#64748b;font-family:sans-serif;">Generating preview...</div>'
                        }
                        className="w-full flex-1 border-0 min-h-[400px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0">
                <div className="text-xs">
                  {overrideActive ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Safe Test Mode: Routed to <strong>{overrideTo}</strong>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Live Delivery: Sending directly to recipient mailbox
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleCloseCompose}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSendCustomEmail}
                    disabled={sendingCompose}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <FiSend className={`w-3.5 h-3.5 ${sendingCompose ? 'animate-bounce' : ''}`} />
                    {sendingCompose
                      ? 'Dispatching...'
                      : `Send to ${audienceSummary.label}`}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── VIEW SENT EMAIL DETAILS MODAL (FROM HISTORY) ─────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {viewingHistoryItem &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[90vh]">
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Dispatched Email Record
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {viewingHistoryItem.subject}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingHistoryItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sender:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {viewingHistoryItem.sender?.name} ({viewingHistoryItem.sender?.role})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dispatched At:</span>
                    <strong className="text-slate-800 dark:text-slate-200">
                      {new Date(viewingHistoryItem.createdAt).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Audience:</span>
                    <strong className="text-blue-600">
                      {viewingHistoryItem.audienceLabel}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Delivery:</span>
                    <strong className="text-emerald-600">
                      {viewingHistoryItem.successCount} of {viewingHistoryItem.recipientCount} successful
                    </strong>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Message Body:
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {viewingHistoryItem.message}
                  </div>
                </div>

                {viewingHistoryItem.ctaText && (
                  <div className="text-xs">
                    <span className="text-slate-400">Action Button: </span>
                    <span className="font-semibold text-blue-600">{viewingHistoryItem.ctaText}</span>
                    <span className="text-slate-400"> ({viewingHistoryItem.ctaUrl})</span>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleEditAndResend(viewingHistoryItem);
                    setViewingHistoryItem(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  <FiRepeat className="w-3.5 h-3.5" />
                  Edit &amp; Resend This Email
                </button>

                <button
                  type="button"
                  onClick={() => setViewingHistoryItem(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── FOCUSED LIVE TEMPLATE PREVIEW MODAL ───────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTemplate &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh]">
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {activeTemplate.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {activeTemplate.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 cursor-pointer"
                  >
                    <FiCode className="w-3.5 h-3.5" />
                    {showCodeEditor ? 'Show Preview' : 'Edit Subject'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplate(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Optional Subject & Variable Editor */}
              {showCodeEditor && (
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subject Line:
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Variables: {activeTemplate.variables?.map((v) => `{{${v}}}`).join(' ')}
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      disabled={savingTemplate}
                      className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {savingTemplate ? 'Saving...' : 'Save Subject'}
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Body: Hero Live Email Preview */}
              <div className="flex-1 p-3 sm:p-4 bg-slate-100 dark:bg-black/50 overflow-y-auto flex flex-col min-h-[500px]">
                <iframe
                  title="Live Email Preview"
                  srcDoc={previewHtml}
                  className="w-full flex-1 min-h-[500px] rounded-lg bg-white shadow-xs border border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendTest(activeTemplate.code)}
                  disabled={testingCode === activeTemplate.code}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FiSend className={`w-3.5 h-3.5 ${testingCode === activeTemplate.code ? 'animate-bounce' : ''}`} />
                  {testingCode === activeTemplate.code ? 'Sending to Gmail...' : `Send Test to ${overrideTo}`}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTemplate(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
