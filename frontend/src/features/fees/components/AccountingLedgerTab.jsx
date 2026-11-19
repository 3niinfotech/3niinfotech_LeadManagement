import React, { useState, useEffect } from 'react';
import { FiDownload, FiFilter, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import GlobalLoader from '../../../components/ui/GlobalLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Pagination from '../../../components/ui/Pagination';
import { apiGet } from '../../../api/apiClient';
import { STORAGE_KEYS } from '../../../config/storageKeys';
import toastService from '../../../services/toast/toast.service';
import { formatMoney } from '../config/feesConstants';

export default function AccountingLedgerTab() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalCredits: 0, totalDebits: 0, netBalance: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [entryType, setEntryType] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const loadLedger = async (page = 1) => {
    try {
      setLoading(true);
      const [listRes, sumRes] = await Promise.all([
        apiGet('/ledger', {
          entryType: entryType !== 'ALL' ? entryType : undefined,
          from: from || undefined,
          to: to || undefined,
          page,
          limit: pagination.limit,
        }),
        apiGet('/ledger/summary', {
          from: from || undefined,
          to: to || undefined,
        }),
      ]);

      setEntries(listRes?.data || []);
      setPagination(listRes?.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      setSummary(sumRes?.data || { totalCredits: 0, totalDebits: 0, netBalance: 0 });
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger(1);
  }, [entryType, from, to]);

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (entryType !== 'ALL') queryParams.append('entryType', entryType);
      if (from) queryParams.append('from', from);
      if (to) queryParams.append('to', to);

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`/api/ledger/export?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `General_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toastService.success('Accounting ledger exported to CSV');
    } catch {
      toastService.error('Export failed');
    }
  };

  if (loading && entries.length === 0) return <GlobalLoader />;

  return (
    <div className="space-y-4">
      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Total Credits (Inflow)</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <FiTrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums block mt-1">
            {formatMoney(summary.totalCredits)}
          </span>
          <span className="text-[11px] text-text-muted mt-0.5 block">Fee collections & revenue</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Total Debits (Outflow)</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
              <FiTrendingDown className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400 tabular-nums block mt-1">
            {formatMoney(summary.totalDebits)}
          </span>
          <span className="text-[11px] text-text-muted mt-0.5 block">Refunds & paid operating expenses</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Current Ledger Balance</span>
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-xl font-bold tabular-nums block mt-1 ${
            summary.netBalance >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatMoney(summary.netBalance)}
          </span>
          <span className="text-[11px] text-text-muted mt-0.5 block">Net operational liquidity</span>
        </div>
      </div>

      {/* ── Filters & Action Bar ── */}
      <div className="p-3 bg-card rounded-xl border border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {['ALL', 'PAYMENT', 'EXPENSE', 'REFUND'].map((t) => (
              <button
                key={t}
                onClick={() => setEntryType(t)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  entryType === t
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-bold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted pl-2 border-l border-border">
            <span>Date:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2 py-0.5 rounded border border-border bg-card text-text text-xs"
            />
            <span>to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2 py-0.5 rounded border border-border bg-card text-text text-xs"
            />
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          icon={FiDownload}
          onClick={handleExport}
        >
          Export CSV
        </Button>
      </div>

      {/* ── Data Table ── */}
      {entries.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center max-w-md mx-auto">
          <EmptyState
            title="No ledger entries found"
            description="All financial transactions, student payments, expenses, and refunds will be chronologically logged here."
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-900/60 text-text-muted uppercase text-[10px] font-bold tracking-wider border-b border-border">
                  <th className="py-2.5 px-3">Entry No</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (-)</th>
                  <th className="py-2.5 px-3 text-right">Credit (+)</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                  <th className="py-2.5 px-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e) => {
                  const debit = !e.isCredit ? Number(e.amount) : 0;
                  const credit = e.isCredit ? Number(e.amount) : 0;
                  const isPositive = credit > 0;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-text">
                        {e.entryNo}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {e.entryType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-sm truncate text-text font-medium" title={e.description}>
                        {e.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {debit > 0 ? `-${formatMoney(debit)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {credit > 0 ? `+${formatMoney(credit)}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-text tabular-nums">
                        {formatMoney(e.balanceAfter)}
                      </td>
                      <td className="py-2.5 px-3 text-text-muted">
                        {e.createdBy ? `${e.createdBy.firstName} ${e.createdBy.lastName}` : 'System'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={(p) => loadLedger(p)}
          />
        </div>
      )}
    </div>
  );
}

