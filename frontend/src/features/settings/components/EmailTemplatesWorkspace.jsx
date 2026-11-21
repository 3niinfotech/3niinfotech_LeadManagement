import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FiMail,
  FiSend,
  FiEdit3,
  FiCheck,
  FiCheckCircle,
  FiRefreshCw,
  FiShield,
  FiEye,
  FiX,
  FiCheckSquare,
  FiServer,
  FiInbox,
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

export default function EmailTemplatesWorkspace() {
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Override configuration state (Where test emails go)
  const [overrideTo, setOverrideTo] = useState('kachhadiyadarshil2@gmail.com');
  const [overrideActive, setOverrideActive] = useState(true);
  const [savingOverride, setSavingOverride] = useState(false);

  // Quick dispatch tester state
  const [quickTemplate, setQuickTemplate] = useState('STUDENT_WELCOME');
  const [quickRecipient, setQuickRecipient] = useState('kachhadiyadarshil2@gmail.com');
  const [quickSending, setQuickSending] = useState(false);
  const [lastTestResult, setLastTestResult] = useState(null);

  // Active Template Preview & Edit Modal
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [testingCode, setTestingCode] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiGet('/email/status');
      if (res?.data) {
        setSmtpStatus(res.data);
        const savedTo = res.data.overrideToEmail || 'kachhadiyadarshil2@gmail.com';
        setOverrideTo(savedTo);
        setQuickRecipient(savedTo);
        setOverrideActive(res.data.overrideEnabled ?? true);
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

  useEffect(() => {
    fetchStatus();
    fetchTemplates();
  }, [fetchStatus, fetchTemplates]);

  const handleSaveOverride = async () => {
    setSavingOverride(true);
    try {
      await apiPut('/email/settings', {
        overrideEnabled: overrideActive,
        overrideToEmail: overrideTo.trim(),
      });
      toastService.success(`Email routing updated. Test dispatches routed to ${overrideTo.trim()}`);
      setQuickRecipient(overrideTo.trim());
      fetchStatus();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to update test routing');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleOpenEditor = async (tpl) => {
    setActiveTemplate(tpl);
    setEditSubject(tpl.subject || '');
    setEditBody('Loading template content...');
    setEditIsActive(tpl.isActive ?? true);
    setPreviewHtml('<div style="padding: 30px; text-align: center; color: #64748b; font-family: sans-serif;">Loading live email preview...</div>');
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
      setPreviewHtml('<div style="padding: 30px; text-align: center; color: #ef4444; font-family: sans-serif;">Preview unavailable</div>');
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
      toastService.success(`Template "${activeTemplate.name}" saved successfully!`);
      setActiveTemplate(null);
      fetchTemplates();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to update template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSendTest = async (templateCode, customRecipient) => {
    setTestingCode(templateCode);
    const target = (customRecipient || overrideTo || 'kachhadiyadarshil2@gmail.com').trim();
    try {
      const res = await apiPost(`/email/templates/${templateCode}/test-send`, {
        to: target,
        recipient: target,
        subject: activeTemplate?.code === templateCode ? editSubject : undefined,
        body: activeTemplate?.code === templateCode ? editBody : undefined,
      });
      const deliveredTo = res?.data?.targetEmail || target;
      toastService.success(`Live test email delivered to ${deliveredTo}! Check your Gmail inbox.`);
      setLastTestResult({
        success: true,
        templateCode,
        deliveredTo,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to send test email');
    } finally {
      setTestingCode(null);
    }
  };

  const handleQuickSend = async () => {
    if (!quickTemplate) return;
    setQuickSending(true);
    const target = (quickRecipient || overrideTo || 'kachhadiyadarshil2@gmail.com').trim();
    try {
      const res = await apiPost(`/email/templates/${quickTemplate}/test-send`, {
        to: target,
        recipient: target,
      });
      const deliveredTo = res?.data?.targetEmail || target;
      toastService.success(`Live test email for "${quickTemplate}" sent to ${deliveredTo}!`);
      setLastTestResult({
        success: true,
        templateCode: quickTemplate,
        deliveredTo,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to send test email');
    } finally {
      setQuickSending(false);
    }
  };

  const insertVariable = (varKey) => {
    setEditSubject((prev) => `${prev} {{${varKey}}}`);
  };

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-6 mx-auto">
      
      {/* ── Top Header & Gateway Diagnostics (Clean CRM Theme) ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Hostinger SMTP Gateway Active
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                {smtpStatus?.host || 'smtp.hostinger.com'}:{smtpStatus?.port || 587}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                Sender: {smtpStatus?.user || 'info@3niinfotech.com'}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <FiMail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              Automated Lifecycle Email Templates
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Standardized email notifications automatically sent during student journey: Enquiry Welcome &rarr; Portal Login Credentials &rarr; Fee Payment Invoices &rarr; University Application Milestones &rarr; Visa Approvals.
            </p>
          </div>

          {/* Safe Override / Testing Mailbox Control */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 min-w-[320px] max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FiInbox className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                Live Test Mode (Safe Override)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideActive}
                  onChange={(e) => setOverrideActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              When enabled, all CRM test emails are safely sent to your mailbox:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="email"
                value={overrideTo}
                onChange={(e) => setOverrideTo(e.target.value)}
                placeholder="kachhadiyadarshil2@gmail.com"
                className="w-full text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary-500 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveOverride}
                disabled={savingOverride}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shrink-0 transition-colors cursor-pointer"
              >
                {savingOverride ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1-Click Live Email Tester Bar (Clean & Functional) ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FiSend className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              Live Email Dispatch Tester
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any template and click <strong>&quot;Send Test Email&quot;</strong> to instantly verify live delivery into your Gmail inbox.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={quickTemplate}
              onChange={(e) => setQuickTemplate(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-primary-500"
            >
              {templates.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>

            <input
              type="email"
              value={quickRecipient}
              onChange={(e) => setQuickRecipient(e.target.value)}
              placeholder="kachhadiyadarshil2@gmail.com"
              className="text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono w-64 focus:outline-none focus:border-primary-500"
            />

            <button
              type="button"
              onClick={handleQuickSend}
              disabled={quickSending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FiSend className={`w-3.5 h-3.5 ${quickSending ? 'animate-bounce' : ''}`} />
              {quickSending ? 'Sending to Gmail...' : 'Send Test Email'}
            </button>
          </div>
        </div>

        {lastTestResult && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 px-3 py-2 rounded-lg">
            <span className="flex items-center gap-1.5 font-medium">
              <FiCheckCircle className="w-4 h-4 text-emerald-600" />
              Test email for <strong>{lastTestResult.templateCode}</strong> was dispatched to <strong>{lastTestResult.deliveredTo}</strong> at {lastTestResult.timestamp}!
            </span>
            <span className="text-[11px] text-emerald-600/80">Please check your Inbox</span>
          </div>
        )}
      </div>

      {/* ── Category Tabs & Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORY_TABS.map((tab) => {
            const count = tab.id === 'all'
              ? templates.length
              : templates.filter((t) => t.category === tab.id).length;
            const isSelected = selectedCategory === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <FiShield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Anti-Spam Cooldown: <strong>5-min window</strong></span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <button
            type="button"
            onClick={fetchTemplates}
            className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer"
          >
            <FiRefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Templates Grid ── */}
      {loading ? (
        <ContentLoader message="Loading lifecycle email templates..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-8">
          {filteredTemplates.map((tpl) => {
            const isTesting = testingCode === tpl.code;
            return (
              <div
                key={tpl.code}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {tpl.category}
                        </span>
                        {tpl.isCustomized && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            Customized
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {tpl.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
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

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      <strong className="text-slate-400 dark:text-slate-500">Subject:</strong> {tpl.subject}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span><strong>Event:</strong> {tpl.eventType || 'LIFECYCLE_EVENT'}</span>
                      <span><strong>Cooldown:</strong> 5-min window</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEditor(tpl)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <FiEye className="w-3.5 h-3.5 text-slate-500" />
                    Preview &amp; Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendTest(tpl.code)}
                    disabled={isTesting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <FiSend className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
                    {isTesting ? 'Dispatching...' : 'Send Test Email'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Template Edit & Live HTML Preview Modal ── */}
      {activeTemplate &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    {activeTemplate.category} &bull; {activeTemplate.code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Template: {activeTemplate.name}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    Template Active
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTemplate(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Side-by-Side Responsive Split */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Left Column: Form Editors */}
                <div className="space-y-4 flex flex-col min-h-0">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Available Dynamic Variables
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      {activeTemplate.variables?.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => insertVariable(v)}
                          title="Click to insert into subject line"
                          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-primary-500 transition-colors cursor-pointer"
                        >
                          {`{{${v}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-[260px]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Template HTML / Content Markup
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Rendered with standard tables
                      </span>
                    </div>
                    <textarea
                      rows={14}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full flex-1 text-xs font-mono p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 leading-relaxed resize-y"
                    />
                  </div>
                </div>

                {/* Right Column: Live Responsive Preview */}
                <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 min-h-[480px]">
                  <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FiEye className="w-3.5 h-3.5 text-primary-500" />
                      Live Student Inbox Preview
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Official 3ni InfoTech Branding
                    </span>
                  </div>
                  <div className="flex-1 p-3 bg-slate-100 dark:bg-black/40 overflow-y-auto flex flex-col">
                    <iframe
                      title="Live Email Preview"
                      srcDoc={editBody || previewHtml}
                      className="w-full flex-1 min-h-[480px] rounded-lg bg-white shadow-xs border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => handleSendTest(activeTemplate.code)}
                  disabled={testingCode === activeTemplate.code}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <FiSend className={`w-3.5 h-3.5 ${testingCode === activeTemplate.code ? 'animate-bounce' : ''}`} />
                  {testingCode === activeTemplate.code ? 'Dispatching Test...' : `Send Test to ${overrideTo}`}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTemplate(null)}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    disabled={savingTemplate}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {savingTemplate ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
