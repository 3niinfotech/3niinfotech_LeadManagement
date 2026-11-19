import React, { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiDollarSign, FiTag } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import GlobalLoader from '../../../components/ui/GlobalLoader';
import EmptyState from '../../../components/ui/EmptyState';
import { apiGet, apiPost } from '../../../api/apiClient';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { formatMoney } from '../config/feesConstants';

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

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
  }, [statusFilter]);

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

  if (loading && expenses.length === 0) return <GlobalLoader />;

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="p-3 bg-card rounded-xl border border-border flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-text text-sm">Operating Expenses & Payouts</h3>
          <p className="text-text-muted text-xs">Track vendor payments, rent, utilities, and branch overheads</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {['ALL', 'PENDING', 'APPROVED', 'PAID'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 font-bold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

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

      {expenses.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center max-w-md mx-auto">
          <EmptyState
            title="No expenses logged"
            description="Branch and operational expenses will appear here once recorded."
            actionLabel="+ Record Expense"
            onAction={() => setExpenseModalOpen(true)}
          />
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-900/60 text-text-muted uppercase text-[10px] font-bold tracking-wider border-b border-border">
                  <th className="py-2.5 px-3">Expense No</th>
                  <th className="py-2.5 px-3">Title & Category</th>
                  <th className="py-2.5 px-3">Vendor</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Mode</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-text">
                      {exp.expenseNo}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-text block">{exp.title}</span>
                      <span className="text-[10px] text-text-muted">{exp.category?.name || 'General'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-text">
                      {exp.vendorName || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatMoney(exp.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold block">{exp.paymentMethod}</span>
                      {exp.referenceNo && (
                        <span className="font-mono text-[10px] text-slate-400 block">{exp.referenceNo}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        exp.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                          : exp.status === 'APPROVED'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
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
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      <Modal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        title="Record Operating Expense"
        size="md"
        footer={(
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={() => setExpenseModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreateExpense} loading={submitting}>
              Save Expense
            </Button>
          </div>
        )}
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (USD) *
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
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
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Add Expense Category"
        size="sm"
        footer={(
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleCreateCategory} loading={submitting}>
              Create Category
            </Button>
          </div>
        )}
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

