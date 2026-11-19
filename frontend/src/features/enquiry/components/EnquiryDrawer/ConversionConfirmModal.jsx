import { useEffect, useState } from 'react';
import {
  FiUserPlus,
  FiUserCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiFileText,
  FiCalendar,
  FiPhoneCall,
  FiEdit3,
  FiSmartphone,
  FiBookOpen,
  FiExternalLink,
  FiShield,
} from 'react-icons/fi';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import { apiGet } from '../../../../api/apiClient';
import { API } from '../../../../config/api';

export default function ConversionConfirmModal({
  open,
  enquiryId,
  onClose,
  onConfirm,
  onOpenStudent,
  converting = false,
}) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !enquiryId) return undefined;
    let cancelled = false;
    setLoading(true);
    apiGet(API.ENQUIRY_CONVERT_PREVIEW(enquiryId))
      .then((res) => {
        if (!cancelled) setPreview(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, enquiryId]);

  const firstName = preview?.enquiry?.firstName || '';
  const lastName = preview?.enquiry?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Student';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'ST';
  const counsellor = preview?.enquiry?.assignedTo
    ? `${preview.enquiry.assignedTo.firstName || ''} ${preview.enquiry.assignedTo.lastName || ''}`.trim()
    : 'Unassigned';

  const isAlreadyConverted = Boolean(preview?.alreadyConverted && preview?.existingStudent);
  const isMatchingExisting = Boolean(preview?.existingStudent && !preview?.alreadyConverted);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Convert Enquiry to Student Master"
      size="md"
    >
      {loading ? (
        <div className="py-10 text-center space-y-2">
          <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-text-muted">Loading conversion summary & activity records…</p>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Status Alerts */}
          {isAlreadyConverted && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs">
              <FiAlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <p className="font-semibold text-sm">Already Converted</p>
                <p className="opacity-90 leading-relaxed">
                  This enquiry is already converted to student{' '}
                  <span className="font-mono font-bold">{preview.existingStudent.studentCode}</span>.
                </p>
              </div>
            </div>
          )}

          {isMatchingExisting && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-900 dark:text-blue-200 text-xs">
              <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-0.5">
                <p className="font-semibold text-sm">Existing Student Record Found</p>
                <p className="opacity-90 leading-relaxed">
                  A matching student record exists (<span className="font-mono font-bold">{preview.existingStudent.studentCode}</span>).
                  Conversion will link this enquiry directly without creating duplicate records.
                </p>
              </div>
            </div>
          )}

          {/* Student Profile Identity Card */}
          <div className="rounded-xl border border-border bg-surface-subtle/50 p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand font-bold text-sm flex items-center justify-center shrink-0 border border-brand/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-semibold text-text-primary leading-tight truncate">
                    {fullName}
                  </h4>
                  {preview?.enquiry?.enquiryCode && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-bg-card border border-border text-text-muted">
                      {preview.enquiry.enquiryCode}
                    </span>
                  )}
                  {preview?.enquiry?.status && (
                    <Badge color="brand" className="text-[11px] py-0.5">
                      {preview.enquiry.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Promote lead to permanent student profile for applications, admission, and fees.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/70 text-xs">
              <div className="flex items-center gap-2 text-text-secondary bg-bg-card/70 px-3 py-2 rounded-lg border border-border/50">
                <FiSmartphone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-text-muted">Mobile:</span>
                <span className="font-medium text-text-primary truncate">
                  {preview?.enquiry?.mobile || '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary bg-bg-card/70 px-3 py-2 rounded-lg border border-border/50">
                <FiBookOpen className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-text-muted">Course:</span>
                <span className="font-medium text-text-primary truncate">
                  {preview?.enquiry?.interestedCourse || 'Study Visa'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary bg-bg-card/70 px-3 py-2 rounded-lg border border-border/50">
                <FiUserCheck className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="text-text-muted">Counsellor:</span>
                <span className="font-medium text-text-primary truncate">
                  {counsellor}
                </span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary bg-bg-card/70 px-3 py-2 rounded-lg border border-border/50">
                <FiShield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-text-muted">Security:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Data Isolated
                </span>
              </div>
            </div>
          </div>

          {/* Activity Retention / History Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>History Preserved on Conversion</span>
              </div>
              <span className="text-[11px] text-text-muted">Zero data loss</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-bg-card border border-border/80 text-center flex flex-col items-center justify-center space-y-1 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                  <FiPhoneCall className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-bold text-text-primary leading-none">
                  {preview?.counts?.followups ?? 0}
                </span>
                <span className="text-[11px] text-text-muted font-medium">Follow-ups</span>
              </div>

              <div className="p-3 rounded-xl bg-bg-card border border-border/80 text-center flex flex-col items-center justify-center space-y-1 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <FiFileText className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-bold text-text-primary leading-none">
                  {preview?.counts?.documents ?? 0}
                </span>
                <span className="text-[11px] text-text-muted font-medium">Documents</span>
              </div>

              <div className="p-3 rounded-xl bg-bg-card border border-border/80 text-center flex flex-col items-center justify-center space-y-1 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <FiCalendar className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-bold text-text-primary leading-none">
                  {preview?.counts?.demos ?? 0}
                </span>
                <span className="text-[11px] text-text-muted font-medium">Demos</span>
              </div>

              <div className="p-3 rounded-xl bg-bg-card border border-border/80 text-center flex flex-col items-center justify-center space-y-1 shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <FiEdit3 className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-bold text-text-primary leading-none">
                  {preview?.counts?.notes ?? 0}
                </span>
                <span className="text-[11px] text-text-muted font-medium">Notes</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-brand/5 border border-brand/15 text-[11px] text-text-secondary flex items-start gap-2">
            <FiCheckCircle className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
            <span>
              All enquiry interaction logs, notes, documents, and audit histories will stay attached to the student master profile.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <Button variant="outline" onClick={onClose} disabled={converting}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isAlreadyConverted && preview?.existingStudent?.id) {
                  onOpenStudent?.(preview.existingStudent.id);
                  onClose();
                  return;
                }
                onConfirm();
              }}
              loading={converting}
              disabled={preview?.blocked}
              icon={isAlreadyConverted ? FiExternalLink : FiUserPlus}
            >
              {isAlreadyConverted ? 'Open Student Profile' : 'Convert to Student'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
