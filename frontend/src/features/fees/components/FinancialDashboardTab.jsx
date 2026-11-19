import React, { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiAlertCircle,
  FiCheckCircle,
  FiFileText,
  FiArrowUpRight,
  FiClock,
  FiRefreshCw,
  FiCreditCard,
} from 'react-icons/fi';
import Avatar from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { apiGet } from '../../../api/apiClient';
import { formatMoney } from '../config/feesConstants';

export default function FinancialDashboardTab({ onNavigateTab, onOpenInvoice }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    setError(null);
    apiGet('/invoices/accountant-dashboard')
      .then((res) => {
        setData(res?.data || null);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Failed to load accountant dashboard');
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-border" />
          ))}
        </div>
        <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-border" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-border" />
          <div className="h-72 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-border" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-xl max-w-lg mx-auto my-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <FiAlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-text text-base mb-1">Financial Data Unavailable</h3>
        <p className="text-text-muted text-xs mb-4">{error || 'Could not retrieve financial dashboard metrics.'}</p>
        <Button variant="primary" size="sm" icon={FiRefreshCw} onClick={fetchDashboard}>
          Retry Now
        </Button>
      </div>
    );
  }

  const { kpis, recentPayments = [], recentExpenses = [] } = data;
  const recoveryPct = kpis.totalBilled > 0 ? Math.round((kpis.totalCollected / kpis.totalBilled) * 100) : 100;

  return (
    <div className="w-full space-y-4">
      {/* ── Top 4 Unified KPI Cards (matching Counsellor & Super Admin) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Invoiced */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Total Invoiced</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <FiFileText className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-bold text-text tabular-nums block mt-1">
            {formatMoney(kpis.totalBilled)}
          </span>
          <span className="text-[11px] text-text-muted mt-0.5 block truncate">
            Across candidate enrollments
          </span>
        </div>

        {/* Total Collections */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Total Collections</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block mt-1">
            {formatMoney(kpis.totalCollected)}
          </span>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {recoveryPct}% recovery rate
          </span>
        </div>

        {/* Outstanding Balance */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Outstanding Balance</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <FiAlertCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums block mt-1">
            {formatMoney(kpis.totalOutstanding)}
          </span>
          <span className="text-[11px] font-semibold text-amber-600/90 dark:text-amber-400/90 mt-0.5 block truncate">
            {kpis.overdueCount > 0 ? `${kpis.overdueCount} overdue (${formatMoney(kpis.overdueAmount)})` : 'All payments on schedule'}
          </span>
        </div>

        {/* Net Operational Cash */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Net Operational Cash</span>
            <div className={`p-2 rounded-lg ${
              kpis.netCashFlow >= 0
                ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}>
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-xl font-bold tabular-nums block mt-1 ${
            kpis.netCashFlow >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatMoney(kpis.netCashFlow)}
          </span>
          <span className="text-[11px] text-text-muted mt-0.5 block truncate">
            Inflow minus expenses & refunds
          </span>
        </div>
      </div>

      {/* ── Secondary Metric Ribbon (Clean strip) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-card border border-border rounded-xl text-xs">
        <div>
          <span className="text-text-muted block text-[11px]">Today's Collections</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
            {formatMoney(kpis.todayCollected)}
          </span>
        </div>
        <div>
          <span className="text-text-muted block text-[11px]">This Month's Inflow</span>
          <span className="font-bold text-text text-sm tabular-nums">
            {formatMoney(kpis.monthCollected)}
          </span>
        </div>
        <div>
          <span className="text-text-muted block text-[11px]">Operating Expenses</span>
          <span className="font-bold text-rose-600 dark:text-rose-400 text-sm tabular-nums">
            {formatMoney(kpis.totalExpenses)}
          </span>
        </div>
        <div>
          <span className="text-text-muted block text-[11px]">Disbursed Refunds</span>
          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
            {formatMoney(kpis.totalRefunds)}
          </span>
        </div>
      </div>

      {/* ── Pending Attention Shortcuts ── */}
      {(kpis.pendingProofsCount > 0 || kpis.pendingRefundsCount > 0) && (
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FiClock className="text-amber-600 dark:text-amber-400 w-4 h-4 shrink-0" />
            <span className="font-semibold text-amber-900 dark:text-amber-200">Pending Finance Actions:</span>
            {kpis.pendingProofsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                {kpis.pendingProofsCount} payment proofs pending review
              </span>
            )}
            {kpis.pendingRefundsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-bold">
                {kpis.pendingRefundsCount} refunds awaiting review
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {kpis.pendingProofsCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab?.('proofs')}
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                Go to Proofs →
              </button>
            )}
            {kpis.pendingRefundsCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab?.('refunds')}
                className="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Go to Refunds →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Split Tables: Recent Collections & Recent Expenses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Collections */}
        <div className="p-4 bg-card rounded-xl border border-border shadow-xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-text text-xs flex items-center gap-2">
              <FiCheckCircle className="text-emerald-500" /> Recent Fee Collections
            </h4>
            <button
              type="button"
              onClick={() => onNavigateTab?.('invoices')}
              className="text-[11px] font-semibold text-primary-600 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              All Invoices <FiArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs">
              No fee collections recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border text-xs flex-1">
              {recentPayments.map((p) => {
                const sName = [p.student?.firstName, p.student?.lastName].filter(Boolean).join(' ') || 'Student';
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={sName} size="xs" />
                      <div className="min-w-0">
                        <span className="font-semibold text-text truncate block">{sName}</span>
                        <span className="font-mono text-[10px] text-text-muted block truncate">
                          {p.receipts?.[0]?.receiptNo || p.invoice?.invoiceNo || 'Payment'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block tabular-nums">
                        +{formatMoney(p.amount)}
                      </span>
                      <span className="text-[10px] text-text-muted block uppercase font-semibold">{p.mode}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="p-4 bg-card rounded-xl border border-border shadow-xs space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-text text-xs flex items-center gap-2">
              <FiTrendingDown className="text-rose-500" /> Recent Operating Expenses
            </h4>
            <button
              type="button"
              onClick={() => onNavigateTab?.('expenses')}
              className="text-[11px] font-semibold text-primary-600 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              All Expenses <FiArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="py-8 text-center text-text-muted text-xs">
              No operating expenses recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border text-xs flex-1">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-text truncate block">{exp.title}</span>
                    <span className="text-[10px] text-text-muted block truncate">{exp.category?.name || 'General Expense'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-rose-600 dark:text-rose-400 block tabular-nums">
                      -{formatMoney(exp.amount)}
                    </span>
                    <span className="text-[10px] text-text-muted block">
                      {new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
