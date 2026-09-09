import StudentPersonalTab from './StudentPersonalTab';
import StudentAcademicTab from './StudentAcademicTab';

/** Single editable tab — personal identity + academic study plan. */
export default function StudentProfileTab({ register, control, errors }) {
  return (
    <div className="space-y-4">
      <StudentPersonalTab register={register} control={control} errors={errors} />
      <StudentAcademicTab control={control} errors={errors} />
    </div>
  );
}
