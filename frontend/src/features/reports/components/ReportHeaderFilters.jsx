import { useState, useRef, useEffect, useMemo } from 'react';
import {
  FiCalendar,
  FiMapPin,
  FiChevronDown,
  FiCheck,
  FiX,
  FiClock,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import { REPORT_DATE_PRESETS } from '../config/reports.config';
import { useBranchOptions } from '../../master/hooks/useRelationalMasterOptions';

export default function ReportHeaderFilters({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  branchId,
  onBranchChange,
  branchLocked = false,
  canViewAllBranches = true,
}) {
  const { options: branches } = useBranchOptions({ enabled: true });

  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);

  // Local state for custom date inputs before applying
  const [localFrom, setLocalFrom] = useState(customFrom || '');
  const [localTo, setLocalTo] = useState(customTo || '');

  const dateRef = useRef(null);
  const branchRef = useRef(null);

  // Sync local from/to with props
  useEffect(() => {
    setLocalFrom(customFrom || '');
    setLocalTo(customTo || '');
  }, [customFrom, customTo]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateMenuOpen(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target)) {
        setBranchMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Display label for Date Range trigger
  const dateTriggerLabel = useMemo(() => {
    if (preset === 'custom') {
      if (customFrom && customTo) {
        return `${customFrom} → ${customTo}`;
      }
      if (customFrom) return `From ${customFrom}`;
      if (customTo) return `Until ${customTo}`;
      return 'Custom Range';
    }
    const found = REPORT_DATE_PRESETS.find((p) => p.id === preset);
    return found ? found.label : 'All Time';
  }, [preset, customFrom, customTo]);

  // Display label for Branch trigger
  const branchTriggerLabel = useMemo(() => {
    if (!branchId) return 'All Branches';
    const found = (branches || []).find((b) => b.value === branchId);
    return found ? found.label : 'Branch';
  }, [branchId, branches]);

  const handleSelectPreset = (presetId) => {
    onPresetChange(presetId);
    if (presetId !== 'custom') {
      setDateMenuOpen(false);
    }
  };

  const handleApplyCustomDates = () => {
    onCustomFrom(localFrom);
    onCustomTo(localTo);
    onPresetChange('custom');
    setDateMenuOpen(false);
  };

  const handleResetToAllTime = () => {
    setLocalFrom('');
    setLocalTo('');
    onCustomFrom('');
    onCustomTo('');
    onPresetChange('all_time');
    setDateMenuOpen(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap relative">
      {/* ── 1. THEMED DATE RANGE DROPDOWN ── */}
      <div className="relative" ref={dateRef}>
        <button
          type="button"
          data-testid="report-date-trigger"
          onClick={() => {
            setDateMenuOpen((v) => !v);
            setBranchMenuOpen(false);
          }}
          className={`h-8 px-3 inline-flex items-center gap-2 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
            dateMenuOpen || preset !== 'all_time'
              ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-600'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          aria-expanded={dateMenuOpen}
        >
          <FiCalendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate max-w-[170px]">{dateTriggerLabel}</span>
          <FiChevronDown
            className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
              dateMenuOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Themed Floating Popover */}
        {dateMenuOpen && (
          <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 w-[310px] p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Select Date Range
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-1 mb-3">
              {REPORT_DATE_PRESETS.filter((p) => p.id !== 'custom').map((p) => {
                const active = preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                      active
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{p.label}</span>
                    {active && <FiCheck className="w-3.5 h-3.5 ml-1 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Custom From / To Date
                </span>
                {preset === 'custom' && (
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={localFrom}
                    onChange={(e) => setLocalFrom(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={localTo}
                    onChange={(e) => setLocalTo(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Popover Action Buttons */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetToAllTime}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Reset to All Time
              </button>

              <div className="flex items-center gap-1.5">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setDateMenuOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={handleApplyCustomDates}
                  disabled={!localFrom && !localTo}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. THEMED BRANCH DROPDOWN ── */}
      <div className="relative" ref={branchRef}>
        <button
          type="button"
          data-testid="report-branch-trigger"
          disabled={branchLocked}
          onClick={() => {
            if (!branchLocked) {
              setBranchMenuOpen((v) => !v);
              setDateMenuOpen(false);
            }
          }}
          className={`h-8 px-3 inline-flex items-center gap-2 rounded-lg border text-xs font-semibold shadow-2xs transition-all ${
            branchLocked
              ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500'
              : branchMenuOpen || branchId
                ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-600 cursor-pointer'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer'
          }`}
          aria-expanded={branchMenuOpen}
          title={branchLocked ? 'Locked to navbar Active Branch' : undefined}
        >
          <FiMapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate max-w-[140px]">{branchTriggerLabel}</span>
          {!branchLocked && (
            <FiChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
                branchMenuOpen ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>

        {/* Themed Branch Popover */}
        {branchMenuOpen && !branchLocked && (
          <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 min-w-[210px] w-max max-w-xs p-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Branch
            </div>

            <div className="space-y-0.5 mt-1 max-h-56 overflow-y-auto">
              {canViewAllBranches && (
                <button
                  type="button"
                  onClick={() => {
                    onBranchChange('');
                    setBranchMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                    !branchId
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>All Branches</span>
                  {!branchId && <FiCheck className="w-3.5 h-3.5 ml-2 shrink-0" />}
                </button>
              )}

              {(branches || []).map((b) => {
                const active = branchId === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => {
                      onBranchChange(b.value);
                      setBranchMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{b.label}</span>
                    {active && <FiCheck className="w-3.5 h-3.5 ml-2 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
