import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
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
  FiCheck,
  FiExternalLink,
  FiEdit3,
} from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet, apiPut, apiPost } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Templates' },
  { id: 'Student Journey', label: 'Student Journey' },
  { id: 'Billing & Invoices', label: 'Billing & Invoices' },
  { id: 'Admissions & Visa', label: 'Admissions & Visa' },
  { id: 'Operations', label: 'Operations' },
];

const AUDIENCE_OPTIONS = [
  { id: 'SINGLE_STUDENT', label: 'Single Student', icon: FiUser },
  { id: 'ALL_STUDENTS', label: 'All Students', icon: FiUsers },
  { id: 'ROLE_STAFF', label: 'Staff by Role', icon: FiLayers },
  { id: 'SINGLE_STAFF', label: 'Single Staff', icon: FiUser },
  { id: 'CUSTOM_EMAIL', label: 'Direct Email', icon: FiAtSign },
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

  // Compose & Send Modal State
  const [composeOpen, setComposeOpen] = useState(false);
  const [directory, setDirectory] = useState({ students: [], roles: [], staff: [], counts: { students: 0, staff: 0 } });
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [audienceType, setAudienceType] = useState('SINGLE_STUDENT');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
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

  useEffect(() => {
    fetchStatus();
    fetchTemplates();
  }, [fetchStatus, fetchTemplates]);

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

  // Compose Modal Handlers
  const handleOpenCompose = () => {
    setComposeOpen(true);
    fetchDirectory();
  };

  // Recipient resolution for live label display
  const selectedRecipientLabel = useMemo(() => {
    if (audienceType === 'SINGLE_STUDENT') {
      const s = directory.students.find((item) => item.id === selectedStudentId);
      return s ? `${s.name} (${s.email})` : 'Select a student';
    }
    if (audienceType === 'ALL_STUDENTS') {
      return `All Active Students (${directory.counts.students} recipients)`;
    }
    if (audienceType === 'ROLE_STAFF') {
      const r = directory.roles.find((item) => item.id === selectedRoleId);
      return r ? `${r.name} Staff (${r.userCount} members)` : 'Select a role';
    }
    if (audienceType === 'SINGLE_STAFF') {
      const u = directory.staff.find((item) => item.id === selectedStaffId);
      return u ? `${u.name} (${u.roleName} • ${u.email})` : 'Select staff member';
    }
    if (audienceType === 'CUSTOM_EMAIL') {
      return customEmail ? customEmail.trim() : 'Enter direct email address';
    }
    return '';
  }, [audienceType, selectedStudentId, selectedRoleId, selectedStaffId, customEmail, directory]);

  // Recipient name for template preview
  const previewRecipientName = useMemo(() => {
    if (audienceType === 'SINGLE_STUDENT') {
      const s = directory.students.find((item) => item.id === selectedStudentId);
      return s ? s.name : 'Student';
    }
    if (audienceType === 'ALL_STUDENTS') {
      return 'Student';
    }
    if (audienceType === 'ROLE_STAFF') {
      const r = directory.roles.find((item) => item.id === selectedRoleId);
      return r ? `${r.name} Team Member` : 'Staff Member';
    }
    if (audienceType === 'SINGLE_STAFF') {
      const u = directory.staff.find((item) => item.id === selectedStaffId);
      return u ? u.name : 'Staff Member';
    }
    return 'Valued Recipient';
  }, [audienceType, selectedStudentId, selectedRoleId, selectedStaffId, directory]);

  // Trigger live email preview in modal
  const updateComposePreview = useCallback(async () => {
    setGeneratingPreview(true);
    try {
      const res = await apiPost('/email/preview-custom', {
        subject: composeSubject,
        message: composeMessage,
        ctaText: includeCta ? ctaText : null,
        ctaUrl: includeCta ? ctaUrl : null,
        recipientName: previewRecipientName,
      });
      if (res?.data?.previewHtml) {
        setComposePreviewHtml(res.data.previewHtml);
      }
    } catch {
      // preview failure silently handled
    } finally {
      setGeneratingPreview(false);
    }
  }, [composeSubject, composeMessage, includeCta, ctaText, ctaUrl, previewRecipientName]);

  // Update preview when compose modal is open and inputs change
  useEffect(() => {
    if (!composeOpen) return;
    const timer = setTimeout(() => {
      updateComposePreview();
    }, 280);
    return () => clearTimeout(timer);
  }, [composeOpen, composeSubject, composeMessage, includeCta, ctaText, ctaUrl, previewRecipientName, updateComposePreview]);

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
    if (audienceType === 'SINGLE_STUDENT' && !selectedStudentId) {
      toastService.error('Please select a student');
      return;
    }
    if (audienceType === 'ROLE_STAFF' && !selectedRoleId) {
      toastService.error('Please select a staff role');
      return;
    }
    if (audienceType === 'SINGLE_STAFF' && !selectedStaffId) {
      toastService.error('Please select a staff member');
      return;
    }
    if (audienceType === 'CUSTOM_EMAIL' && (!customEmail || !customEmail.includes('@'))) {
      toastService.error('Please enter a valid email address');
      return;
    }

    setSendingCompose(true);
    try {
      const res = await apiPost('/email/dispatch-custom', {
        audienceType,
        studentId: selectedStudentId,
        roleId: selectedRoleId,
        staffId: selectedStaffId,
        customEmail,
        subject: composeSubject,
        message: composeMessage,
        ctaText: includeCta ? ctaText : null,
        ctaUrl: includeCta ? ctaUrl : null,
      });

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
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to dispatch email');
    } finally {
      setSendingCompose(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto px-4 sm:px-4 py-5 space-y-5 mx-auto">
      {/* ── Header & Action Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiMail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Email Templates &amp; Direct Dispatch
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated lifecycle notifications, targeted student dispatches, role announcements, and SMTP routing.
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
              className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors cursor-pointer"
            >
              {savingOverride ? '...' : 'Save'}
            </button>
          </div>

          {/* Primary Action Button: Compose & Send Email */}
          <button
            type="button"
            onClick={handleOpenCompose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <FiSend className="w-3.5 h-3.5" />
            Compose &amp; Send Email
          </button>
        </div>
      </div>

      {/* ── Category Filter Tabs & Refresh ── */}
      <div className="flex items-center justify-between gap-3">
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
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={fetchTemplates}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Templates Grid ── */}
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
                <div className="space-y-2.5">
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

                {/* Action Buttons */}
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

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── COMPOSE & SEND TARGETED / BROADCAST EMAIL MODAL ───────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {composeOpen &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[94vh]">
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-900/50">
                    <FiSend className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Compose &amp; Send Email
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Deliver official communications to a specific student, entire batch, or staff department.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Selector */}
                  <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setComposeTab('split')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                        composeTab === 'split'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Editor Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposeTab('preview')}
                      className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                        composeTab === 'preview'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Preview Only
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 min-h-0 overflow-hidden flex flex-row divide-x divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                {/* ── LEFT PANE: Composer Form ── */}
                {(composeTab === 'split' || composeTab === 'editor') && (
                  <div
                    className={`${
                      composeTab === 'split' ? 'w-full md:w-1/2' : 'w-full max-w-3xl mx-auto'
                    } p-4 sm:p-5 space-y-4 overflow-y-auto`}
                  >
                    {/* Step 1: Select Recipient Audience */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        1. Select Target Recipient / Audience:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {AUDIENCE_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = audienceType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setAudienceType(opt.id)}
                              className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                              }`}
                            >
                              <Icon
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                                }`}
                              />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 1.1: Audience Target Specific Picker */}
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      {/* SINGLE STUDENT */}
                      {audienceType === 'SINGLE_STUDENT' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Search &amp; Pick Student:
                            </label>
                            <span className="text-[10px] text-slate-500">
                              {filteredStudents.length} of {directory.counts.students} students
                            </span>
                          </div>
                          <div className="relative">
                            <FiSearch className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Type student name, student code, or email..."
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                          >
                            <option value="">-- Choose Student --</option>
                            {filteredStudents.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.studentCode}) • {s.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* ALL STUDENTS */}
                      {audienceType === 'ALL_STUDENTS' && (
                        <div className="flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/50">
                          <FiUsers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Broadcast to All Students</p>
                            <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-0.5">
                              This email will be delivered to all{' '}
                              <strong>{directory.counts.students} active students</strong> registered in the CRM.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* STAFF BY ROLE */}
                      {audienceType === 'ROLE_STAFF' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Select Staff Role / Department:
                          </label>
                          <select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                          >
                            <option value="">-- Choose Role --</option>
                            {directory.roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.userCount} active staff member
                                {r.userCount > 1 ? 's' : ''})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* SINGLE STAFF MEMBER */}
                      {audienceType === 'SINGLE_STAFF' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Select Staff Member:
                          </label>
                          <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
                          >
                            <option value="">-- Choose Staff User --</option>
                            {directory.staff.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} ({u.roleName}) • {u.email}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* DIRECT EMAIL ADDRESS */}
                      {audienceType === 'CUSTOM_EMAIL' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Direct Recipient Email Address:
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

                      {/* Selected Summary Pill */}
                      <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <strong className="text-slate-700 dark:text-slate-300">Audience:</strong>
                        <span className="truncate text-blue-600 dark:text-blue-400 font-semibold">
                          {selectedRecipientLabel}
                        </span>
                      </div>
                    </div>

                    {/* Step 2: Preset Templates Shortcut */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Quick Template Starters (Optional):
                      </label>
                      <select
                        onChange={(e) => {
                          const idx = Number(e.target.value);
                          if (!isNaN(idx) && PRESET_MESSAGES[idx]) {
                            handleApplyPreset(PRESET_MESSAGES[idx]);
                          }
                        }}
                        defaultValue=""
                        className="w-full text-xs p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500"
                      >
                        <option value="" disabled>
                          -- Select a starter topic or compose custom --
                        </option>
                        {PRESET_MESSAGES.map((preset, idx) => (
                          <option key={idx} value={idx}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Step 3: Subject Line */}
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

                    {/* Step 4: Email Message */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Message Content:
                        </label>
                        <span className="text-[10px] text-slate-400">
                          Separate paragraphs with blank lines
                        </span>
                      </div>
                      <textarea
                        rows={5}
                        value={composeMessage}
                        onChange={(e) => setComposeMessage(e.target.value)}
                        placeholder="Write your email announcement or message here..."
                        className="w-full text-xs p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Step 5: Optional Call-To-Action (CTA) Button */}
                    <div className="p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={includeCta}
                          onChange={(e) => setIncludeCta(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Include Call-to-Action (Action Button)
                      </label>

                      {includeCta && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Button Label:</label>
                            <input
                              type="text"
                              value={ctaText}
                              onChange={(e) => setCtaText(e.target.value)}
                              placeholder="e.g. View Student Portal"
                              className="w-full text-xs px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Button Link (URL):</label>
                            <input
                              type="url"
                              value={ctaUrl}
                              onChange={(e) => setCtaUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full text-xs px-2.5 py-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── RIGHT PANE: Live Responsive Email Preview ── */}
                {(composeTab === 'split' || composeTab === 'preview') && (
                  <div
                    className={`${
                      composeTab === 'split' ? 'w-full md:w-1/2' : 'w-full'
                    } p-4 sm:p-5 flex flex-col bg-slate-100 dark:bg-black/40 min-h-[420px]`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FiEye className="w-3.5 h-3.5 text-blue-600" />
                        Live Inbox Preview (Official 3ni InfoTech Template)
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

              {/* Modal Footer & Actions */}
              <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                {/* Safe Test Mode Banner */}
                <div className="text-xs">
                  {overrideActive ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      Safe Test Mode is ON: outgoing email will route to <strong>{overrideTo}</strong>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Live Delivery: Sending directly to recipient mailbox
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSendCustomEmail}
                    disabled={sendingCompose}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FiSend className={`w-3.5 h-3.5 ${sendingCompose ? 'animate-bounce' : ''}`} />
                    {sendingCompose
                      ? 'Dispatching Email...'
                      : audienceType === 'ALL_STUDENTS'
                      ? `Broadcast to All Students (${directory.counts.students})`
                      : 'Send Email Now'}
                  </button>
                </div>
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
                      className="px-3 py-1 rounded text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer"
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
