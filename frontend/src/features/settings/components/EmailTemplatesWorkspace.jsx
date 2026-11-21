import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FiMail,
  FiSend,
  FiRefreshCw,
  FiEye,
  FiX,
  FiCheckCircle,
  FiCode,
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

  // Active Template Preview Modal
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [testingCode, setTestingCode] = useState(null);
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiGet('/email/status');
      if (res?.data) {
        setSmtpStatus(res.data);
        const savedTo = res.data.overrideToEmail || 'kachhadiyadarshil2@gmail.com';
        setOverrideTo(savedTo);
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
      toastService.success(`Test email address updated to ${overrideTo.trim()}`);
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

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  return (
    <div className="w-full flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 max-w-7xl mx-auto">
      
      {/* ── Compact Header & Test Email Bar (Clean & Professional) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiMail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Email Templates
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automated lifecycle notifications for enquiries, student portal, fee invoices, and visa updates.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
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
              className="text-xs px-2.5 py-1 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 font-mono w-56 focus:outline-none focus:border-primary-500"
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
        </div>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
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

        <button
          type="button"
          onClick={fetchTemplates}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
        >
          <FiRefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Templates Grid (Clean & Structured) ── */}
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

      {/* ── Focused Live Email Preview Modal ── */}
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

              {/* Optional Subject & Variable Editor (Shown when user wants to edit) */}
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
                      Variables: {activeTemplate.variables?.map(v => `{{${v}}}`).join(' ')}
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
          document.body,
        )}

    </div>
  );
}
