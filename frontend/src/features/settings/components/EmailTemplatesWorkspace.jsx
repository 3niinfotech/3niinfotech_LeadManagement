import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiMail,
  FiSend,
  FiEdit3,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiClock,
  FiShield,
  FiLayers,
  FiExternalLink,
  FiCode,
  FiEye,
  FiCopy,
  FiSliders,
  FiX,
  FiZap,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import ContentLoader from '../../../components/ui/ContentLoader';
import { apiGet, apiPut, apiPost } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';

const CATEGORY_TABS = [
  { id: 'all', label: 'All Templates' },
  { id: 'Student Journey', label: 'Student Journey' },
  { id: 'Billing & Accounts', label: 'Billing & Accounts' },
  { id: 'Admissions & Visa', label: 'Admissions & Visa' },
  { id: 'Security & Staff', label: 'Security & Staff' },
];

export default function EmailTemplatesWorkspace() {
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Override configuration state
  const [overrideTo, setOverrideTo] = useState('kachhadiyadarshil2@gmail.com');
  const [overrideActive, setOverrideActive] = useState(true);
  const [savingOverride, setSavingOverride] = useState(false);

  // Active Template Preview & Edit Modal
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewTab, setPreviewTab] = useState('preview'); // 'preview' | 'code'
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [testingCode, setTestingCode] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiGet('/email/status');
      if (res?.data) {
        setSmtpStatus(res.data);
        setOverrideTo(res.data.overrideToEmail || 'kachhadiyadarshil2@gmail.com');
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
    } catch (e) {
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
      toastService.success(`Email routing updated. Live tests directed to ${overrideTo}`);
      fetchStatus();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to update override configuration');
    } finally {
      setSavingOverride(false);
    }
  };

  const handleOpenEditor = async (tpl) => {
    setActiveTemplate(tpl);
    setEditSubject(tpl.subject);
    setEditBody(tpl.body);
    setEditIsActive(tpl.isActive ?? true);
    setPreviewTab('preview');
    try {
      const res = await apiGet(`/email/templates/${tpl.code}`);
      if (res?.data?.previewHtml) {
        setPreviewHtml(res.data.previewHtml);
      }
    } catch {
      setPreviewHtml('<p>Preview unavailable</p>');
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
      toastService.success(`Template "${activeTemplate.name}" updated successfully!`);
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
        recipient: target,
      });
      toastService.success(`🚀 Test email sent to ${res?.data?.sentTo || target}! Check your Gmail inbox.`);
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Failed to send test email');
    } finally {
      setTestingCode(null);
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
    <div className="space-y-6 max-w-7xl">
      {/* ── Top Header / Live Diagnostics & Safe Override Banner ── */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Hostinger SMTP Gateway Active
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                {smtpStatus?.host || 'smtp.hostinger.com'}:{smtpStatus?.port || 587}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <FiMail className="w-5 h-5 text-indigo-400" />
              Automated Student & Staff Lifecycle Emails
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Fully automated lifecycle notifications from Enquiry visit &rarr; Student Registration &rarr; Fee Receipts &rarr; University Offers &rarr; Visa Approvals. Protected with intelligent anti-spam cooldowns.
            </p>
          </div>

          {/* Test Mode Override Control */}
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 min-w-[340px] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <FiZap className="w-4 h-4 text-amber-400" />
                Live Test Mode (Safe Override)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideActive}
                  onChange={(e) => setOverrideActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>

            <p className="text-xs text-slate-300">
              When enabled, all outgoing CRM emails are routed directly to your personal mailbox:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="email"
                value={overrideTo}
                onChange={(e) => setOverrideTo(e.target.value)}
                placeholder="kachhadiyadarshil2@gmail.com"
                className="w-full text-xs px-3 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveOverride}
                disabled={savingOverride}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 transition-colors cursor-pointer"
              >
                {savingOverride ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category Tabs & Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {tab.label}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTemplates.map((tpl) => {
            const isTesting = testingCode === tpl.code;
            return (
              <div
                key={tpl.code}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
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
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {tpl.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {tpl.description}
                  </p>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                      <strong className="text-slate-400 dark:text-slate-500">Subject:</strong> {tpl.subject}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span><strong>Trigger:</strong> {tpl.trigger}</span>
                      <span><strong>Cooldown:</strong> {tpl.cooldown}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEditor(tpl)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                  >
                    <FiEdit3 className="w-3.5 h-3.5" />
                    Preview &amp; Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendTest(tpl.code)}
                    disabled={isTesting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <FiSend className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
                    {isTesting ? 'Sending Test...' : 'Send Test to My Email'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Template Edit & Live HTML Preview Modal ── */}
      {activeTemplate && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  {activeTemplate.category} &bull; {activeTemplate.code}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Edit Template: {activeTemplate.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mr-2 cursor-pointer">
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

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Form Editors */}
              <div className="space-y-4">
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
                    Available Variables (Click to append into subject)
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    {activeTemplate.variables?.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-600 hover:border-indigo-400 transition-colors cursor-pointer"
                      >
                        {`{{${v}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Body (HTML / Responsive Markup)
                  </label>
                  <textarea
                    rows={12}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Right Column: Live Responsive Preview */}
              <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-950">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FiEye className="w-3.5 h-3.5 text-primary-500" />
                    Live Student Inbox Preview
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Sample Data Pre-populated
                  </span>
                </div>
                <div className="flex-1 p-2 bg-slate-200/50 dark:bg-black/50 overflow-y-auto min-h-[380px]">
                  <iframe
                    title="Live Email Preview"
                    srcDoc={previewHtml}
                    className="w-full h-full min-h-[440px] rounded-lg bg-white shadow-inner border-0"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSendTest(activeTemplate.code)}
                disabled={testingCode === activeTemplate.code}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                <FiSend className="w-3.5 h-3.5" />
                {testingCode === activeTemplate.code ? 'Sending...' : `Send Test to ${overrideTo}`}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTemplate(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={savingTemplate}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {savingTemplate ? 'Saving Changes...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
