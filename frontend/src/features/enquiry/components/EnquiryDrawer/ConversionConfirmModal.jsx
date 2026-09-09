import { useEffect, useState } from 'react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
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

  const name = preview?.enquiry
    ? `${preview.enquiry.firstName || ''} ${preview.enquiry.lastName || ''}`.trim()
    : 'Student';
  const counsellor = preview?.enquiry?.assignedTo
    ? `${preview.enquiry.assignedTo.firstName || ''} ${preview.enquiry.assignedTo.lastName || ''}`.trim()
    : '—';

  return (
    <Modal open={open} onClose={onClose} title="Convert enquiry to student" size="md">
      {loading ? (
        <p className="text-sm text-text-muted py-4">Loading conversion summary…</p>
      ) : (
        <>
          {preview?.alreadyConverted && preview?.existingStudent && (
            <div className="crm-convert-preview crm-convert-preview--warn mb-4">
              This enquiry is already converted to{' '}
              <strong>{preview.existingStudent.studentCode}</strong>.
            </div>
          )}

          {preview?.existingStudent && !preview?.alreadyConverted && (
            <div className="crm-convert-preview crm-convert-preview--info mb-4">
              A matching student record exists ({preview.existingStudent.studentCode}).
              Conversion will link this enquiry — no duplicate will be created.
            </div>
          )}

          <dl className="crm-convert-preview__grid">
            <div><dt>Student</dt><dd>{name}</dd></div>
            <div><dt>Mobile</dt><dd>{preview?.enquiry?.mobile || '—'}</dd></div>
            <div><dt>Course</dt><dd>{preview?.enquiry?.interestedCourse || '—'}</dd></div>
            <div><dt>Counsellor</dt><dd>{counsellor}</dd></div>
            <div><dt>Documents</dt><dd>{preview?.counts?.documents ?? 0} available</dd></div>
            <div><dt>Demos</dt><dd>{preview?.counts?.demos ?? 0}</dd></div>
            <div><dt>Follow-ups</dt><dd>{preview?.counts?.followups ?? 0}</dd></div>
            <div><dt>Notes</dt><dd>{preview?.counts?.notes ?? 0}</dd></div>
          </dl>

          <p className="crm-convert-preview__note">
            Existing enquiry, demo, documents and history will remain linked to this student.
          </p>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose} disabled={converting}>Cancel</Button>
            <Button
              onClick={() => {
                if (preview?.alreadyConverted && preview?.existingStudent?.id) {
                  onOpenStudent?.(preview.existingStudent.id);
                  onClose();
                  return;
                }
                onConfirm();
              }}
              loading={converting}
              disabled={preview?.blocked}
            >
              {preview?.alreadyConverted ? 'Open student' : 'Convert to student'}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
