import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiDollarSign,
  FiFileText,
  FiCreditCard,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiArrowRight,
  FiDownload,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import toastService from '../../services/toast/toast.service';
import { initiateRazorpayPayment } from '../../services/razorpay/razorpay.service';
import {
  PortalSkeletonPage,
  PortalEmpty,
} from '../../components/portal/PortalUi';
import { formatDate, formatMoney } from './components/portalFormat';
import './student-dashboard.theme.css';

export default function StudentFeesPage() {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payProcessing, setPayProcessing] = useState(false);

  const fetchFees = useCallback(async () => {
    try {
      const res = await apiGet(API.PORTAL_STUDENT_FEES);
      if (res?.data) setBundle(res.data);
    } catch {
      // Retain state
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_FEES)
      .then((res) => {
        if (!cancelled) setBundle(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setBundle(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = bundle?.summary || {
    totalFees: 120000,
    paid: 80000,
    pending: 40000,
    nextDueAmount: 40000,
    nextDueDate: '2026-12-29T00:00:00.000Z',
    currency: 'INR',
  };

  const currency = summary.currency || 'INR';
  const invoices = bundle?.invoices || [];
  const payments = bundle?.payments || [];
  const installments = bundle?.installments || [];

  const totalFeesNum = Number(summary.totalFees) || 120000;
  const paidNum = Number(summary.paid) || 80000;
  const pendingNum = Math.max(0, totalFeesNum - paidNum);
  const paidPercent = totalFeesNum > 0 ? Math.round((paidNum / totalFeesNum) * 100) : 67;

  const donutData = useMemo(() => [
    { name: 'Paid', value: paidNum, fill: '#10b981' },
    { name: 'Pending', value: pendingNum, fill: '#f59e0b' },
  ], [paidNum, pendingNum]);

  const handlePayNow = () => {
    const rawDue = Number(summary.nextDueAmount || pendingNum) || 40000;
    initiateRazorpayPayment({
      amount: rawDue,
      description: 'Fee Installment Payment - Aarav Patel',
      onProcessing: setPayProcessing,
      onSuccess: () => {
        toastService.success(`Payment of ₹${rawDue.toLocaleString('en-IN')} completed successfully!`);
        fetchFees();
        window.dispatchEvent(new Event('crm-dashboard-update'));
      },
      onError: (errMsg) => {
        toastService.error(errMsg || 'Payment was not completed');
      },
    });
  };

  if (loading) return <PortalSkeletonPage />;

  return (
    <div className="crm-stu-page-container">
      {/* ── 4 Top KPI Stat Cards ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Total Program Fees</span>
            <FiDollarSign className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">
              {formatMoney(totalFeesNum, currency)}
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">Fixed Tuition</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Comprehensive admission & coaching package
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Paid Amount</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">
              {formatMoney(paidNum, currency)}
            </span>
            <span className="crm-stu-chip crm-stu-chip--success">{paidPercent}% Cleared</span>
          </div>
          <div className="crm-stu-progress-track" style={{ marginTop: '0.55rem' }}>
            <div className="crm-stu-progress-fill--ok" style={{ width: `${paidPercent}%` }} />
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Remaining Balance</span>
            <FiClock className="crm-stu-att-kpi-card__icon--amber" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value">
              {formatMoney(pendingNum, currency)}
            </span>
            <span className="crm-stu-chip crm-stu-chip--amber">
              {pendingNum === 0 ? 'All Clear' : '1 Installment'}
            </span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            {pendingNum === 0 ? 'No outstanding dues' : 'Final installment pending'}
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Next Due Date</span>
            <FiCreditCard className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.25rem' }}>
              {summary.nextDueDate ? formatDate(summary.nextDueDate) : '29 Dec 2026'}
            </span>
            <span className="crm-stu-chip crm-stu-chip--neutral">
              {formatMoney(summary.nextDueAmount || pendingNum, currency)}
            </span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.45rem', fontSize: '0.8125rem' }}>
            Scheduled milestone payment
          </div>
        </div>
      </div>

      {/* ── 2-Column Section: Payment Standing & Schedule + Donut Allocation & Pay Card ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem',
          alignItems: 'stretch',
        }}
      >
        {/* Left: Payment Standing & Milestone Steps */}
        <div
          className="crm-stu-card"
          style={{
            padding: '1.25rem 1.35rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Payment Progress & Health
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                  {paidPercent}% of overall program fees settled
                </p>
              </div>
              <span className="crm-stu-chip crm-stu-chip--success" style={{ fontSize: '0.75rem', fontWeight: 750 }}>
                Good Standing
              </span>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 750, color: '#0f172a' }}>
                  Fee Clearance Progress
                </span>
                <strong style={{ fontSize: '0.875rem', color: '#059669' }}>
                  {paidPercent}%
                </strong>
              </div>
              <div className="crm-stu-progress-track" style={{ height: 8 }}>
                <div className="crm-stu-progress-fill--ok" style={{ width: `${paidPercent}%` }} />
              </div>
            </div>

            {/* Installment Milestones List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {installments.map((inst, idx) => {
                const isPaid = inst.status === 'PAID';
                return (
                  <div
                    key={inst.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.75rem',
                      background: isPaid ? '#f8fafc' : '#fffbeb',
                      borderRadius: '8px',
                      border: isPaid ? '1px solid #f1f5f9' : '1px solid #fde68a',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: isPaid ? '#dcfce7' : '#fef3c7',
                          color: isPaid ? '#059669' : '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {isPaid ? <FiCheck /> : idx + 1}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>
                          {inst.title || `Installment ${idx + 1}`}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Due: {formatDate(inst.dueDate)}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block' }}>
                        {formatMoney(inst.amount, currency)}
                      </strong>
                      <span
                        className={`crm-stu-chip crm-stu-chip--${isPaid ? 'success' : 'amber'}`}
                        style={{ fontSize: '0.75rem', padding: '0.1rem 0.45rem' }}
                      >
                        {isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9', marginTop: '0.85rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              All payments secured via Razorpay & Bank Transfer
            </span>
            <Link
              to={ROUTES.STUDENT_RECEIPTS}
              className="crm-stu-btn crm-stu-btn--secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              <FiFileText /> View All Receipts
            </Link>
          </div>
        </div>

        {/* Right: Clean Donut Chart & Pay Now Center */}
        <div
          className="crm-stu-card"
          style={{
            padding: '1.25rem 1.35rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Fee Distribution
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                  Paid vs pending balance breakdown
                </p>
              </div>
              <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
                Summary
              </span>
            </div>

            {/* Donut Chart with Perfectly Centered Text & No Clipping */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 180,
                margin: '0.5rem 0',
              }}
            >
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div
                style={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 850, color: '#0f172a', lineHeight: 1.1 }}>
                  {formatMoney(totalFeesNum, currency)}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Total Package
                </span>
              </div>
            </div>

            {/* Legend Chips without Clashing */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                  Paid: {formatMoney(paidNum, currency)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                  Pending: {formatMoney(pendingNum, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Box: Pay Next Installment */}
          <div
            style={{
              background: pendingNum > 0 ? 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' : '#f8fafc',
              border: pendingNum > 0 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 750, display: 'block' }}>
                {pendingNum > 0 ? 'Next Installment Due' : 'Account Status'}
              </span>
              <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>
                {pendingNum > 0 ? `${formatMoney(summary.nextDueAmount || pendingNum, currency)} · Due 29 Dec 2026` : 'All Installments Settled'}
              </strong>
            </div>

            {pendingNum > 0 ? (
              <button
                type="button"
                disabled={payProcessing}
                onClick={handlePayNow}
                className="crm-stu-btn crm-stu-btn--primary"
                style={{
                  background: '#059669',
                  borderColor: '#059669',
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.8125rem',
                  fontWeight: 750,
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                }}
              >
                <FiCreditCard />
                {payProcessing ? 'Processing...' : `Pay Now (${formatMoney(summary.nextDueAmount || pendingNum, currency)})`}
              </button>
            ) : (
              <span className="crm-stu-chip crm-stu-chip--success" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                <FiCheck /> Fully Paid
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 2-Column Section: Installment Schedule (Left) + Official Invoices (Right) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Scheduled Installments */}
        <div
          className="crm-stu-card"
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
                Installment Schedule
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                Milestone breakdown for coaching, admissions & visa filing
              </p>
            </div>
            <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontSize: '0.75rem' }}>
              {installments.length} Installments
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.55rem 0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Title
                  </th>
                  <th style={{ padding: '0.55rem 0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Amount
                  </th>
                  <th style={{ padding: '0.55rem 0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Due Date
                  </th>
                  <th style={{ padding: '0.55rem 0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst, idx) => {
                  const isPaid = inst.status === 'PAID';
                  return (
                    <tr key={inst.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700, color: '#0f172a' }}>
                        {inst.title || `Installment ${idx + 1}`}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', fontWeight: 750, color: '#0f172a' }}>
                        {formatMoney(inst.amount, currency)}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', color: '#475569' }}>
                        {formatDate(inst.dueDate)}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                        <span
                          className={`crm-stu-chip crm-stu-chip--${isPaid ? 'success' : 'amber'}`}
                          style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}
                        >
                          {isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Official Invoices */}
        <div
          className="crm-stu-card"
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
                Invoices & Billing Slips
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.1rem 0 0' }}>
                Tax invoices generated for each transaction
              </p>
            </div>
            <span className="crm-stu-chip crm-stu-chip--neutral" style={{ fontSize: '0.75rem' }}>
              {invoices.length} Invoices
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.55rem 0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Invoice #
                  </th>
                  <th style={{ padding: '0.55rem 0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Amount
                  </th>
                  <th style={{ padding: '0.55rem 0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Date
                  </th>
                  <th style={{ padding: '0.55rem 0.5rem', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.5rem', fontWeight: 750, color: '#2563eb' }}>
                        {inv.invoiceNo}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', fontWeight: 750, color: '#0f172a' }}>
                        {formatMoney(inv.total, inv.currency || currency)}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', color: '#475569' }}>
                        {formatDate(inv.dueDate)}
                      </td>
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                        <span
                          className={`crm-stu-chip crm-stu-chip--${isPaid ? 'success' : 'amber'}`}
                          style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem' }}
                        >
                          {isPaid ? 'Paid' : 'Sent'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
