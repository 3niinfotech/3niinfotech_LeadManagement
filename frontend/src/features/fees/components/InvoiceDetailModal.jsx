import React, { useEffect, useMemo, useState, useRef } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import ContentLoader from '../../../components/ui/ContentLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import MasterManageLink from '../../master/components/MasterManageLink';
import { PERMISSIONS } from '../../../config/permissions';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import {
  useGetInvoiceQuery,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} from '../redux/feesApiSlice';
import {
  calcTaxAmount,
  displayInvoiceStatus,
  formatMoney,
  getInvoiceStatusTone,
  numberToWords,
  INVOICE_STATUS_OPTIONS,
} from '../config/feesConstants';
import { useCompanyRuntime } from '../../organization/CompanyRuntime';
import { resolvePublicAssetUrl } from '../../../config/company-settings.config';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import CollectPaymentModal from './CollectPaymentModal';
import ReceiptModal from './ReceiptModal';
import {
  FiPrinter,
  FiFileText,
  FiEdit2,
  FiDollarSign,
  FiTrash2,
  FiCheckCircle,
  FiDownload,
  FiRefreshCw,
} from 'react-icons/fi';
import '../styles/fees.theme.css';

function studentFullName(s) {
  if (!s) return 'Walk-in Candidate';
  return `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode || 'Walk-in Candidate';
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function fmtDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  const dateStr = d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr}, ${timeStr}`;
}

export default function InvoiceDetailModal({
  invoiceId,
  open,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const { data: invoice, isLoading, isFetching, refetch } = useGetInvoiceQuery(invoiceId, {
    skip: !open || !invoiceId,
  });
  const { company } = useCompanyRuntime();
  const [updateInvoice, { isLoading: saving }] = useUpdateInvoiceMutation();
  const [deleteInvoice, { isLoading: deleting }] = useDeleteInvoiceMutation();
  const { options: taxOptions } = useRelationalMasterOptions('tax', {}, { enabled: Boolean(open) });
  const { options: currencyOptions } = useRelationalMasterOptions('currency', {}, { enabled: Boolean(open) });
  const { options: paymentModeOptions } = useRelationalMasterOptions('payment-mode', {}, { enabled: Boolean(open) });

  // Mode: 'pdf' (Default Official Voucher View) or 'edit' (Admin Billing Form)
  const [viewMode, setViewMode] = useState('pdf');

  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [taxId, setTaxId] = useState('');
  const [currency, setCurrency] = useState('');
  const [paymentModeId, setPaymentModeId] = useState('');
  const [collectOpen, setCollectOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  useEffect(() => {
    if (!invoice) return;
    setStatus(invoice.status || 'DRAFT');
    setNotes(invoice.notes || '');
    setDueDate(invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : '');
    setAmount(String(invoice.amount ?? ''));
    setTaxId(invoice.metadata?.taxId || '');
    setCurrency(invoice.currency || 'INR');
    setPaymentModeId(invoice.metadata?.paymentModeId || '');
    // Reset to PDF view whenever a new invoice opens
    setViewMode('pdf');
  }, [invoice, open]);

  const selectedTax = useMemo(
    () => (taxOptions || []).find((t) => t.value === taxId) || null,
    [taxOptions, taxId],
  );

  const amountNum = Number(amount || 0);
  const effectiveTax = taxId
    ? calcTaxAmount(amountNum, selectedTax?.taxPercentage)
    : 0;
  const totalPreview = amountNum + effectiveTax;

  const dirty = useMemo(() => {
    if (!invoice) return false;
    const due = invoice.dueDate ? String(invoice.dueDate).slice(0, 10) : '';
    return status !== invoice.status
      || notes !== (invoice.notes || '')
      || dueDate !== due
      || Number(amount) !== Number(invoice.amount)
      || (taxId || '') !== (invoice.metadata?.taxId || '')
      || (currency || '') !== (invoice.currency || '')
      || (paymentModeId || '') !== (invoice.metadata?.paymentModeId || '');
  }, [invoice, status, notes, dueDate, amount, taxId, currency, paymentModeId]);

  const buildMeta = () => {
    const paymentMode = (paymentModeOptions || []).find((p) => p.value === paymentModeId);
    return {
      taxId: selectedTax?.value || null,
      taxName: selectedTax?.label || null,
      taxCode: selectedTax?.code || null,
      taxPercentage: selectedTax?.taxPercentage ?? 0,
      paymentModeId: paymentMode?.value || null,
      paymentModeName: paymentMode?.label || null,
    };
  };

  const handleSave = async () => {
    try {
      const payload = {
        id: invoiceId,
        status,
        notes: notes || null,
        dueDate: dueDate || null,
        amount: amountNum,
        tax: effectiveTax,
        total: totalPreview,
        currency: currency || null,
        metadata: buildMeta(),
      };
      if (status === 'PAID' && !invoice?.paidAt) {
        payload.paidAt = new Date().toISOString();
      }
      await updateInvoice(payload).unwrap();
      toastService.success('Invoice updated successfully');
      setViewMode('pdf');
      onUpdated?.();
      refetch?.();
    } catch (err) {
      toastService.error(err?.data?.message || 'Update failed');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await updateInvoice({
        id: invoiceId,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        metadata: buildMeta(),
      }).unwrap();
      toastService.success('Marked as paid');
      onUpdated?.();
      refetch?.();
    } catch (err) {
      toastService.error(err?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    const ok = await alertService.deleteConfirm({
      title: 'Delete invoice',
      text: 'This will permanently remove the invoice from the system.',
    });
    if (!ok) return;
    try {
      await deleteInvoice(invoiceId).unwrap();
      toastService.success('Invoice removed');
      onDeleted?.();
      onClose?.();
    } catch (err) {
      toastService.error(err?.data?.message || 'Delete failed');
    }
  };

  // Company Brand Data
  const companyName = company?.legalName || company?.name || '3NI INFOTECH PRIVATE LIMITED';
  const companyDivision = company?.divisionTag || company?.settings?.divisionTag || 'Overseas Education Advisory & Visa Consultancy Division';
  const companyAddress = company?.fullAddress || [company?.addressLine1, company?.addressLine2, company?.city, company?.state, company?.postalCode].filter(Boolean).join(', ') || '401-404, Silicon Square, Yogi Chowk, Surat, Gujarat 395010';
  const companyPhone = company?.phone || '+91 98250 11111';
  const companyEmail = company?.email || 'accounts@3ni.io';
  const companyGstin = company?.taxNumber || '24AAACC1234F1Z5';
  const companyCin = company?.registrationNumber || 'U72900GJ2020PTC115000';
  const companyState = company?.state || 'Gujarat';
  const companyStateCode = company?.stateCode || '24';
  const companyBankName = company?.bankName || 'HDFC Bank Current A/C';
  const companyBankBranch = company?.bankBranch || 'Yogi Chowk';
  const companyLogo = company?.logo ? resolvePublicAssetUrl(company.logo) : '/assets/images/brand/logo.jpg';
  const companyStamp = company?.stampText || `[ ${(company?.name || '3NI INFOTECH').toUpperCase()} E-VERIFIED ]`;
  const companySignatory = company?.signatoryTitle || 'Authorized Signatory / Accounts Dept.';

  // Invoice calculations
  const invTotal = Number(invoice?.total ?? (invoice?.amount ? Number(invoice.amount) + Number(invoice.tax || 0) : 0));
  const invTax = Number(invoice?.tax || 0);
  const invBase = Number(invoice?.amount ?? (invTotal - invTax));
  const invCurrency = invoice?.currency || 'INR';

  // Tax breakdown
  const taxPct = Number(invoice?.metadata?.taxPercentage ?? (invBase > 0 && invTax > 0 ? Math.round((invTax / invBase) * 100) : 18));
  const halfTaxRate = taxPct > 0 ? (taxPct / 2) : 9.0;
  const halfTaxAmount = invTax > 0 ? (invTax / 2) : 0;

  const isPaid = invoice?.status === 'PAID';
  const isOverdue = invoice?.status === 'OVERDUE';
  const isCancelled = invoice?.status === 'CANCELLED';

  const student = invoice?.student || {};
  const studentNameStr = studentFullName(student);
  const studentCodeStr = student.studentCode || 'N/A';
  const studentContactStr = [student.phone, student.email].filter(Boolean).join(' · ') || '—';
  const targetProgramStr = student.course || invoice?.notes || 'Tuition & University Advisory Services';
  const academicIntakeStr = student.intake || 'September 2026 Intake';

  const latestPayment = invoice?.payments?.[0] || null;
  const paymentModeLabel = latestPayment?.mode
    ? latestPayment.mode.replace(/_/g, ' ')
    : (isPaid ? 'Bank Transfer / Net Banking' : 'Pending Settlement');
  const txnRefStr = latestPayment?.referenceNo || latestPayment?.receiptNo || (isPaid ? invoice?.invoiceNo : 'Pending Collection');
  const branchNameStr = student.branch?.name || (company?.city ? `${company.city} Head Office` : 'Surat Head Office');

  const invoiceDateFormatted = fmtDateTime(invoice?.createdAt || Date.now());
  const wordsStr = numberToWords(invTotal, invCurrency);

  // Print Handler
  const handlePrint = () => {
    const el = document.getElementById('official-invoice-print-area');
    if (!el) return;
    const win = window.open('', '', 'width=960,height=900');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Official Invoice — ${invoice?.invoiceNo || 'Document'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 0;
              font-size: 11px;
              line-height: 1.4;
            }
            .crm-official-voucher-wrapper {
              display: block;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .crm-official-voucher {
              width: 100%;
              max-width: 100%;
              border: 1.5px solid #cbd5e1;
              border-radius: 6px;
              overflow: hidden;
              background: #ffffff;
            }
            .crm-voucher-top-title-bar {
              text-align: center;
              background: #f1f5f9;
              border-bottom: 1.5px solid #cbd5e1;
              padding: 8px 12px;
            }
            .crm-voucher-main-heading {
              font-size: 14px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }
            .crm-voucher-content-body {
              padding: 14px 18px;
            }
            .crm-voucher-header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .crm-voucher-company-block {
              display: flex;
              align-items: center;
              gap: 12px;
              flex: 1;
            }
            .crm-voucher-real-logo {
              width: 68px;
              height: 68px;
              border-radius: 6px;
              object-fit: cover;
              border: 1px solid #cbd5e1;
              background: #ffffff;
            }
            .crm-voucher-company-name {
              font-size: 14px;
              font-weight: 900;
              color: #000000;
              margin: 0;
              text-transform: uppercase;
              line-height: 1.2;
            }
            .crm-voucher-division-tag {
              font-size: 9px;
              font-weight: 700;
              color: #334155;
              text-transform: uppercase;
              margin-top: 2px;
            }
            .crm-voucher-address-line {
              font-size: 9.5px;
              color: #475569;
              margin-top: 2px;
            }
            .crm-voucher-contact-line {
              font-size: 9.5px;
              color: #1e293b;
              margin-top: 2px;
            }
            .crm-voucher-meta-box {
              border-left: 1px solid #cbd5e1;
              padding-left: 14px;
              min-width: 220px;
            }
            .crm-voucher-meta-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            .crm-voucher-meta-table td {
              padding: 2.5px 0;
            }
            .crm-meta-lbl {
              color: #475569;
              font-weight: 600;
              padding-right: 8px;
              white-space: nowrap;
            }
            .crm-meta-val {
              color: #000000;
              font-weight: 700;
              text-align: right;
              white-space: nowrap;
            }
            .crm-voucher-status-stamp {
              display: inline-flex;
              align-items: center;
              background: #ecfdf5;
              color: #047857;
              border: 1px solid #a7f3d0;
              padding: 1px 6px;
              border-radius: 4px;
              font-weight: 800;
              font-size: 9px;
              text-transform: uppercase;
            }
            .crm-voucher-status-stamp--pending {
              background: #fef3c7;
              color: #b45309;
              border-color: #fde68a;
            }
            .crm-voucher-status-stamp--overdue {
              background: #fef2f2;
              color: #b91c1c;
              border-color: #fecaca;
            }
            .crm-voucher-status-stamp--cancelled {
              background: #f1f5f9;
              color: #64748b;
              border-color: #cbd5e1;
            }
            .crm-voucher-sections-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 10px;
            }
            .crm-voucher-card {
              border: 1px solid #cbd5e1;
              background: #ffffff;
              border-radius: 4px;
              overflow: hidden;
            }
            .crm-voucher-card-title {
              background: #f8fafc;
              border-bottom: 1px solid #cbd5e1;
              padding: 4px 8px;
              font-size: 9px;
              font-weight: 800;
              color: #334155;
              text-transform: uppercase;
            }
            .crm-voucher-card-body {
              padding: 6px 8px;
            }
            .crm-voucher-data-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            .crm-voucher-data-table td {
              padding: 2.5px 0;
            }
            .crm-voucher-dt-lbl {
              color: #64748b;
              font-weight: 600;
              width: 40%;
            }
            .crm-voucher-dt-val {
              color: #0f172a;
              font-weight: 600;
            }
            .crm-voucher-dt-val--bold {
              font-weight: 800;
              color: #000000;
            }
            .crm-voucher-dt-val--mono {
              font-family: monospace;
              font-weight: 700;
            }
            .crm-voucher-ledger-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
              border: 1px solid #94a3b8;
              margin-bottom: 10px;
              background: #ffffff;
            }
            .crm-voucher-ledger-table th {
              background: #f8fafc;
              color: #1e293b;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 9px;
              padding: 6px 8px;
              border: 1px solid #cbd5e1;
            }
            .crm-voucher-ledger-table td {
              padding: 6px 8px;
              border: 1px solid #cbd5e1;
              color: #334155;
            }
            .crm-voucher-ledger-table tfoot td {
              border: 1px solid #cbd5e1;
              background: #f8fafc;
            }
            .crm-voucher-foot {
              display: grid;
              grid-template-columns: 1.6fr 1.1fr 1.3fr;
              gap: 10px;
              align-items: flex-end;
              border-top: 1px solid #cbd5e1;
              padding-top: 8px;
            }
            .crm-voucher-terms {
              font-size: 8.5px;
              color: #64748b;
              line-height: 1.35;
            }
            .crm-voucher-terms strong {
              color: #1e293b;
              display: block;
              margin-bottom: 2px;
            }
            .crm-voucher-stamp-box {
              text-align: center;
              border: 1.5px dashed #0f172a;
              padding: 4px 6px;
              border-radius: 4px;
              background: #ffffff;
            }
            .crm-voucher-stamp-title {
              font-size: 9px;
              font-weight: 900;
              color: #000000;
              text-transform: uppercase;
            }
            .crm-voucher-stamp-sub {
              font-size: 8px;
              color: #64748b;
              margin-top: 2px;
            }
            .crm-voucher-sign-box {
              text-align: right;
            }
            .crm-voucher-sign-company {
              font-size: 8.5px;
              color: #475569;
              margin-bottom: 20px;
            }
            .crm-voucher-sign-line {
              border-top: 1px solid #0f172a;
              padding-top: 3px;
              font-size: 9px;
              font-weight: 700;
              color: #000000;
            }
            .crm-voucher-bottom-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px dashed #cbd5e1;
              margin-top: 8px;
              padding-top: 4px;
              font-size: 8px;
              color: #64748b;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="crm-official-voucher-wrapper">
            ${el.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-text">
              {viewMode === 'pdf' ? 'Official Tax Invoice Voucher' : 'Invoice Details & Billing'}
            </span>
            {invoice?.invoiceNo && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 border border-primary-200/50 font-bold">
                {invoice.invoiceNo}
              </span>
            )}
          </div>
        }
        size="xl"
        footer={(
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <PermissionGate permission={PERMISSIONS.INVOICES_DELETE}>
                <Button variant="outline-danger" size="sm" loading={deleting} onClick={handleDelete}>
                  <FiTrash2 className="w-3.5 h-3.5 mr-1 inline" /> Delete
                </Button>
              </PermissionGate>

              {/* View Switcher Pills */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode('pdf')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'pdf'
                      ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-300 shadow-xs font-bold'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <FiFileText className="w-3.5 h-3.5" />
                  Official PDF Voucher
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'edit'
                      ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-300 shadow-xs font-bold'
                      : 'text-text-muted hover:text-text'
                  }`}
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                  Edit Billing Form
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {viewMode === 'pdf' ? (
                <>
                  <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                  </Button>
                  {!isPaid && !isCancelled && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => setCollectOpen(true)}
                    >
                      <FiDollarSign className="w-3.5 h-3.5 mr-1 inline" /> Collect Payment
                    </Button>
                  )}
                  <Button variant="primary" size="sm" onClick={handlePrint}>
                    <FiPrinter className="w-3.5 h-3.5 mr-1 inline" /> Print / Save PDF
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setViewMode('pdf')}>
                    Cancel
                  </Button>
                  <PermissionGate permission={PERMISSIONS.INVOICES_UPDATE}>
                    <Button variant="primary" size="sm" loading={saving} disabled={!dirty} onClick={handleSave}>
                      Save Changes
                    </Button>
                  </PermissionGate>
                </>
              )}
            </div>
          </div>
        )}
      >
        {(isLoading || (!invoice && isFetching)) && <ContentLoader variant="center" />}

        {invoice && viewMode === 'pdf' && (
          <div className="crm-official-voucher-wrapper py-2">
            <div
              id="official-invoice-print-area"
              className="crm-print-document crm-official-voucher"
            >
              {/* ── ROW 1: TOP FULL-WIDTH VOUCHER TITLE (EDGE-TO-EDGE) ── */}
              <div className="crm-voucher-top-title-bar">
                <div className="crm-voucher-main-heading">
                  {isPaid ? 'OFFICIAL TAX INVOICE & PAYMENT VOUCHER' : 'OFFICIAL TAX INVOICE'}
                </div>
              </div>

              {/* ── VOUCHER INNER BODY CONTENT ── */}
              <div className="crm-voucher-content-body">
                {/* ── ROW 2: FIRM HEADER & METADATA ── */}
                <div className="crm-voucher-header-row">
                  <div className="crm-voucher-company-block">
                    <img
                      src={companyLogo}
                      alt={companyName}
                      className="crm-voucher-real-logo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="crm-voucher-company-details">
                      <h2 className="crm-voucher-company-name">
                        {companyName}
                      </h2>
                      <div className="crm-voucher-division-tag">
                        {companyDivision}
                      </div>
                      <div className="crm-voucher-address-line">
                        {companyAddress}
                      </div>
                      <div className="crm-voucher-contact-line">
                        Tel: {companyPhone} &nbsp;·&nbsp; {companyEmail} &nbsp;·&nbsp; <strong>GSTIN:</strong> {companyGstin}
                      </div>
                    </div>
                  </div>

                  <div className="crm-voucher-meta-box">
                    <table className="crm-voucher-meta-table">
                      <tbody>
                        <tr>
                          <td className="crm-meta-lbl">Voucher No:</td>
                          <td className="crm-meta-val crm-voucher-dt-val--mono">{invoice.invoiceNo}</td>
                        </tr>
                        <tr>
                          <td className="crm-meta-lbl">Date &amp; Time:</td>
                          <td className="crm-meta-val">{invoiceDateFormatted}</td>
                        </tr>
                        <tr>
                          <td className="crm-meta-lbl">Payment Status:</td>
                          <td className="crm-meta-val">
                            {isPaid ? (
                              <span className="crm-voucher-status-stamp">
                                ✓ PAID &amp; CLEARED
                              </span>
                            ) : isOverdue ? (
                              <span className="crm-voucher-status-stamp crm-voucher-status-stamp--overdue">
                                ⚠ OVERDUE
                              </span>
                            ) : isCancelled ? (
                              <span className="crm-voucher-status-stamp crm-voucher-status-stamp--cancelled">
                                ✕ CANCELLED
                              </span>
                            ) : (
                              <span className="crm-voucher-status-stamp crm-voucher-status-stamp--pending">
                                ⏳ PAYMENT DUE
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="crm-meta-lbl">State:</td>
                          <td className="crm-meta-val">{companyStateCode} ({companyState})</td>
                        </tr>
                        <tr>
                          <td className="crm-meta-lbl">CIN:</td>
                          <td className="crm-meta-val crm-voucher-dt-val--mono" style={{ fontSize: '0.6875rem' }}>
                            {companyCin}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── ROW 3: STUDENT & BANKING RECORDS (2 BALANCED CARDS) ── */}
                <div className="crm-voucher-sections-grid">
                  <div className="crm-voucher-card">
                    <div className="crm-voucher-card-title">
                      Student Particulars
                    </div>
                    <div className="crm-voucher-card-body">
                      <table className="crm-voucher-data-table">
                        <tbody>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Full Name:</td>
                            <td className="crm-voucher-dt-val crm-voucher-dt-val--bold">{studentNameStr}</td>
                          </tr>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Student ID:</td>
                            <td className="crm-voucher-dt-val crm-voucher-dt-val--mono">{studentCodeStr}</td>
                          </tr>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Contact / Email:</td>
                            <td className="crm-voucher-dt-val">{studentContactStr}</td>
                          </tr>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Target Program:</td>
                            <td className="crm-voucher-dt-val">{targetProgramStr}</td>
                          </tr>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Academic Intake:</td>
                            <td className="crm-voucher-dt-val">{academicIntakeStr}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="crm-voucher-card">
                    <div className="crm-voucher-card-title">
                      Payment &amp; Banking Records
                    </div>
                    <div className="crm-voucher-card-body">
                      <table className="crm-voucher-data-table">
                        <tbody>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Payment Mode:</td>
                            <td className="crm-voucher-dt-val crm-voucher-dt-val--bold">{paymentModeLabel}</td>
                          </tr>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Txn Ref / UTR:</td>
                            <td className="crm-voucher-dt-val crm-voucher-dt-val--mono">{txnRefStr}</td>
                          </tr>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Bank Account:</td>
                            <td className="crm-voucher-dt-val">
                              {companyBankName} {companyBankBranch ? `(Branch: ${companyBankBranch})` : ''}
                            </td>
                          </tr>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Branch / Center:</td>
                            <td className="crm-voucher-dt-val">
                              {branchNameStr}
                            </td>
                          </tr>
                          <tr>
                            <td className="crm-voucher-dt-lbl">Assigned Desk:</td>
                            <td className="crm-voucher-dt-val crm-voucher-dt-val--bold">Accounts &amp; Admissions Desk</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ── ROW 4: ACCOUNTING LINE ITEMS (WITH INTEGRATED AMOUNT IN WORDS) ── */}
                <table className="crm-voucher-ledger-table" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #94a3b8', marginBottom: '0.75rem', background: '#ffffff' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ width: '6%', textAlign: 'center', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>Sr.</th>
                      <th style={{ textAlign: 'left', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>Particulars / Description of Services</th>
                      <th style={{ width: '13%', textAlign: 'center', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>SAC Code</th>
                      <th style={{ width: '12%', textAlign: 'center', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>Rate</th>
                      <th style={{ width: '18%', textAlign: 'right', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center', fontWeight: 700, border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>1</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>
                        <strong style={{ color: '#0f172a' }}>Tuition &amp; University Advisory Services</strong>
                        <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748b' }}>
                          Course Coaching &amp; University Application Filing (Installment)
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>999293</td>
                      <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>—</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#000000', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>
                        ₹{Number(invBase).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {invTax > 0 && (
                      <>
                        <tr>
                          <td style={{ textAlign: 'center', fontWeight: 700, border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>2</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>
                            Central Goods and Services Tax (CGST @ {halfTaxRate.toFixed(1)}%)
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>999293</td>
                          <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>{halfTaxRate.toFixed(1)}%</td>
                          <td style={{ textAlign: 'right', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>
                            ₹{Number(halfTaxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: 'center', fontWeight: 700, border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>3</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>
                            State Goods and Services Tax (SGST @ {halfTaxRate.toFixed(1)}%)
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>999293</td>
                          <td style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>{halfTaxRate.toFixed(1)}%</td>
                          <td style={{ textAlign: 'right', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>
                            ₹{Number(halfTaxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                      <td colSpan={4} style={{ textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800, border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>
                        {isPaid ? 'TOTAL AMOUNT RECEIVED (INR):' : 'TOTAL AMOUNT PAYABLE (INR):'}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '0.875rem', fontWeight: 900, color: '#000000', border: '1px solid #cbd5e1', padding: '0.5rem 0.65rem' }}>
                        ₹{Number(invTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr style={{ background: '#f8fafc' }}>
                      <td colSpan={5} style={{ border: '1px solid #cbd5e1', padding: '0.45rem 0.65rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                            AMOUNT IN WORDS:
                          </span>
                          <strong style={{ fontSize: '0.8125rem', color: '#0f172a', fontWeight: 800 }}>
                            {wordsStr}
                          </strong>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* ── ROW 5: FOOTER (COMPACT TERMS, STAMP & SIGNATURE) ── */}
                <div className="crm-voucher-foot">
                  <div className="crm-voucher-terms">
                    <strong>Terms &amp; Conditions:</strong>
                    1. Computer-generated official tax invoice issued under GST provisions.<br />
                    2. All payments acknowledged are subject to realization and institute policy.
                  </div>

                  <div className="crm-voucher-stamp-box">
                    <div className="crm-voucher-stamp-title">
                      {companyStamp}
                    </div>
                    <div className="crm-voucher-stamp-sub">
                      Digitally signed &amp; ledger stamped<br />
                      Date: {invoiceDateFormatted}
                    </div>
                  </div>

                  <div className="crm-voucher-sign-box">
                    <div className="crm-voucher-sign-company">
                      For <strong>{companyName}</strong>
                    </div>
                    <div className="crm-voucher-sign-line">
                      {companySignatory}
                    </div>
                  </div>
                </div>

                {/* ── ROW 6: CLEAN BOTTOM PAGE NUMBER STRIP ── */}
                <div className="crm-voucher-bottom-bar">
                  <span>Official Computer Generated Voucher</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {invoice && viewMode === 'edit' && (
          <div className="fees-detail">
            <div className="fees-detail__hero">
              <div className="fees-detail__hero-body">
                <div className="fees-detail__hero-top">
                  <h3 className="fees-detail__hero-name">{invoice.invoiceNo}</h3>
                  <Badge color={getInvoiceStatusTone(invoice.status)} size="sm">
                    {displayInvoiceStatus(invoice.status)}
                  </Badge>
                </div>
                <p className="fees-detail__hero-student">{studentNameStr}</p>
                <div className="fees-detail__hero-meta">
                  {student.branch?.name && <span>{student.branch.name}</span>}
                  <span>Created {fmtDate(invoice.createdAt)}</span>
                  {invoice.paidAt && <span>Paid {fmtDate(invoice.paidAt)}</span>}
                </div>
              </div>
              <div className="fees-detail__amount-block">
                <span>Total</span>
                <strong>{formatMoney(totalPreview || invoice.total, currency || invoice.currency)}</strong>
              </div>
            </div>

            <PermissionGate permission={PERMISSIONS.INVOICES_UPDATE}>
              <section className="fees-detail__section">
                <div className="fees-detail__section-head">
                  <h4>Billing</h4>
                  <MasterManageLink to="/admin/master/tax">Tax master</MasterManageLink>
                </div>
                <div className="fees-detail__form-grid">
                  <Input
                    label="Amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Select
                    label="Tax"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    size="sm"
                  >
                    <option value="">No tax (0%)</option>
                    {(taxOptions || []).map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                        {t.taxPercentage != null ? ` — ${t.taxPercentage}%` : ''}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    size="sm"
                  >
                    <option value="">Select currency</option>
                    {(currencyOptions || []).map((c) => (
                      <option key={c.value} value={c.code || c.label}>
                        {(c.code ? `${c.code} — ` : '') + c.label}
                      </option>
                    ))}
                  </Select>
                  <div className="fees-detail__calc">
                    <div>
                      <span>Tax amount</span>
                      <strong>{formatMoney(effectiveTax, currency || invoice.currency)}</strong>
                    </div>
                    <div>
                      <span>Invoice total</span>
                      <strong>{formatMoney(totalPreview, currency || invoice.currency)}</strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="fees-detail__section">
                <div className="fees-detail__section-head">
                  <h4>Collection &amp; Status</h4>
                  <MasterManageLink to="/admin/master/payment-mode">Payment modes</MasterManageLink>
                </div>
                <div className="fees-detail__form-grid">
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    size="sm"
                  >
                    {INVOICE_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Select>
                  <Input
                    label="Due date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  <Select
                    label="Payment mode"
                    value={paymentModeId}
                    onChange={(e) => setPaymentModeId(e.target.value)}
                    size="sm"
                  >
                    <option value="">Select mode</option>
                    {(paymentModeOptions || []).map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Select>
                  <Input
                    label="Notes / Service Description"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {!isPaid && !isCancelled && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setCollectOpen(true)}
                      >
                        <FiDollarSign className="w-3.5 h-3.5 mr-1 inline" /> Collect Payment &amp; Receipt
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={handleMarkPaid}
                        loading={saving}
                      >
                        <FiCheckCircle className="w-3.5 h-3.5 mr-1 inline" /> Mark as paid
                      </Button>
                    </>
                  )}
                </div>
              </section>

              {invoice.payments?.length > 0 && (
                <section className="fees-detail__section">
                  <div className="fees-detail__section-head">
                    <h4>Recorded Payments &amp; Official Receipts</h4>
                  </div>
                  <div className="space-y-2 mt-2">
                    {invoice.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {formatMoney(p.amount, invoice.currency)} via {p.mode}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {p.receipts?.[0]?.receiptNo || p.receiptNo} • {new Date(p.paidAt).toLocaleDateString()}
                          </span>
                        </div>
                        {p.receipts?.[0] && (
                          <button
                            type="button"
                            onClick={() => setViewingReceipt(p.receipts[0])}
                            className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold text-xs hover:underline cursor-pointer border border-blue-200/50"
                          >
                            View Receipt Voucher
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </PermissionGate>
          </div>
        )}
      </Modal>

      <CollectPaymentModal
        open={collectOpen}
        onClose={() => setCollectOpen(false)}
        invoice={invoice}
        onSuccess={() => {
          setCollectOpen(false);
          refetch();
          onUpdated?.();
        }}
      />

      <ReceiptModal
        open={Boolean(viewingReceipt)}
        onClose={() => setViewingReceipt(null)}
        receipt={viewingReceipt}
      />
    </>
  );
}
