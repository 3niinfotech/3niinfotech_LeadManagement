import Input from '../../../../../components/ui/Input';
import FormSection from '../../../../../components/ui/FormSection';
import FormSelectField from '../../../../enquiry/components/EnquiryDrawer/FormSelectField';
import { STUDENT_STATUSES } from '../../../../../config/constants';
import { useEnquiryFormOptions } from '../../../../enquiry/hooks/useEnquiryFormOptions';

const STATUS_OPTIONS = STUDENT_STATUSES.map(({ value, label }) => ({ value, label }));

export default function StudentAcademicTab({ register, control, errors }) {
  const { getOptions } = useEnquiryFormOptions();

  return (
    <div className="space-y-4">
      <FormSection title="Study Plan" description="Target country, course, and intake.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
          <FormSelectField
            name="country"
            control={control}
            label="Country"
            options={getOptions('country')}
            errors={errors}
            placeholder="Select country"
          />
          <FormSelectField
            name="course"
            control={control}
            label="Course"
            options={getOptions('course')}
            errors={errors}
            placeholder="Select course"
          />
          <Input
            label="University"
            {...register('university')}
            error={errors.university?.message}
            placeholder="Target university"
          />
          <FormSelectField
            name="intake"
            control={control}
            label="Intake"
            options={getOptions('intake')}
            errors={errors}
            placeholder="Select intake"
          />
          <FormSelectField
            name="status"
            control={control}
            label="Student Status"
            options={STATUS_OPTIONS}
            errors={errors}
            allowClear={false}
            placeholder="Select status"
          />
        </div>
      </FormSection>
    </div>
  );
}
