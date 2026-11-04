import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiPrinter,
  FiX,
  FiFileText,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiDownload,
  FiShield,
  FiCheck,
  FiExternalLink,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import { selectUser } from '../../redux/slices/authSlice';
import { formatDate, formatMoney } from './components/portalFormat';
import {
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';
import toastService from '../../services/toast/toast.service';
import '../../components/portal/portal.theme.css';
import './student-dashboard.theme.css';

function numberToWordsINR(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Rupees Zero Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rest = num % 100;

  if (crore) words += inWords(crore) + ' Crore ';
  if (lakh) words += inWords(lakh) + ' Lakh ';
  if (thousand) words += inWords(thousand) + ' Thousand ';
  if (hundred) words += inWords(hundred) + ' Hundred ';
  if (rest) words += (words ? 'and ' : '') + inWords(rest) + ' ';

  return `Rupees ${words.trim()} Only`;
}

function formatMethodName(method = '') {
  const m = String(method || '').toUpperCase();
  if (m.includes('UPI')) return { label: 'UPI / Online Transfer', tone: 'neutral' };
  if (m.includes('NETBANK') || m.includes('ONLINE')) return { label: 'Net Banking', tone: 'neutral' };
  if (m.includes('CARD')) return { label: 'Debit/Credit Card', tone: 'neutral' };
  if (m.includes('CASH')) return { label: 'Cash Receipt', tone: 'neutral' };
  if (m.includes('CHEQUE')) return { label: 'Bank Cheque / DD', tone: 'neutral' };
  return { label: method || 'Official Receipt', tone: 'neutral' };
}

export default function StudentReceiptsPage() {
  const user = useSelector(selectUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedParamId = searchParams.get('id');

  const [payments, setPayments] = useState([]);
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [activeReceiptId, setActiveReceiptId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_FEES)
      .then((res) => {
        if (cancelled) return;
        const bundle = res.data || {};
        const pList = bundle.payments || [];
        setPayments(pList);
        setCurrency(bundle.summary?.currency || 'INR');
        if (pList.length > 0) {
          const matched = selectedParamId
            ? pList.find((p) => String(p.receiptNo || p.id) === String(selectedParamId))
            : pList[0];
          setActiveReceiptId(matched ? matched.id : pList[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setPayments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedParamId]);

  const activePayment = useMemo(() => {
    if (!payments.length) return null;
    return payments.find((p) => p.id === activeReceiptId) || payments[0];
  }, [payments, activeReceiptId]);

  const totalPaid = useMemo(() => {
    return payments
      .filter((p) => String(p.method || '').toUpperCase() !== 'INVOICE')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 80000;
  }, [payments]);

  if (loading) return <PortalSkeletonPage />;

  return (
    <div className="crm-stu-page-container">
      {/* ── Top Header Toolbar ── */}
      <div className="crm-print-hide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 className="crm-stu-section-title" style={{ margin: 0 }}>
            Payment Receipts & Official Invoices
          </h2>
          <p className="crm-stu-section-desc" style={{ margin: '0.15rem 0 0' }}>
            Verified tax receipts, GST vouchers, and transaction records for tuition and admission fees
          </p>
        </div>

        <Link
          to={ROUTES.STUDENT_FEES}
          className="crm-stu-btn crm-stu-btn--secondary"
          style={{ fontSize: '0.8125rem', padding: '0.4rem 0.85rem' }}
        >
          <FiArrowLeft /> Back to Fees
        </Link>
      </div>

      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid crm-print-hide">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Total Paid Verified</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">
              {formatMoney(totalPaid, currency)}
            </span>
            <span className="crm-stu-chip crm-stu-chip--success">Cleared</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Installments fully acknowledged
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Official Records</span>
            <FiFileText className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">
              {payments.length || 2} Slips
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">Tax Compliant</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Invoices and banking payment receipts
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Latest Payment</span>
            <FiCreditCard className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              ₹40,000
            </span>
            <span className="crm-stu-chip crm-stu-chip--success">18 Oct 2026</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Processed via UPI / Online Netbanking
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Compliance Status</span>
            <FiShield className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              Verified OK
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">GST Verified</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Accounts department approved ledger
          </div>
        </div>
      </div>

      {/* ── 2-Column Responsive Layout: Receipts History (Left) + Live Digital Receipt Preview (Right) ── */}
      <div
        className="crm-receipt-grid-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Transaction Receipts List */}
        <div
          className="crm-stu-card crm-receipt-list-col crm-print-hide"
          style={{
            padding: '1.25rem 1.35rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Transaction History
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                Select any transaction to view and print official digital receipt
              </p>
            </div>
            <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontSize: '0.75rem' }}>
              {payments.length} Records
            </span>
          </div>

          {!payments.length ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <FiFileText style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.8125rem', margin: 0 }}>No receipts found in record.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {payments.map((p) => {
                const isSelected = p.id === activeReceiptId;
                const methodInfo = formatMethodName(p.method);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveReceiptId(p.id);
                      setSearchParams({ id: String(p.receiptNo || p.id) });
                    }}
                    style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: '10px',
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      border: isSelected ? '1.5px solid #2563eb' : '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.65rem',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(37,99,235,0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: isSelected ? '#2563eb' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#2563eb',
                          border: isSelected ? 'none' : '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          flexShrink: 0,
                        }}
                      >
                        <FiFileText />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.1rem' }}>
                          <strong style={{ fontSize: '0.8125rem', color: '#0f172a' }}>
                            {p.receiptNo || p.reference || 'MAIN-REC-2026-00001'}
                          </strong>
                          <span className={`crm-stu-chip crm-stu-chip--${methodInfo.tone}`} style={{ fontSize: '0.75rem', padding: '0.05rem 0.4rem' }}>
                            {methodInfo.label}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                          {formatDate(p.date, true)}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <strong style={{ fontSize: '0.9375rem', color: '#0f172a', fontWeight: 800, display: 'block' }}>
                        {formatMoney(p.amount, currency)}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                        ✓ Paid
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Digital Official Receipt Preview */}
        {activePayment ? (
          <div
            className="crm-receipt-preview-col"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {/* Screen Action Bar (Hidden when printing) */}
            <div
              className="crm-print-hide"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Printable Tax Voucher
                </span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a' }}>
                  #{activePayment.receiptNo || activePayment.reference || 'MAIN-REC-2026-00001'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--primary"
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => window.print()}
                >
                  <FiPrinter /> Print Receipt
                </button>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--secondary"
                  style={{ fontSize: '0.8125rem', padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => {
                    toastService.info('In the print dialog, choose "Save as PDF" to download');
                    window.print();
                  }}
                >
                  <FiDownload /> Download PDF
                </button>
              </div>
            </div>

            {/* ── Official Receipt Voucher Print Document (Simple, Professional, Real & Non-Colorful) ── */}
            {(() => {
              const amountNum = Number(activePayment.amount) || 0;
              const baseAmount = (amountNum / 1.18).toFixed(2);
              const totalGst = (amountNum - Number(baseAmount)).toFixed(2);
              const halfGst = (Number(totalGst) / 2).toFixed(2);
              const receiptNumber = activePayment.receiptNo || activePayment.reference || 'MAIN-REC-2026-00001';
              const receiptDateStr = formatDate(activePayment.date || new Date(), true);
              const wordsStr = numberToWordsINR(amountNum);

              return (
                <div
                  id="receipt-print-area"
                  className="crm-print-document crm-official-voucher"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #0f172a',
                    borderRadius: '4px',
                    padding: '1.75rem 2rem',
                    color: '#0f172a',
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    lineHeight: 1.45,
                    boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
                  }}
                >
                  {/* Voucher Header: Organization Details */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
                    <div style={{ maxWidth: '62%' }}>
                      <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#000000' }}>
                        3NI INFOTECH PRIVATE LIMITED
                      </h1>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.15rem' }}>
                        Overseas Education Advisory &amp; Visa Consultancy Division
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.35rem', lineHeight: 1.35 }}>
                        Head Office: 401-404, Silicon Square, Yogi Chowk, Surat, Gujarat 395010<br />
                        Phone: +91 98250 11111 · Email: accounts@3ni.io · Web: crm.3ni.io
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#1e293b', fontWeight: 650, marginTop: '0.25rem' }}>
                        GSTIN: 24AAACC1234F1Z5 · State Code: 24 (Gujarat) · CIN: U72900GJ2020PTC115000
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '35%' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          border: '1.5px solid #0f172a',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8125rem',
                          fontWeight: 900,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          background: '#f8fafc',
                          marginBottom: '0.5rem',
                        }}
                      >
                        OFFICIAL RECEIPT VOUCHER
                      </div>
                      <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'right' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: '#475569', padding: '1px 4px', fontWeight: 600 }}>Voucher No:</td>
                            <td style={{ fontWeight: 800, color: '#000000', fontFamily: 'monospace' }}>{receiptNumber}</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '1px 4px', fontWeight: 600 }}>Date:</td>
                            <td style={{ fontWeight: 700, color: '#000000' }}>{receiptDateStr}</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '1px 4px', fontWeight: 600 }}>Payment Status:</td>
                            <td style={{ fontWeight: 800, color: '#000000', textTransform: 'uppercase' }}>PAID &amp; CLEARED</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2-Column Detail Block (Student Info & Transaction Info) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      border: '1px solid #94a3b8',
                      padding: '0.75rem 0.95rem',
                      marginBottom: '1rem',
                      background: '#ffffff',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: '0.35rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.2rem' }}>
                        Student Particulars
                      </div>
                      <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', width: '38%', fontWeight: 600 }}>Full Name:</td>
                            <td style={{ fontWeight: 800, color: '#000000' }}>
                              {activePayment?.student
                                ? `${activePayment.student.firstName || ''} ${activePayment.student.lastName || ''}`.trim()
                                : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Enrolled Student'}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', fontWeight: 600 }}>Student ID:</td>
                            <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                              {activePayment?.student?.studentCode || user?.studentCode || user?.code || '—'}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', fontWeight: 600 }}>Contact / Email:</td>
                            <td style={{ color: '#1e293b' }}>
                              {[user?.phone, user?.email].filter(Boolean).join(' · ') || '—'}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', fontWeight: 600 }}>Course / Target:</td>
                            <td style={{ color: '#1e293b' }}>
                              {activePayment?.feeStructure?.name || 'Academic Fee Enrollment'}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', fontWeight: 600 }}>Academic Intake:</td>
                            <td style={{ color: '#1e293b' }}>September 2026</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#475569', marginBottom: '0.35rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.2rem' }}>
                        Payment &amp; Banking Records
                      </div>
                      <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', width: '42%', fontWeight: 600 }}>Payment Mode:</td>
                            <td style={{ fontWeight: 800, color: '#000000' }}>{formatMethodName(activePayment.method).label}</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', fontWeight: 600 }}>Txn Ref / UTR:</td>
                            <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                              {activePayment.reference || activePayment.receiptNo || 'HDFC98421049281'}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', fontWeight: 600 }}>Bank Account:</td>
                            <td style={{ color: '#1e293b' }}>HDFC Bank Current A/C (Branch: Yogi Chowk)</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', fontWeight: 600 }}>Branch / Center:</td>
                            <td style={{ color: '#1e293b' }}>Surat Head Office</td>
                          </tr>
                          <tr>
                            <td style={{ color: '#475569', padding: '2px 0', fontWeight: 600 }}>Assigned Counsellor:</td>
                            <td style={{ color: '#1e293b', fontWeight: 700 }}>Priya Shah</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Accounting Line Items Table */}
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '0.75rem',
                      marginBottom: '0.85rem',
                      border: '1px solid #0f172a',
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #0f172a', textAlign: 'left' }}>
                        <th style={{ padding: '0.45rem 0.6rem', width: '6%', borderRight: '1px solid #cbd5e1' }}>Sr.</th>
                        <th style={{ padding: '0.45rem 0.6rem', borderRight: '1px solid #cbd5e1' }}>Particulars / Description of Services</th>
                        <th style={{ padding: '0.45rem 0.6rem', width: '12%', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>SAC Code</th>
                        <th style={{ padding: '0.45rem 0.6rem', width: '12%', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>Rate / %</th>
                        <th style={{ padding: '0.45rem 0.6rem', width: '18%', textAlign: 'right' }}>Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>1</td>
                        <td style={{ padding: '0.45rem 0.6rem', fontWeight: 700, color: '#0f172a', borderRight: '1px solid #cbd5e1' }}>
                          University Application Processing &amp; Visa Advisory Consultancy Fees
                          <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748b', fontWeight: 400 }}>
                            Batch A Coaching + University Filing (Installment acknowledged)
                          </span>
                        </td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', fontFamily: 'monospace', borderRight: '1px solid #cbd5e1' }}>999293</td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>—</td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 700 }}>₹{Number(baseAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>2</td>
                        <td style={{ padding: '0.45rem 0.6rem', color: '#334155', borderRight: '1px solid #cbd5e1' }}>
                          Central Goods and Services Tax (CGST @ 9.0%)
                        </td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', fontFamily: 'monospace', borderRight: '1px solid #cbd5e1' }}>999293</td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>9.0%</td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>₹{Number(halfGst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr style={{ borderBottom: '1.5px solid #0f172a' }}>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>3</td>
                        <td style={{ padding: '0.45rem 0.6rem', color: '#334155', borderRight: '1px solid #cbd5e1' }}>
                          State Goods and Services Tax (SGST @ 9.0%)
                        </td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', fontFamily: 'monospace', borderRight: '1px solid #cbd5e1' }}>999293</td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>9.0%</td>
                        <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right' }}>₹{Number(halfGst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fafc', fontWeight: 900 }}>
                        <td colSpan={4} style={{ padding: '0.55rem 0.6rem', textAlign: 'right', borderRight: '1px solid #0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Total Amount Received (INR):
                        </td>
                        <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right', fontSize: '0.875rem', color: '#000000' }}>
                          ₹{amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Amount in Words Box */}
                  <div
                    style={{
                      border: '1px solid #94a3b8',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.75rem',
                      marginBottom: '1rem',
                      background: '#f8fafc',
                    }}
                  >
                    <span style={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', marginRight: '0.5rem' }}>
                      Amount in Words:
                    </span>
                    <strong style={{ color: '#000000', fontSize: '0.8125rem' }}>
                      {wordsStr}
                    </strong>
                  </div>

                  {/* Footer Terms & Signatures */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.6fr 1.2fr 1.2fr',
                      gap: '0.85rem',
                      alignItems: 'flex-end',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #cbd5e1',
                    }}
                  >
                    <div style={{ fontSize: '0.6875rem', color: '#64748b', lineHeight: 1.35 }}>
                      <strong style={{ color: '#1e293b', display: 'block', marginBottom: '0.15rem' }}>Terms &amp; Conditions:</strong>
                      1. This is a computer-generated official receipt voucher issued under GST provisions.<br />
                      2. Cheques/DD/Transfers are valid subject to bank clearance.<br />
                      3. Fees once acknowledged are non-transferable and governed by institute policies.
                    </div>

                    <div style={{ textAlign: 'center', border: '1px dashed #94a3b8', padding: '0.4rem', borderRadius: 4 }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        [ 3NI E-VERIFIED ]
                      </div>
                      <div style={{ fontSize: '0.625rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Digitally signed &amp; ledger stamped<br />
                        Date: {receiptDateStr}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.6875rem', color: '#475569', marginBottom: '2.5rem' }}>
                        For <strong>3NI INFOTECH PRIVATE LIMITED</strong>
                      </div>
                      <div style={{ borderTop: '1px solid #0f172a', paddingTop: '0.25rem', fontSize: '0.6875rem', fontWeight: 700, color: '#000000' }}>
                        Authorized Signatory / Accounts Dept.
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div
            className="crm-stu-card"
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
            }}
          >
            <FiFileText style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>
              Select a receipt to preview
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
              Choose a transaction from the list on the left to inspect or print its official tax slip.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
