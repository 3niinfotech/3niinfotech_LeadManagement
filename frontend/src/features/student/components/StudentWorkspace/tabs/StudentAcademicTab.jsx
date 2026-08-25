import FormSection from '../../../../../components/ui/FormSection';
import FormSelectField from '../../../../enquiry/components/EnquiryDrawer/FormSelectField';
import AsyncMasterSelect from '../../../../master/components/AsyncMasterSelect';
import { useEnquiryFormOptions } from '../../../../enquiry/hooks/useEnquiryFormOptions';
import { useStudentStatusOptions } from '../../../hooks/useStudentStatusOptions';

export default function StudentAcademicTab({ control, errors }) {
  const { getOptions } = useEnquiryFormOptions();
  const { statusOptions } = useStudentStatusOptions();

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
          <AsyncMasterSelect
            name="course"
            control={control}
            label="Course"
            entity="course"
            errors={errors}
            placeholder="Search course"
          />
          <AsyncMasterSelect
            name="university"
            control={control}
            label="University"
            entity="university"
            errors={errors}
            placeholder="Search university"
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
            options={statusOptions}
            errors={errors}
            allowClear={false}
            placeholder="Select status"
          />
        </div>
      </FormSection>
    </div>
  );
}
