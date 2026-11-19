import React, { useRef } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { FiPrinter, FiDownload, FiCheck, FiShield } from 'react-icons/fi';
import { formatMoney } from '../config/feesConstants';
import { useCompanyRuntime } from '../../organization/CompanyRuntime';
import { resolvePublicAssetUrl } from '../../../config/company-settings.config';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertChunk(num) {
  let str = '';
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + (num % 10 ? ' ' + ONES[num % 10] : '');
  } else if (num > 0) {
    str += ONES[num];
  }
  return str.trim();
}

function numberToWords(amount, currency = 'USD') {
  const num = Math.round(Number(amount || 0));
  if (num === 0) return `Zero ${currency} Only`;

  if (currency === 'INR') {
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;
    const parts = [];
    if (crore) parts.push(convertChunk(crore) + ' Crore');
    if (lakh) parts.push(convertChunk(lakh) + ' Lakh');
    if (thousand) parts.push(convertChunk(thousand) + ' Thousand');
    if (remainder) parts.push(convertChunk(remainder));
    return `INR ${parts.join(' ')} Only`.replace(/\s+/g, ' ').trim();
  }

  const millions = Math.floor(num / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;
  const parts = [];
  if (millions) parts.push(convertChunk(millions) + ' Million');
  if (thousands) parts.push(convertChunk(thousands) + ' Thousand');
  if (remainder) parts.push(convertChunk(remainder));
  return `${currency} ${parts.join(' ')} Only`.replace(/\s+/g, ' ').trim();
}

export default function ReceiptModal({ open, onClose, receipt }) {
  const printRef = useRef(null);
  const { company } = useCompanyRuntime();

  if (!receipt) return null;

  let details = {};
  try {
    details = typeof receipt.details === 'string' ? JSON.parse(receipt.details) : (receipt.details || {});
  } catch {
    details = {};
  }

  const payment = receipt.payment || {};
  const invoice = payment.invoice || {};
  const student = invoice.student || {};
  const branch = student.branch || {};

  const sName = details.studentName || (student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : 'Walk-in Candidate');
  const sCode = details.studentCode || student.studentCode || 'N/A';
  const sEmail = details.studentEmail || student.email || '—';
  const sPhone = details.studentPhone || student.phone || '—';
  const sCourse = details.course || student.course || 'Educational Consultancy Services';
  const sCountry = details.country || student.country || 'International';

  const invoiceNo = details.invoiceNo || invoice.invoiceNo || 'N/A';
  const currency = details.currency || invoice.currency || 'USD';
  const mode = (details.mode || payment.mode || 'BANK_TRANSFER').replace(/_/g, ' ');
  const refNo = details.referenceNo || payment.referenceNo || 'Direct Settlement';
  const companyName = company?.name || '3ni InfoTech';
  const companyLogo = company?.logo ? resolvePublicAssetUrl(company.logo) : null;
  const companyEmail = company?.email || 'admin@crm.com';
  const companyPhone = company?.phone || branch.phone || '+91 98250 00000';
  const branchName = branch.name || 'Head Office — Ahmedabad';
  const branchCity = branch.city || 'Ahmedabad';

  const subtotal = Number(details.subtotal ?? (invoice.amount || receipt.amount || 0));
  const taxAmount = Number(details.tax ?? (invoice.tax || 0));
  const taxRate = Number(details.taxPercentage ?? (invoice.metadata?.taxPercentage || (subtotal > 0 && taxAmount > 0 ? Math.round((taxAmount / subtotal) * 100) : 0)));
  const totalBilled = Number(details.total ?? (invoice.total || (subtotal + taxAmount)));
  const amountPaid = Number(receipt.amount || 0);
  const remainingBalance = Math.max(0, totalBilled - amountPaid);

  const dateObj = new Date(receipt.createdAt || payment.paidAt || Date.now());
  const dateFormatted = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const amountInWords = numberToWords(amountPaid, currency);

  const handlePrint = () => {
    const win = window.open('', '', 'width=900,height=800');
    if (!win) {
      window.print();
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt — ${receipt.receiptNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 12mm 15mm;
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
              line-height: 1.45;
            }
            .receipt-doc {
              max-width: 820px;
              margin: 0 auto;
              border: 1px solid #0f172a;
              padding: 24px 28px;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 14px;
              margin-bottom: 14px;
            }
            .header-table td {
              vertical-align: top;
            }
            .org-name {
              font-size: 18px;
              font-weight: 800;
              letter-spacing: -0.02em;
              color: #0f172a;
              text-transform: uppercase;
              margin: 0 0 2px 0;
            }
            .org-sub {
              font-size: 10px;
              color: #475569;
              margin: 0 0 2px 0;
              line-height: 1.35;
            }
            .doc-title-cell {
              text-align: right;
            }
            .doc-badge {
              display: inline-block;
              font-size: 9px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              background: #0f172a;
              color: #ffffff;
              padding: 3px 8px;
              border-radius: 3px;
              margin-bottom: 4px;
            }
            .receipt-no {
              font-size: 14px;
              font-weight: 800;
              font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
              color: #0f172a;
              margin: 0;
            }
            .receipt-date {
              font-size: 10px;
              color: #475569;
              margin: 2px 0 0 0;
            }
            .info-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 14px;
            }
            .info-grid td {
              width: 50%;
              vertical-align: top;
            }
            .info-card {
              border: 1px solid #cbd5e1;
              background: #f8fafc;
              padding: 10px 12px;
            }
            .card-title {
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              color: #334155;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
              margin: 0 0 8px 0;
            }
            .data-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-size: 10px;
            }
            .data-label {
              color: #64748b;
            }
            .data-val {
              font-weight: 600;
              color: #0f172a;
              text-align: right;
              max-width: 65%;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .table-wrap {
              margin: 12px 0;
            }
            .line-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #cbd5e1;
            }
            .line-table th {
              background: #f1f5f9;
              color: #0f172a;
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding: 7px 10px;
              border: 1px solid #cbd5e1;
              text-align: left;
            }
            .line-table td {
              padding: 8px 10px;
              border: 1px solid #cbd5e1;
              font-size: 10px;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .amount-strip {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-top: none;
              padding: 8px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
            }
            .words-label {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
            }
            .words-val {
              font-weight: 700;
              color: #0f172a;
              margin-left: 6px;
            }
            .total-callout {
              text-align: right;
            }
            .total-title {
              font-size: 9px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
            }
            .total-figure {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.02em;
            }
            .footer-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 18px;
              padding-top: 12px;
              border-top: 1px solid #cbd5e1;
            }
            .footer-table td {
              vertical-align: bottom;
            }
            .terms-box {
              font-size: 8.5px;
              color: #64748b;
              line-height: 1.4;
              max-width: 440px;
            }
            .terms-title {
              font-weight: 700;
              color: #334155;
              text-transform: uppercase;
              font-size: 8px;
              margin-bottom: 2px;
            }
            .auth-box {
              text-align: center;
              width: 200px;
            }
            .auth-line {
              border-top: 1px solid #0f172a;
              margin-top: 36px;
              padding-top: 4px;
              font-size: 9px;
              font-weight: 700;
              color: #0f172a;
              text-transform: uppercase;
            }
            .auth-sub {
              font-size: 8px;
              color: #64748b;
            }
            .security-stamp {
              border: 1px dashed #94a3b8;
              padding: 4px 8px;
              font-size: 8px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              display: inline-block;
              margin-top: 4px;
              letter-spacing: 0.05em;
            }
          </style>
        </head>
        <body>
          <div class="receipt-doc">
            <table class="header-table">
              <tr>
                <td>
                  <h1 class="org-name">${companyName}</h1>
                  <p class="org-sub">${branchName} · ${branchCity}</p>
                  <p class="org-sub">Contact: ${companyPhone} | Email: ${companyEmail}</p>
                  <p class="org-sub">System Portal · Official Accounting &amp; Compliance</p>
                </td>
                <td class="doc-title-cell">
                  <span class="doc-badge">Official Fee Receipt</span>
                  <p class="receipt-no">${receipt.receiptNo}</p>
                  <p class="receipt-date">Date: ${dateFormatted}, ${timeFormatted}</p>
                  <div class="security-stamp">✓ Verified &amp; Settled</div>
                </td>
              </tr>
            </table>

            <table class="info-grid">
              <tr>
                <td style="padding-right: 6px;">
                  <div class="info-card">
                    <div class="card-title">Candidate Details</div>
                    <div class="data-row">
                      <span class="data-label">Candidate Name:</span>
                      <span class="data-val">${sName}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Student Code:</span>
                      <span class="data-val" style="font-family: monospace;">${sCode}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Phone:</span>
                      <span class="data-val">${sPhone}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Email:</span>
                      <span class="data-val">${sEmail}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Program:</span>
                      <span class="data-val" title="${sCourse}">${sCourse}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Destination Country:</span>
                      <span class="data-val">${sCountry}</span>
                    </div>
                  </div>
                </td>
                <td style="padding-left: 6px;">
                  <div class="info-card">
                    <div class="card-title">Payment &amp; Invoice Reference</div>
                    <div class="data-row">
                      <span class="data-label">Invoice Number:</span>
                      <span class="data-val" style="font-family: monospace;">${invoiceNo}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Payment Date:</span>
                      <span class="data-val">${dateFormatted}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Payment Method:</span>
                      <span class="data-val">${mode}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Ref / UTR Number:</span>
                      <span class="data-val" style="font-family: monospace;">${refNo}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Invoice Total:</span>
                      <span class="data-val">${formatMoney(totalBilled, currency)}</span>
                    </div>
                    <div class="data-row">
                      <span class="data-label">Settlement Status:</span>
                      <span class="data-val">${remainingBalance === 0 ? 'Fully Paid (Settled)' : 'Partial Payment'}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </table>

            <div class="table-wrap">
              <table class="line-table">
                <thead>
                  <tr>
                    <th style="width: 32px;" class="text-center">#</th>
                    <th>Particulars / Description</th>
                    <th style="width: 90px;" class="text-right">Base Fee</th>
                    <th style="width: 90px;" class="text-right">Tax (${taxRate > 0 ? taxRate + '%' : 'Exempt'})</th>
                    <th style="width: 100px;" class="text-right">Total Billed</th>
                    <th style="width: 100px;" class="text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="text-center">01</td>
                    <td>
                      <strong>Tuition &amp; Educational Consultancy Services</strong><br/>
                      <span style="font-size: 8.5px; color: #64748b;">
                        Invoice Ref: ${invoiceNo} · Student ID: ${sCode} · ${sCourse}
                      </span>
                    </td>
                    <td class="text-right">${formatMoney(subtotal, currency)}</td>
                    <td class="text-right">${taxAmount > 0 ? formatMoney(taxAmount, currency) : '—'}</td>
                    <td class="text-right">${formatMoney(totalBilled, currency)}</td>
                    <td class="text-right" style="font-weight: 700;">${formatMoney(amountPaid, currency)}</td>
                  </tr>
                </tbody>
              </table>

              <div class="amount-strip">
                <div>
                  <span class="words-label">Amount in Words:</span>
                  <span class="words-val">${amountInWords}</span>
                </div>
                <div class="total-callout">
                  <span class="total-title">Total Amount Received:&nbsp;</span>
                  <span class="total-figure">${formatMoney(amountPaid, currency)}</span>
                </div>
              </div>
            </div>

            <table class="footer-table">
              <tr>
                <td>
                  <div class="terms-box">
                    <div class="terms-title">Terms &amp; Important Instructions:</div>
                    1. This is an electronically generated official receipt confirming realization of payment.<br/>
                    2. Payment is valid subject to actual fund realization and bank clearance.<br/>
                    3. Fee once paid is subject to institutional policy and agreement terms.<br/>
                    4. This official receipt is valid without physical seal or manual signature.
                  </div>
                </td>
                <td style="text-align: right;">
                  <div class="auth-box" style="margin-left: auto;">
                    <div style="font-size: 8.5px; color: #64748b; margin-bottom: 2px;">For ${companyName}</div>
                    <div class="auth-line">Authorized Signatory</div>
                    <div class="auth-sub">Accounts &amp; Finance Division</div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 350);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Payment Receipt — ${receipt.receiptNo}`}
      size="xl"
      footer={(
        <div className="flex items-center justify-between w-full">
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={FiPrinter}
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              Print / Save PDF
            </Button>
          </div>
        </div>
      )}
    >
      {/* ── Executive Monochrome Official Fee Receipt Preview ── */}
      <div
        ref={printRef}
        className="p-6 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-slate-800 font-sans text-xs shadow-sm max-w-4xl mx-auto"
      >
        {/* Header Strip: Company Details + Document Reference */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b-2 border-slate-900 dark:border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              {companyLogo && (
                <img src={companyLogo} alt="" className="w-8 h-8 object-contain rounded" />
              )}
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase m-0">
                {companyName}
              </h2>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 mb-0">
              {branchName} · {branchCity}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-0">
              Contact: {companyPhone} | Email: {companyEmail}
            </p>
          </div>

          <div className="text-left sm:text-right w-full sm:w-auto">
            <span className="inline-block bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider mb-1">
              Official Fee Receipt
            </span>
            <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
              {receipt.receiptNo}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {dateFormatted}, {timeFormatted}
            </div>
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
              <FiCheck className="w-3 h-3 text-slate-800 dark:text-slate-200" /> Payment Realized
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid: Candidate & Invoice Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5 m-0">
              Candidate Details
            </h4>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Candidate Name:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{sName}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Student ID / Code:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{sCode}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Phone &amp; Email:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[65%] text-right">
                {sPhone} {sEmail !== '—' ? `· ${sEmail}` : ''}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Target Program:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[65%] text-right" title={sCourse}>
                {sCourse}
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Destination Country:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{sCountry}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-1.5 m-0">
              Payment &amp; Invoice Reference
            </h4>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Invoice Number:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{invoiceNo}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Payment Date:</span>
              <span className="text-slate-800 dark:text-slate-200">{dateFormatted}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{mode}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Ref / Transaction ID:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{refNo}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Total Invoice Value:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatMoney(totalBilled, currency)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Settlement Status:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {remainingBalance === 0 ? 'Fully Paid (Settled)' : 'Partial Payment'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Ledger Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden my-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-2 px-3 text-center w-10 border-r border-slate-200 dark:border-slate-700">#</th>
                <th className="py-2 px-3 border-r border-slate-200 dark:border-slate-700">Particulars / Description</th>
                <th className="py-2 px-3 text-right w-28 border-r border-slate-200 dark:border-slate-700">Base Fee</th>
                <th className="py-2 px-3 text-right w-28 border-r border-slate-200 dark:border-slate-700">
                  Tax ({taxRate > 0 ? `${taxRate}%` : 'Exempt'})
                </th>
                <th className="py-2 px-3 text-right w-32 border-r border-slate-200 dark:border-slate-700">Total Billed</th>
                <th className="py-2 px-3 text-right w-32">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
              <tr>
                <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-slate-500">01</td>
                <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Tuition &amp; Educational Consultancy Services
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Invoice: {invoiceNo} · Candidate ID: {sCode} · {sCourse}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-800 font-medium">
                  {formatMoney(subtotal, currency)}
                </td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-800 font-medium">
                  {taxAmount > 0 ? formatMoney(taxAmount, currency) : '—'}
                </td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200 dark:border-slate-800 font-medium">
                  {formatMoney(totalBilled, currency)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                  {formatMoney(amountPaid, currency)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Amount In Words & Amount Highlight Strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Amount Received in Words:
              </span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {amountInWords}
              </span>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Total Amount Received
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {formatMoney(amountPaid, currency)}
              </span>
            </div>
          </div>
        </div>

        {details.notes && (
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] mb-4">
            <span className="font-bold text-slate-700 dark:text-slate-300">Notes / Remarks: </span>
            {details.notes}
          </div>
        )}

        {/* Legal Disclaimer & Authorized Signature */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-[10px] text-slate-500 dark:text-slate-400">
          <div className="max-w-md space-y-0.5 text-[9.5px] leading-relaxed">
            <span className="font-bold text-slate-700 dark:text-slate-300 uppercase block text-[9px]">
              Terms &amp; Conditions
            </span>
            <p className="m-0">1. This receipt confirms realization of payment towards educational services.</p>
            <p className="m-0">2. All payments are subject to actual fund realization and institutional policy.</p>
            <p className="m-0">3. This is a computer-generated document and requires no physical signature.</p>
          </div>

          <div className="text-center w-48 sm:self-end">
            <div className="text-[9px] text-slate-500 dark:text-slate-400 mb-1">
              For {companyName}
            </div>
            <div className="border-t border-slate-900 dark:border-slate-100 pt-1 font-bold text-slate-900 dark:text-white text-[10px] uppercase">
              Authorized Signatory
            </div>
            <div className="text-[8.5px] text-slate-400">
              Accounts &amp; Finance Division
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
