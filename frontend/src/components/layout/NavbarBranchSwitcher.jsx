import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiMapPin } from 'react-icons/fi';
import {
  useGetViewingBranchQuery,
  useSetViewingBranchMutation,
} from '../../features/organization/redux/organizationApiSlice';
import { enquiryApi } from '../../features/enquiry/redux/enquiryApiSlice';
import { walkinApi } from '../../features/walkin/redux/walkinApiSlice';
import { useDispatch } from 'react-redux';
import toastService from '../../services/toast/toast.service';

function branchLabel(branch) {
  if (!branch) return 'All Branches';
  return branch.city ? `${branch.name}` : branch.name;
}

export default function NavbarBranchSwitcher() {
  const dispatch = useDispatch();
  const { data, isLoading } = useGetViewingBranchQuery();
  const [setViewingBranch, { isLoading: switching }] = useSetViewingBranchMutation();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const canSwitch = data?.canSwitch;
  const branches = data?.branches || [];
  const canViewAll = data?.canViewAll;

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
      const width = Math.max(180, rect.width);
      let left = rect.right - width;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      setPos({ top: rect.bottom + 6, left, width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  if (isLoading || !canSwitch || branches.length <= 1) return null;

  const refreshLists = () => {
    dispatch(enquiryApi.util.invalidateTags(['Enquiries', 'EnquirySummary']));
    dispatch(walkinApi.util.invalidateTags(['WalkIns', 'WalkInSummary']));
  };

  const handleSelect = async (branchId) => {
    setOpen(false);
    try {
      await setViewingBranch(branchId).unwrap();
      refreshLists();
      toastService.success(branchId ? 'Branch view updated' : 'Showing all branches');
    } catch (err) {
      toastService.error(err?.data?.message || 'Could not switch branch');
    }
  };

  return (
    <div className="relative hidden md:block overflow-visible">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors max-w-[200px]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <FiMapPin className="shrink-0 text-primary" size={14} />
        <span className="truncate">{currentLabel}</span>
        <FiChevronDown size={14} className="shrink-0 opacity-60" />
      </button>
      {open && createPortal(
        <>
          <button
            type="button"
            className="fixed inset-0 z-[1400] cursor-default"
            aria-label="Close branch menu"
            onClick={() => setOpen(false)}
          />
          <ul
            className="fixed z-[1401] min-w-[180px] rounded-lg border border-border bg-card-bg shadow-lg py-1 text-sm"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            role="listbox"
          >
            {canViewAll && (
              <li>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-surface-hover text-text-primary"
                  onClick={() => handleSelect(null)}
                >
                  All Branches
                </button>
              </li>
            )}
            {branches.map((branch) => (
              <li key={branch.id}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-surface-hover text-text-primary"
                  onClick={() => handleSelect(branch.id)}
                >
                  {branchLabel(branch)}
                </button>
              </li>
            ))}
          </ul>
        </>,
        document.body,
      )}
    </div>
  );
}
