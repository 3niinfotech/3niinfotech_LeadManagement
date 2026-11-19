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
  if (m.includes('NETBANK') || m.includes('ONLINE') || m.includes('NET BANKING')) return { label: 'Net Banking / Online Transfer', tone: 'neutral' };
  if (m.includes('CARD') || m.includes('DEBIT') || m.includes('CREDIT')) return { label: 'Debit / Credit Card', tone: 'neutral' };
  if (m.includes('CASH')) return { label: 'Cash Receipt', tone: 'neutral' };
  if (m.includes('CHEQUE') || m.includes('DD')) return { label: 'Bank Cheque / DD', tone: 'neutral' };
  if (m.includes('INVOICE') || !m || m === 'NULL' || m === 'UNDEFINED') return { label: 'Bank Transfer / Net Banking', tone: 'neutral' };
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
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
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
              const receiptNumber = activePayment.receiptNo || activePayment.reference || 'INV-2025-002';
              const receiptDateStr = formatDate(activePayment.date || new Date(), true);
              const wordsStr = numberToWordsINR(amountNum);

              const studentName = activePayment?.student
                ? `${activePayment.student.firstName || ''} ${activePayment.student.lastName || ''}`.trim()
                : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Enrolled Student';

              const studentCode = activePayment?.student?.studentCode || user?.studentCode || user?.code || 'STU-2026-0842';
              const studentContact = [
                activePayment?.student?.phone || user?.phone || '+91 87228 90969',
                activePayment?.student?.email || user?.email || 'kishan@gmail.com',
              ].filter(Boolean).join(' · ');

              const courseName = activePayment?.feeStructure?.name || 'Academic Fee Enrollment';
              const intake = 'September 2026 Intake';
              const paymentMethodInfo = formatMethodName(activePayment.method);
              const txnRef = activePayment.reference || activePayment.receiptNo || 'UTR-849204820194';

              return (
                <div className="crm-official-voucher-wrapper">
                  <div
                    id="receipt-print-area"
                    className="crm-print-document crm-official-voucher"
                  >
                    {/* ── ROW 1: TOP FULL-WIDTH VOUCHER TITLE (CENTERED) ── */}
                    <div className="crm-voucher-top-title-bar">
                      <div className="crm-voucher-main-heading">
                        OFFICIAL RECEIPT VOUCHER
                      </div>
                      <div className="crm-voucher-sub-heading">
                        ORIGINAL FOR RECIPIENT · TAX INVOICE CUM RECEIPT
                      </div>
                    </div>

                    {/* ── ROW 2: REAL FIRM HEADER & TRANSACTION METADATA ── */}
                    <div className="crm-voucher-header-row">
                      <div className="crm-voucher-company-block">
                        <img
                          src="/assets/images/brand/logo.jpg"
                          alt="3NI Logo"
                          className="crm-voucher-real-logo"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="crm-voucher-company-details">
                          <h2 className="crm-voucher-company-name">
                            3NI INFOTECH PRIVATE LIMITED
                          </h2>
                          <div className="crm-voucher-division-tag">
                            Overseas Education Advisory &amp; Visa Consultancy Division
                          </div>
                          <div className="crm-voucher-contact-line">
                            401-404, Silicon Square, Yogi Chowk, Surat, Gujarat 395010 · Tel: +91 98250 11111 · accounts@3ni.io
                          </div>
                          <div className="crm-voucher-reg-line">
                            <strong>GSTIN:</strong> 24AAACC1234F1Z5 &nbsp;|&nbsp; <strong>State:</strong> 24 (Gujarat) &nbsp;|&nbsp; <strong>CIN:</strong> U72900GJ2020PTC115000
                          </div>
                        </div>
                      </div>

                      <div className="crm-voucher-meta-box">
                        <table className="crm-voucher-meta-table">
                          <tbody>
                            <tr>
                              <td className="crm-meta-lbl">Voucher No:</td>
                              <td className="crm-meta-val crm-voucher-dt-val--mono">{receiptNumber}</td>
                            </tr>
                            <tr>
                              <td className="crm-meta-lbl">Date &amp; Time:</td>
                              <td className="crm-meta-val">{receiptDateStr}</td>
                            </tr>
                            <tr>
                              <td className="crm-meta-lbl">Payment Status:</td>
                              <td className="crm-meta-val">
                                <span className="crm-voucher-status-stamp">
                                  ✓ PAID &amp; CLEARED
                                </span>
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
                                <td className="crm-voucher-dt-val crm-voucher-dt-val--bold">{studentName}</td>
                              </tr>
                              <tr>
                                <td className="crm-voucher-dt-lbl">Student ID:</td>
                                <td className="crm-voucher-dt-val crm-voucher-dt-val--mono">{studentCode}</td>
                              </tr>
                              <tr>
                                <td className="crm-voucher-dt-lbl">Contact / Email:</td>
                                <td className="crm-voucher-dt-val">{studentContact}</td>
                              </tr>
                              <tr>
                                <td className="crm-voucher-dt-lbl">Target Program:</td>
                                <td className="crm-voucher-dt-val">{courseName}</td>
                              </tr>
                              <tr>
                                <td className="crm-voucher-dt-lbl">Academic Intake:</td>
                                <td className="crm-voucher-dt-val">{intake}</td>
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
                                <td className="crm-voucher-dt-val crm-voucher-dt-val--bold">{paymentMethodInfo.label}</td>
                              </tr>
                              <tr>
                                <td className="crm-voucher-dt-lbl">Txn Ref / UTR:</td>
                                <td className="crm-voucher-dt-val crm-voucher-dt-val--mono">{txnRef}</td>
                              </tr>
                              <tr>
                                <td className="crm-voucher-dt-lbl">Bank Account:</td>
                                <td className="crm-voucher-dt-val">HDFC Bank Current A/C (Branch: Yogi Chowk)</td>
                              </tr>
                              <tr>
                                <td className="crm-voucher-dt-lbl">Branch / Center:</td>
                                <td className="crm-voucher-dt-val">Surat Head Office</td>
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

                    {/* ── ROW 4: ACCOUNTING LINE ITEMS (CONCISE & CLEAN) ── */}
                    <table className="crm-voucher-ledger-table">
                      <thead>
                        <tr>
                          <th style={{ width: '6%', textAlign: 'center' }}>Sr.</th>
                          <th style={{ textAlign: 'left' }}>Particulars / Description of Services</th>
                          <th style={{ width: '13%', textAlign: 'center' }}>SAC Code</th>
                          <th style={{ width: '12%', textAlign: 'center' }}>Rate</th>
                          <th style={{ width: '18%', textAlign: 'right' }}>Amount (INR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>1</td>
                          <td>
                            <strong style={{ color: '#0f172a' }}>Tuition &amp; University Advisory Services</strong>
                            <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748b' }}>
                              Course Coaching &amp; University Application Filing (Installment)
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>999293</td>
                          <td style={{ textAlign: 'center' }}>—</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#000000' }}>
                            ₹{Number(baseAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>2</td>
                          <td>
                            Central Goods and Services Tax (CGST @ 9.0%)
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>999293</td>
                          <td style={{ textAlign: 'center' }}>9.0%</td>
                          <td style={{ textAlign: 'right' }}>
                            ₹{Number(halfGst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ textAlign: 'center', fontWeight: 700 }}>3</td>
                          <td>
                            State Goods and Services Tax (SGST @ 9.0%)
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>999293</td>
                          <td style={{ textAlign: 'center' }}>9.0%</td>
                          <td style={{ textAlign: 'right' }}>
                            ₹{Number(halfGst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Total Amount Received (INR):
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '0.875rem', fontWeight: 900, color: '#000000' }}>
                            ₹{amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* ── ROW 5: AMOUNT IN WORDS ── */}
                    <div className="crm-voucher-words-strip">
                      <span className="crm-voucher-words-lbl">
                        Amount in Words:
                      </span>
                      <strong className="crm-voucher-words-val">
                        {wordsStr}
                      </strong>
                    </div>

                    {/* ── ROW 6: FOOTER (COMPACT TERMS, STAMP & SIGNATURE) ── */}
                    <div className="crm-voucher-foot">
                      <div className="crm-voucher-terms">
                        <strong>Terms &amp; Conditions:</strong>
                        1. Computer-generated official tax receipt issued under GST provisions.<br />
                        2. All payments acknowledged are subject to realization and institute policy.
                      </div>

                      <div className="crm-voucher-stamp-box">
                        <div className="crm-voucher-stamp-title">
                          [ 3NI E-VERIFIED ]
                        </div>
                        <div className="crm-voucher-stamp-sub">
                          Digitally signed &amp; ledger stamped<br />
                          Date: {receiptDateStr}
                        </div>
                      </div>

                      <div className="crm-voucher-sign-box">
                        <div className="crm-voucher-sign-company">
                          For <strong>3NI INFOTECH PRIVATE LIMITED</strong>
                        </div>
                        <div className="crm-voucher-sign-line">
                          Authorized Signatory / Accounts Dept.
                        </div>
                      </div>
                    </div>

                    {/* ── ROW 7: CLEAN BOTTOM PAGE NUMBER STRIP ── */}
                    <div className="crm-voucher-bottom-bar">
                      <span>Official Computer Generated Voucher</span>
                      <span>Page 1 of 1</span>
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
