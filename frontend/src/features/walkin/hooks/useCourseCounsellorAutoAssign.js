import { useCallback, useEffect, useRef, useState } from 'react';
import { useLazyResolveCourseCounsellorQuery } from '../../assignment/redux/assignmentApiSlice';

/**
 * Resolve default counsellor from course/service mapping for reception flows.
 * Course mapping takes priority over the availability recommendation engine.
 */
export default function useCourseCounsellorAutoAssign({
  courseLabel,
  branchId,
  assignedToId,
  onAssign,
  manualMode,
  setManualMode,
  enabled = true,
}) {
  const [autoHint, setAutoHint] = useState('');
  const [mappingWarning, setMappingWarning] = useState('');
  const [assignmentSource, setAssignmentSource] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCourse, setPendingCourse] = useState('');
  const prevCourseRef = useRef(courseLabel?.trim() || '');

  const [resolveCourseCounsellor, { isFetching: resolving }] = useLazyResolveCourseCounsellorQuery();

  const applyResolvedCounsellor = useCallback(async (label, { forceApply = false } = {}) => {
    const trimmed = label?.trim() || '';
    if (!trimmed || !enabled) {
      setAutoHint('');
      setMappingWarning('');
      setAssignmentSource(null);
      return { found: false };
    }

    try {
      const result = await resolveCourseCounsellor({
        courseLabel: trimmed,
        ...(branchId ? { branchId } : {}),
      }).unwrap();

      if (result.found && result.counsellor?.id) {
        onAssign(result.counsellor.id, {
          source: 'COURSE_MAPPING',
          courseLabel: trimmed,
          forceApply,
        });
        setAutoHint(result.message || `Automatically assigned from ${trimmed}`);
        setMappingWarning('');
        setAssignmentSource('COURSE_MAPPING');
        setManualMode?.(false);
        return { found: true, counsellor: result.counsellor };
      }

      setAutoHint('');
      setMappingWarning(
        result.message || 'No default counsellor for this course — pick one from the list.',
      );
      setAssignmentSource(null);
      return { found: false };
    } catch {
      setAutoHint('');
      setMappingWarning('Could not resolve counsellor for this course.');
      setAssignmentSource(null);
      return { found: false };
    }
  }, [branchId, enabled, onAssign, resolveCourseCounsellor, setManualMode]);

  useEffect(() => {
    if (!enabled) return;

    const course = courseLabel?.trim() || '';
    const prev = prevCourseRef.current?.trim() || '';
    if (course === prev) return;

    if (!course) {
      prevCourseRef.current = course;
      setAutoHint('');
      setMappingWarning('');
      setAssignmentSource(null);
      return;
    }

    if (manualMode && prev && course !== prev) {
      setPendingCourse(course);
      setConfirmOpen(true);
      return;
    }

    prevCourseRef.current = course;
    if (!manualMode) {
      applyResolvedCounsellor(course);
    }
  }, [courseLabel, manualMode, applyResolvedCounsellor, enabled]);

  const enableManualOverride = useCallback(() => {
    setManualMode?.(true);
    setAutoHint('');
    setAssignmentSource('MANUAL');
  }, [setManualMode]);

  const handleManualSelect = useCallback(() => {
    setManualMode?.(true);
    setAutoHint('');
    setAssignmentSource('MANUAL');
  }, [setManualMode]);

  const handleConfirmUpdate = async () => {
    setConfirmOpen(false);
    setManualMode?.(false);
    prevCourseRef.current = pendingCourse;
    await applyResolvedCounsellor(pendingCourse, { forceApply: true });
    setPendingCourse('');
  };

  const handleConfirmKeep = () => {
    setConfirmOpen(false);
    prevCourseRef.current = pendingCourse;
    setPendingCourse('');
  };

  const reset = useCallback(() => {
    prevCourseRef.current = '';
    setAutoHint('');
    setMappingWarning('');
    setAssignmentSource(null);
    setManualMode?.(false);
    setConfirmOpen(false);
    setPendingCourse('');
  }, [setManualMode]);

  return {
    autoHint,
    mappingWarning,
    assignmentSource,
    resolving,
    confirmOpen,
    pendingCourse,
    enableManualOverride,
    handleManualSelect,
    handleConfirmUpdate,
    handleConfirmKeep,
    closeConfirm: handleConfirmKeep,
    reset,
    isCourseMapped: assignmentSource === 'COURSE_MAPPING' && Boolean(autoHint),
  };
}
