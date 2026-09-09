import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { FiCheck, FiEdit3 } from 'react-icons/fi';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Modal from '../../../../components/ui/Modal';
import { useLazyResolveCourseCounsellorQuery } from '../../../assignment/redux/assignmentApiSlice';

export default function CourseCounsellorAssignField({
  control,
  errors,
  setValue,
  branchId,
  counsellorOptions,
  counsellorsLoading,
  assignmentMeta,
}) {
  const interestedCourse = useWatch({ control, name: 'interestedCourse' });
  const assignedToId = useWatch({ control, name: 'assignedToId' });
  const [manualMode, setManualMode] = useState(
    () => assignmentMeta?.type === 'MANUAL',
  );
  const [autoHint, setAutoHint] = useState(
    () => (assignmentMeta?.type === 'AUTO' && assignmentMeta?.courseLabel
      ? `Automatically assigned from ${assignmentMeta.courseLabel}`
      : ''),
  );
  const [mappingWarning, setMappingWarning] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCourse, setPendingCourse] = useState('');
  const prevCourseRef = useRef(interestedCourse || '');

  const [resolveCourseCounsellor] = useLazyResolveCourseCounsellorQuery();

  const applyResolvedCounsellor = useCallback(async (courseLabel, { forceApply = false } = {}) => {
    if (!courseLabel?.trim()) {
      setAutoHint('');
      setMappingWarning('');
      return;
    }
    try {
      const result = await resolveCourseCounsellor({
        courseLabel: courseLabel.trim(),
        ...(branchId ? { branchId } : {}),
      }).unwrap();
      if (result.found && result.counsellor) {
        setValue('assignedToId', result.counsellor.id, { shouldDirty: true });
        setValue('manualCounsellorOverride', false);
        setValue('applyCourseCounsellor', forceApply);
        setAutoHint(result.message || `Automatically assigned from ${courseLabel}`);
        setMappingWarning('');
        setManualMode(false);
      } else {
        setAutoHint('');
        setMappingWarning(result.message || 'No counsellor assigned for this course. Please assign manually.');
        if (!assignedToId) setValue('assignedToId', '');
      }
    } catch {
      setMappingWarning('Could not resolve counsellor for this course.');
    }
  }, [assignedToId, branchId, resolveCourseCounsellor, setValue]);

  useEffect(() => {
    const course = interestedCourse?.trim() || '';
    const prev = prevCourseRef.current?.trim() || '';
    if (course === prev) return;

    if (!course) {
      prevCourseRef.current = course;
      setAutoHint('');
      setMappingWarning('');
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
  }, [interestedCourse, manualMode, applyResolvedCounsellor]);

  const handleCounsellorChange = () => {
    setManualMode(true);
    setValue('manualCounsellorOverride', true);
    setValue('applyCourseCounsellor', false);
    setAutoHint('');
  };

  const handleConfirmUpdate = async () => {
    setConfirmOpen(false);
    setManualMode(false);
    setValue('applyCourseCounsellor', true);
    setValue('manualCounsellorOverride', false);
    prevCourseRef.current = pendingCourse;
    await applyResolvedCounsellor(pendingCourse, { forceApply: true });
    setPendingCourse('');
  };

  const handleConfirmKeep = () => {
    setConfirmOpen(false);
    setValue('applyCourseCounsellor', false);
    setValue('manualCounsellorOverride', true);
    prevCourseRef.current = pendingCourse;
    setPendingCourse('');
  };

  const handleEnableManual = () => {
    setManualMode(true);
    setValue('manualCounsellorOverride', true);
    setAutoHint('');
  };

  return (
    <>
      <div className="space-y-1">
        <Controller
          name="assignedToId"
          control={control}
          render={({ field }) => (
            <Select
              label="Assigned Counsellor"
              value={field.value ?? ''}
              onChange={(e) => {
                field.onChange(e.target.value ?? '');
                handleCounsellorChange();
              }}
              options={counsellorOptions}
              placeholder="Select counsellor"
              error={errors?.assignedToId?.message}
              loading={counsellorsLoading}
              allowClear
            />
          )}
        />
        {autoHint && !manualMode && (
          <p className="text-xs text-emerald-700 flex items-center gap-1 m-0">
            <FiCheck aria-hidden />
            {autoHint}
          </p>
        )}
        {mappingWarning && !assignedToId && (
          <p className="text-xs text-amber-700 m-0">{mappingWarning}</p>
        )}
        {!manualMode && interestedCourse && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!px-0 !h-auto text-xs"
            icon={FiEdit3}
            onClick={handleEnableManual}
          >
            Change Counsellor
          </Button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={handleConfirmKeep}
        title="Update counsellor?"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-4">
          Course changed to <strong>{pendingCourse}</strong>. Update the default counsellor for this course?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleConfirmKeep}>Keep Current Counsellor</Button>
          <Button onClick={handleConfirmUpdate}>Update Counsellor</Button>
        </div>
      </Modal>
    </>
  );
}
