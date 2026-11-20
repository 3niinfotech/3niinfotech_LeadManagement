import React, { useState, useEffect, useMemo } from 'react';
import {
  FiPlus,
  FiCheck,
  FiDollarSign,
  FiTag,
  FiTrendingDown,
  FiClock,
  FiRefreshCw,
  FiFilter,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import GlobalLoader from '../../../components/ui/GlobalLoader';
import EmptyState from '../../../components/ui/EmptyState';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import SearchInput from '../../../components/ui/SearchInput';
import { apiGet, apiPost } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { formatMoney } from '../config/feesConstants';

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Expense form
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  // New Category form
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, catRes] = await Promise.all([
        apiGet('/expenses', {
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        }),
        apiGet('/expenses/categories'),
      ]);
      setExpenses(expRes?.data || []);
      const cats = catRes?.data || [];
      setCategories(cats);
      if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) {
      toastService.warning('Please enter valid expense details');
      return;
    }

    try {
      setSubmitting(true);
      await apiPost('/expenses', {
        title: title.trim(),
        categoryId,
        amount: numAmount,
        vendorName: vendorName.trim() || undefined,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toastService.success('Expense recorded successfully');
      setExpenseModalOpen(false);
      setTitle('');
      setAmount('');
      setVendorName('');
      setReferenceNo('');
      setNotes('');
      loadData();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim() || !catCode.trim()) {
      toastService.warning('Category name and code are required');
      return;
    }

    try {
      setSubmitting(true);
      await apiPost('/expenses/categories', {
        name: catName.trim(),
        code: catCode.trim(),
      });
      toastService.success('Expense category created');
      setCategoryModalOpen(false);
      setCatName('');
      setCatCode('');
      loadData();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (exp) => {
    const ok = await alertService.confirm({
      title: 'Approve Expense',
      text: `Approve expense "${exp.title}" for ${formatMoney(exp.amount)}?`,
      confirmButtonText: 'Yes, Approve',
    });
    if (!ok) return;

    try {
      await apiPost(`/expenses/${exp.id}/approve`, {});
      toastService.success('Expense approved');
      loadData();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Approval failed');
    }
  };

  const handlePay = async (exp) => {
    const ok = await alertService.confirm({
      title: 'Disburse & Pay Expense',
      text: `Mark expense "${exp.title}" as PAID? This will post a debit entry of ${formatMoney(exp.amount)} into the accounting ledger.`,
      confirmButtonText: 'Yes, Pay & Post Debit',
    });
    if (!ok) return;

    try {
      await apiPost(`/expenses/${exp.id}/pay`, {});
      toastService.success('Expense paid and posted to general ledger');
      loadData();
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.message || 'Payment failed');
    }
  };

  // Filter expenses by search query client-side
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase().trim();
    return expenses.filter((exp) => {
      const expNo = (exp.expenseNo || '').toLowerCase();
      const t = (exp.title || '').toLowerCase();
      const v = (exp.vendorName || '').toLowerCase();
      const c = (exp.category?.name || '').toLowerCase();
      const ref = (exp.referenceNo || '').toLowerCase();
      return (
        expNo.includes(q) ||
        t.includes(q) ||
        v.includes(q) ||
        c.includes(q) ||
        ref.includes(q)
      );
    });
  }, [expenses, searchQuery]);

  // Statistics calculation
  const totalCount = expenses.length;
  const pendingCount = expenses.filter((e) => e.status === 'PENDING').length;
  const approvedCount = expenses.filter((e) => e.status === 'APPROVED').length;
  const paidCount = expenses.filter((e) => e.status === 'PAID').length;
  const totalPaidAmount = expenses
    .filter((e) => e.status === 'PAID')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const statItems = useMemo(
    () => [
      {
        id: 'ALL',
        label: 'Total Expenses',
        value: totalCount,
        icon: FiTrendingDown,
        tone: 'neutral',
      },
      {
        id: 'PENDING',
        label: 'Pending Approval',
        value: pendingCount,
        icon: FiClock,
        tone: 'warning',
      },
      {
        id: 'APPROVED',
        label: 'Approved (Ready)',
        value: approvedCount,
        icon: FiCheck,
        tone: 'info',
      },
      {
        id: 'PAID',
        label: 'Paid Out',
        value: paidCount,
        icon: FiDollarSign,
        tone: 'success',
      },
      {
        id: 'PAID_METRIC',
        label: 'Total Paid Out',
        value: formatMoney(totalPaidAmount),
        icon: FiDollarSign,
        tone: 'danger',
        share: false,
        subtext: 'Operational debits',
      },
    ],
    [totalCount, pendingCount, approvedCount, paidCount, totalPaidAmount]
  );

  return (
    <div className="space-y-4">
      {/* ── KPI Stat Summary Bar ── */}
      <SummaryStatBar
        items={statItems}
        activeFilter={statusFilter}
        onSelect={(id) => {
          if (id === 'PAID_METRIC') {
            setStatusFilter('PAID');
          } else {
            setStatusFilter(id);
          }
        }}
        loading={loading && expenses.length === 0}
        ariaLabel="Expense status filters"
      />

      {/* ── Search & Filter Toolbar ── */}
      <div className="p-3 bg-card rounded-xl border border-border shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="w-full lg:w-72">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, vendor, or ref..."
            size="sm"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 flex-wrap flex-1 justify-between lg:justify-end">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/40 px-2 py-1 rounded-lg border border-border text-xs">
            <FiTag className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-text text-xs border-none focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-lg border border-border">
            {[
              { id: 'ALL', label: 'All', count: totalCount },
              { id: 'PENDING', label: 'Pending', count: pendingCount },
              { id: 'APPROVED', label: 'Approved', count: approvedCount },
              { id: 'PAID', label: 'Paid', count: paidCount },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  statusFilter === id
                    ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-300 shadow-xs font-bold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    statusFilter === id
                      ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 ml-auto lg:ml-0">
            <Button
              size="sm"
              variant="outline"
              icon={FiRefreshCw}
              onClick={loadData}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={FiTag}
              onClick={() => setCategoryModalOpen(true)}
            >
              + Category
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={FiPlus}
              onClick={() => setExpenseModalOpen(true)}
            >
              Record Expense
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
                <th className="py-3 px-4">Expense No</th>
                <th className="py-3 px-3">Title &amp; Category</th>
                <th className="py-3 px-3">Vendor / Payee</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Payment Mode</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 px-4 text-center">
                    <EmptyState
                      icon={FiTrendingDown}
                      title={
                        searchQuery
                          ? 'No matching expenses found'
                          : statusFilter !== 'ALL'
                          ? `No ${statusFilter.toLowerCase()} expenses`
                          : 'No expenses logged'
                      }
                      description={
                        searchQuery
                          ? 'Try refining your search keyword or clearing filters.'
                          : 'Branch and operational expenses will appear here once recorded.'
                      }
                      actionLabel="+ Record Expense"
                      onAction={() => setExpenseModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-text">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-bold">
                        {exp.expenseNo}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-text block leading-tight">
                        {exp.title}
                      </span>
                      <span className="text-[10px] text-text-muted mt-0.5 inline-flex items-center gap-1">
                        <FiTag className="w-2.5 h-2.5" />
                        {exp.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text font-medium">
                      {exp.vendorName || <span className="text-text-muted italic">—</span>}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400 tabular-nums text-sm">
                      -{formatMoney(exp.amount)}
                    </td>
                    <td className="py-3 px-3 text-text-muted">
                      <span className="block font-medium text-text">
                        {new Date(exp.expenseDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-text block">
                        {exp.paymentMethod}
                      </span>
                      {exp.referenceNo && (
                        <span className="font-mono text-[10px] text-text-muted block">
                          {exp.referenceNo}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          exp.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                            : exp.status === 'APPROVED'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                        }`}
                      >
                        {exp.status === 'PENDING' && <FiClock className="w-3 h-3" />}
                        {exp.status === 'APPROVED' && <FiCheck className="w-3 h-3" />}
                        {exp.status === 'PAID' && <FiDollarSign className="w-3 h-3" />}
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {exp.status === 'PENDING' && (
                        <Button
                          size="xs"
                          variant="outline"
                          icon={FiCheck}
                          onClick={() => handleApprove(exp)}
                        >
                          Approve
                        </Button>
                      )}
                      {exp.status === 'APPROVED' && (
                        <Button
                          size="xs"
                          variant="primary"
                          icon={FiDollarSign}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handlePay(exp)}
                        >
                          Pay Expense
                        </Button>
                      )}
                      {exp.status === 'PAID' && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          Disbursed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Record Expense Modal ── */}
      <Modal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Record Operating Expense"
        size="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpenseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateExpense}
              loading={submitting}
            >
              Save Expense
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Expense Title *
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Office Broadband bill / Advertising campaign"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (INR) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vendor / Payee Name
              </label>
              <Input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Acme Tech Ltd"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI / QR</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD">Credit / Debit Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reference / Invoice No
            </label>
            <Input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. INV-99120"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </form>
      </Modal>

      {/* ── Add Category Modal ── */}
      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Add Expense Category"
        size="sm"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateCategory}
              loading={submitting}
            >
              Create Category
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Name *
            </label>
            <Input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Marketing, Office Rent, Utilities"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Code *
            </label>
            <Input
              type="text"
              value={catCode}
              onChange={(e) => setCatCode(e.target.value.toUpperCase())}
              placeholder="e.g. MKTG, RENT, UTIL"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
