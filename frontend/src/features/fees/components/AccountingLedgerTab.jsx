import React, { useState, useEffect, useMemo } from 'react';
import {
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiBook,
  FiCalendar,
  FiRefreshCw,
  FiSearch,
  FiX,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import GlobalLoader from '../../../components/ui/GlobalLoader';
import EmptyState from '../../../components/ui/EmptyState';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import Pagination from '../../../components/ui/Pagination';
import SearchInput from '../../../components/ui/SearchInput';
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
  const [searchQuery, setSearchQuery] = useState('');
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

  // Quick date presets
  const setPresetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFrom(today);
    setTo(today);
  };

  const setPresetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    setFrom(firstDay);
    setTo(lastDay);
  };

  const clearDateRange = () => {
    setFrom('');
    setTo('');
  };

  // Client-side search filtering
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((e) => {
      const desc = (e.description || '').toLowerCase();
      const entryNo = (e.entryNo || '').toLowerCase();
      const type = (e.entryType || '').toLowerCase();
      const creator = `${e.createdBy?.firstName || ''} ${e.createdBy?.lastName || ''}`.toLowerCase();
      return desc.includes(q) || entryNo.includes(q) || type.includes(q) || creator.includes(q);
    });
  }, [entries, searchQuery]);

  const statItems = useMemo(
    () => [
      {
        id: 'ALL',
        label: 'All Transactions',
        value: pagination.total || entries.length,
        icon: FiBook,
        badge: 'Audited Ledger',
      },
      {
        id: 'PAYMENT',
        label: 'Total Inflow',
        value: `+${formatMoney(summary.totalCredits)}`,
        icon: FiTrendingUp,
        color: 'emerald',
        badge: 'Fee Collections',
      },
      {
        id: 'EXPENSE',
        label: 'Total Outflow',
        value: `-${formatMoney(summary.totalDebits)}`,
        icon: FiTrendingDown,
        color: 'rose',
        badge: 'Expenses & Outflows',
      },
      {
        id: 'BALANCE_METRIC',
        label: 'Current Balance',
        value: formatMoney(summary.netBalance),
        icon: FiDollarSign,
        color: summary.netBalance >= 0 ? 'primary' : 'rose',
        badge: summary.netBalance >= 0 ? 'Net Liquidity' : 'Deficit',
      },
    ],
    [pagination.total, entries.length, summary]
  );

  return (
    <div className="space-y-4">
      {/* ── KPI Stat Summary Bar ── */}
      <SummaryStatBar
        items={statItems}
        activeFilter={entryType}
        onSelect={(id) => {
          if (id !== 'BALANCE_METRIC') {
            setEntryType(id);
          }
        }}
        loading={loading && entries.length === 0}
        ariaLabel="Ledger summary metrics"
      />

      {/* ── Filters & Action Toolbar ── */}
      <div className="p-3 bg-card rounded-xl border border-border shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="w-full lg:w-72">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search particulars or entry no..."
            size="sm"
          />
        </div>

        {/* Entry Types & Date Filters */}
        <div className="flex items-center gap-2 flex-wrap flex-1 justify-between lg:justify-end">
          {/* Entry Type Segment */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-lg border border-border">
            {[
              { id: 'ALL', label: 'All Entries' },
              { id: 'PAYMENT', label: 'Payments' },
              { id: 'EXPENSE', label: 'Expenses' },
              { id: 'REFUND', label: 'Refunds' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setEntryType(id)}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  entryType === id
                    ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-300 shadow-xs font-bold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Styled Date Picker Group */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1 rounded-lg border border-border text-xs text-text-muted">
            <FiCalendar className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-2 py-0.5 rounded border border-border bg-white dark:bg-slate-900 text-text text-xs focus:ring-1 focus:ring-primary-500"
              title="From Date"
            />
            <span className="text-[11px] font-medium text-text-muted">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-2 py-0.5 rounded border border-border bg-white dark:bg-slate-900 text-text text-xs focus:ring-1 focus:ring-primary-500"
              title="To Date"
            />
            {(from || to) && (
              <button
                type="button"
                onClick={clearDateRange}
                className="p-1 text-text-muted hover:text-text"
                title="Clear date range"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={setPresetToday}
              className="px-2 py-1 text-[11px] font-medium rounded border border-border bg-card text-text-muted hover:text-text"
            >
              Today
            </button>
            <button
              type="button"
              onClick={setPresetThisMonth}
              className="px-2 py-1 text-[11px] font-medium rounded border border-border bg-card text-text-muted hover:text-text"
            >
              This Month
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <Button
              size="sm"
              variant="outline"
              icon={FiRefreshCw}
              onClick={() => loadLedger(pagination.page)}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={FiDownload}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* ── Enterprise Data Table / Card ── */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-900/70 text-text-muted uppercase text-[10px] font-bold tracking-wider border-b border-border">
                <th className="py-3 px-4">Entry No</th>
                <th className="py-3 px-3">Date &amp; Time</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Particulars / Description</th>
                <th className="py-3 px-3 text-right">Debit (-)</th>
                <th className="py-3 px-3 text-right">Credit (+)</th>
                <th className="py-3 px-3 text-right">Balance After</th>
                <th className="py-3 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 px-4 text-center">
                    <EmptyState
                      icon={FiBook}
                      title={
                        searchQuery
                          ? 'No matching ledger transactions'
                          : 'No accounting ledger entries'
                      }
                      description={
                        searchQuery
                          ? 'Try refining your search keyword or clearing date filters.'
                          : 'All financial transactions, student payments, expenses, and refunds will be chronologically logged here.'
                      }
                      actionLabel={searchQuery || from || to ? 'Clear Filters' : undefined}
                      onAction={
                        searchQuery || from || to
                          ? () => {
                              setSearchQuery('');
                              clearDateRange();
                              setEntryType('ALL');
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => {
                  const debit = !e.isCredit ? Number(e.amount) : 0;
                  const credit = e.isCredit ? Number(e.amount) : 0;
                  const isPositive = credit > 0;
                  return (
                    <tr
                      key={e.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-text">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                          {e.entryNo}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-text-muted whitespace-nowrap">
                        <span className="block font-medium text-text">
                          {new Date(e.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="block text-[10px] text-text-muted">
                          {new Date(e.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          {e.entryType}
                        </span>
                      </td>
                      <td
                        className="py-3 px-3 max-w-sm truncate text-text font-medium"
                        title={e.description}
                      >
                        {e.description}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {debit > 0 ? `-${formatMoney(debit)}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {credit > 0 ? `+${formatMoney(credit)}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-text tabular-nums text-sm">
                        {formatMoney(e.balanceAfter)}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-[11px]">
                        {e.createdBy
                          ? `${e.createdBy.firstName} ${e.createdBy.lastName}`
                          : 'System'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-border">
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
    </div>
  );
}
