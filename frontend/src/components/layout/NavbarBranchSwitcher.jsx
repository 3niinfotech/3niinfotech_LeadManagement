import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiChevronDown, FiLayers, FiMapPin } from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import {
  useGetViewingBranchQuery,
  useSetViewingBranchMutation,
} from '../../features/organization/redux/organizationApiSlice';
import { enquiryApi } from '../../features/enquiry/redux/enquiryApiSlice';
import { walkinApi } from '../../features/walkin/redux/walkinApiSlice';
import { applicationApi } from '../../features/applications/redux/applicationApiSlice';
import { visaApi } from '../../features/visas/redux/visaApiSlice';
import { feesApi } from '../../features/fees/redux/feesApiSlice';
import { attendanceApi } from '../../features/attendance/redux/attendanceApiSlice';
import { assignmentApi } from '../../features/assignment/redux/assignmentApiSlice';
import { emitViewingBranchChanged } from '../../config/viewingBranch.events';
import toastService from '../../services/toast/toast.service';

function branchLabel(branch) {
  if (!branch) return 'All Branches';
  return branch.name || branch.code || 'Branch';
}

function invalidateAllScopedLists(dispatch) {
  dispatch(enquiryApi.util.invalidateTags([
    'EnquiryList', 'EnquirySummary', 'EnquiryDetail',
    'EnquiryDemos', 'EnquiryDemoSummary',
  ]));
  dispatch(walkinApi.util.invalidateTags(['WalkInList', 'WalkInSummary', 'WalkInDetail']));
  dispatch(applicationApi.util.invalidateTags(['ApplicationList', 'ApplicationSummary', 'ApplicationDetail']));
  dispatch(visaApi.util.invalidateTags(['VisaList', 'VisaSummary', 'VisaDetail']));
  dispatch(feesApi.util.invalidateTags(['FeesList', 'FeesSummary', 'FeesDetail']));
  dispatch(attendanceApi.util.invalidateTags([
    'Batches', 'BatchDetail', 'Sessions', 'SessionAttendance', 'StudentAttendance',
  ]));
  try {
    dispatch(assignmentApi.util.invalidateTags(['BranchOps']));
  } catch {
    /* optional tag */
  }
}

/**
 * Role-gated Active Branch switcher.
 * Only users with branch.switch + branch.view_multiple see this.
 * Selection is persisted server-side and clamps all mergeScope queries.
 */
export default function NavbarBranchSwitcher() {
  const dispatch = useDispatch();
  const { data, isLoading } = useGetViewingBranchQuery();
  const [setViewingBranch, { isLoading: switching }] = useSetViewingBranchMutation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 280 });

  const canSwitch = Boolean(data?.canSwitch);
  const branches = data?.branches || [];
  const canViewAll = Boolean(data?.canViewAll);
  const activeId = data?.viewingBranchId || null;

  const currentLabel = useMemo(() => {
    if (data?.viewingBranch) return branchLabel(data.viewingBranch);
    if (canViewAll) return 'All Branches';
    const home = branches.find((b) => b.id === data?.homeBranchId);
    return home ? branchLabel(home) : 'Branch';
  }, [data, branches, canViewAll]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.max(280, Math.min(340, Math.max(rect.width, 280)));
      let left = rect.right - width;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      setPos({ top: rect.bottom + 8, left, width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  // Role-forced: no permissions → no dropdown. Single-branch companies still show locked context.
  if (isLoading || !canSwitch || branches.length < 1) return null;

  const handleSelect = async (branchId) => {
    if (branchId === activeId || (branchId == null && activeId == null)) {
      setOpen(false);
      return;
    }
    setOpen(false);
    try {
      const next = await setViewingBranch(branchId).unwrap();
      invalidateAllScopedLists(dispatch);
      emitViewingBranchChanged({
        viewingBranchId: next?.viewingBranchId || null,
        viewingBranch: next?.viewingBranch || null,
        canViewAll: next?.canViewAll,
      });
      toastService.success(
        branchId
          ? `Showing ${branchLabel(next?.viewingBranch) || 'selected branch'} only`
          : 'Showing all branches',
      );
    } catch (err) {
      toastService.error(err?.data?.message || err?.message || 'Could not switch branch');
    }
  };

  return (
    <div className="relative overflow-visible">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        title="Active branch — filters all CRM data for your role"
        className={`
          h-9 inline-flex items-center gap-2 rounded-lg border bg-white dark:bg-slate-900 px-2.5
          text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-all
          hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/25
          disabled:opacity-60 max-w-[200px] sm:max-w-[240px]
          ${open ? 'border-brand/40 ring-1 ring-brand/20' : 'border-slate-200/80 dark:border-slate-800'}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Active branch: ${currentLabel}`}
      >
        <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
          <FiMapPin size={12} strokeWidth={2.2} />
        </span>
        <span className="truncate">{currentLabel}</span>
        <FiChevronDown
          size={13}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-brand' : 'group-hover:text-slate-600'}`}
        />
      </button>

      {open && createPortal(
        <>
          <button
            type="button"
            className="fixed inset-0 z-[1400] cursor-default bg-transparent"
            aria-label="Close branch menu"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed z-[1401] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-1.5 text-[13px] shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
            style={{ top: pos.top, left: pos.left, width: Math.max(270, pos.width) }}
            role="listbox"
            aria-label="Select active branch"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between px-2.5 py-1.5 pb-2 mb-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <FiMapPin className="text-brand shrink-0" size={11} />
                Active Branch
              </span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md">
                {branches.length} locations
              </span>
            </div>

            {/* All Branches option */}
            {canViewAll && (
              <div className="mb-1">
                <button
                  type="button"
                  role="option"
                  aria-selected={activeId == null}
                  className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition-all ${
                    activeId == null
                      ? 'bg-brand/10 text-brand font-semibold shadow-2xs dark:bg-brand/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                  }`}
                  onClick={() => handleSelect(null)}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      activeId == null
                        ? 'bg-brand text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                    }`}
                  >
                    <FiLayers size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold leading-tight">All Branches</div>
                    <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500 leading-tight">
                      All locations included
                    </div>
                  </div>
                  {activeId == null && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white text-[11px] shadow-xs">
                      <FiCheck size={11} strokeWidth={2.8} />
                    </span>
                  )}
                </button>
              </div>
            )}

            {canViewAll && <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />}

            {/* Branch List */}
            <div className="max-h-64 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
              {branches.map((branch) => {
                const selected = activeId === branch.id;
                const initials = branch.code
                  ? branch.code.slice(0, 3).toUpperCase()
                  : (branch.name || 'B').slice(0, 2).toUpperCase();

                return (
                  <button
                    key={branch.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition-all ${
                      selected
                        ? 'bg-brand/10 text-brand font-semibold shadow-2xs dark:bg-brand/20'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/70'
                    }`}
                    onClick={() => handleSelect(branch.id)}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold uppercase transition-colors tracking-tight ${
                        selected
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                      }`}
                    >
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate leading-snug">
                        {branchLabel(branch)}
                      </div>
                      {branch.city && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                          <FiMapPin size={9} className="opacity-70 shrink-0" />
                          <span className="truncate">{branch.city}</span>
                        </div>
                      )}
                    </div>
                    {selected && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white text-[11px] shadow-xs">
                        <FiCheck size={11} strokeWidth={2.8} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subtle footer note */}
            <div className="mt-1 px-2.5 py-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight block">
                Filters CRM records & reports to selected branch
              </span>
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}
