import { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiEdit3, FiZap } from 'react-icons/fi';
import Drawer from '../../../../components/ui/Drawer';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/ui/Modal';
import { useRecommendCounsellorsQuery } from '../../redux/walkinApiSlice';
import useCourseCounsellorAutoAssign from '../../hooks/useCourseCounsellorAutoAssign';
import CounsellorRecommendPanel from './CounsellorRecommendPanel';
import { getVisitorName } from '../../utils/reception.utils';

export default function AssignCounsellorDrawer({
  open,
  lead,
  onClose,
  onAssign,
  saving = false,
}) {
  const [selectedId, setSelectedId] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const courseLabel = lead?.interestedCourse || lead?.metadata?.interestedCourse || '';

  const handleCounsellorAssign = useCallback((id) => {
    setSelectedId(id);
  }, []);

  const {
    autoHint,
    mappingWarning,
    assignmentSource,
    resolving: courseResolving,
    confirmOpen,
    pendingCourse,
    enableManualOverride,
    handleManualSelect,
    handleConfirmUpdate,
    handleConfirmKeep,
    reset: resetCourseAssign,
    isCourseMapped,
  } = useCourseCounsellorAutoAssign({
    courseLabel: open ? courseLabel : '',
    branchId: lead?.branchId,
    assignedToId: selectedId,
    onAssign: handleCounsellorAssign,
    manualMode,
    setManualMode,
    enabled: open && Boolean(lead?.branchId),
  });

  useEffect(() => {
    if (!open) {
      resetCourseAssign();
      return;
    }
    setSelectedId(lead?.assignedToId || '');
    setManualMode(Boolean(lead?.assignedToId));
  }, [open, lead?.id, lead?.assignedToId, resetCourseAssign]);

  const {
    data: recommendations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useRecommendCounsellorsQuery(
    {
      branchId: lead?.branchId,
      interestedCountry: lead?.country || lead?.interestedCountry || undefined,
      interestedCourse: courseLabel || undefined,
    },
    { skip: !open || !lead?.branchId, refetchOnMountOrArgChange: true },
  );

  // Engine fallback when no course mapping
  useEffect(() => {
    if (!open || manualMode || selectedId || courseResolving) return;
    const course = courseLabel?.trim() || '';
    if (course && isCourseMapped) return;
    if (course && !mappingWarning && !autoHint) return;
    if (!recommendations?.length) return;

    const top = recommendations.find((r) => r.recommended)
      || recommendations.find((r) => r.availability?.key === 'AVAILABLE')
      || recommendations[0];
    if (top?.id) setSelectedId(top.id);
  }, [
    open,
    manualMode,
    selectedId,
    courseResolving,
    isCourseMapped,
    courseLabel,
    mappingWarning,
    autoHint,
    recommendations,
  ]);

  const name = getVisitorName(lead);
  const selectedCounsellor = recommendations.find((r) => r.id === selectedId);

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Assign counsellor"
        size="md"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              onClick={() => selectedId && onAssign(selectedId)}
              loading={saving}
              disabled={!selectedId || courseResolving}
            >
              Assign &amp; notify
            </Button>
          </div>
        )}
      >
        <p className="text-sm text-text mb-3">
          {name}
          {lead?.phone ? <span className="text-text-muted"> · {lead.phone}</span> : null}
          {courseLabel ? (
            <span className="crm-reception-drawer-course"> · {courseLabel}</span>
          ) : null}
        </p>

        {(autoHint || courseResolving) && (
          <div className={`crm-reception-course-assign ${courseResolving ? 'is-loading' : 'is-mapped'}`}>
            <FiZap size={14} aria-hidden />
            <span>{courseResolving ? 'Matching counsellor for course…' : autoHint}</span>
          </div>
        )}

        {mappingWarning && !selectedId && (
          <div className="crm-reception-course-assign is-warning">
            <span>{mappingWarning}</span>
          </div>
        )}

        {selectedId && selectedCounsellor && (
          <div className="crm-reception-course-assign is-selected mb-2">
            <FiCheck size={14} aria-hidden />
            <span>
              <strong>
                {`${selectedCounsellor.firstName || ''} ${selectedCounsellor.lastName || ''}`.trim()}
              </strong>
              {assignmentSource === 'COURSE_MAPPING' && !manualMode && (
                <span className="crm-reception-course-assign__tag">Course default</span>
              )}
              {manualMode && (
                <span className="crm-reception-course-assign__tag is-manual">Manual</span>
              )}
            </span>
          </div>
        )}

        {!manualMode && isCourseMapped && (
          <button
            type="button"
            className="crm-reception-course-assign__change mb-2"
            onClick={enableManualOverride}
          >
            <FiEdit3 size={12} aria-hidden />
            Change counsellor
          </button>
        )}

        <CounsellorRecommendPanel
          recommendations={recommendations}
          loading={isLoading && !recommendations.length}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            handleManualSelect();
          }}
          onRefresh={() => refetch()}
          error={isError ? (error?.data?.message || 'Could not load counsellors') : null}
        />
      </Drawer>

      <Modal
        open={confirmOpen}
        onClose={handleConfirmKeep}
        title="Update counsellor?"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Course changed to <strong>{pendingCourse}</strong>. Apply the default counsellor?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleConfirmKeep}>Keep current</Button>
          <Button onClick={handleConfirmUpdate}>Update counsellor</Button>
        </div>
      </Modal>
    </>
  );
}
