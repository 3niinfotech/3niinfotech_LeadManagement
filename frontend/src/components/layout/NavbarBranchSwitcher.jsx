import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiCheck, FiChevronDown, FiMapPin } from 'react-icons/fi';
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
  const [pos, setPos] = useState({ top: 0, left: 0, width: 260 });

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
      const width = Math.max(260, Math.min(320, Math.max(rect.width, 260)));
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
          <ul
            className="fixed z-[1401] overflow-hidden rounded-xl border border-border bg-card-bg py-1.5 text-[13px] shadow-xl"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            role="listbox"
            aria-label="Select active branch"
          >
            <li className="px-3 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Active branch
            </li>
            {canViewAll && (
              <li role="option" aria-selected={activeId == null}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                    activeId == null
                      ? 'bg-brand-soft/70 text-brand font-semibold'
                      : 'text-text hover:bg-row-hover'
                  }`}
                  onClick={() => handleSelect(null)}
                >
                  <span className="min-w-0 flex-1 truncate">All Branches</span>
                  {activeId == null ? <FiCheck className="h-4 w-4 shrink-0" /> : null}
                </button>
              </li>
            )}
            {branches.map((branch) => {
              const selected = activeId === branch.id;
              return (
                <li key={branch.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? 'bg-brand-soft/70 text-brand font-semibold'
                        : 'text-text hover:bg-row-hover'
                    }`}
                    onClick={() => handleSelect(branch.id)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{branchLabel(branch)}</span>
                      {branch.city ? (
                        <span className="block truncate text-[11px] font-normal text-text-muted">
                          {branch.city}
                        </span>
                      ) : null}
                    </span>
                    {selected ? <FiCheck className="h-4 w-4 shrink-0" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </>,
        document.body,
      )}
    </div>
  );
}
