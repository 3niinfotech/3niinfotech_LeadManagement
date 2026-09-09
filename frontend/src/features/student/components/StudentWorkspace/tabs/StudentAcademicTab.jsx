import FormSection from '../../../../../components/ui/FormSection';
import FormSelectField from '../../../../enquiry/components/EnquiryDrawer/FormSelectField';
import AsyncMasterSelect from '../../../../master/components/AsyncMasterSelect';
import MasterManageLink from '../../../../master/components/MasterManageLink';
import { useEnquiryFormOptions } from '../../../../enquiry/hooks/useEnquiryFormOptions';
import { useStudentStatusOptions } from '../../../hooks/useStudentStatusOptions';

const GRID = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-3 gap-y-3';

export default function StudentAcademicTab({ control, errors }) {
  const { getOptions } = useEnquiryFormOptions();
  const { statusOptions } = useStudentStatusOptions();

  return (
    <FormSection
      title="Academic & Study Plan"
      description="Target country, course, university, intake, and enrolment status."
      className="crm-lead-interest"
    >
      <div className={GRID}>
        <FormSelectField
          name="country"
          control={control}
          label="Country"
          options={getOptions('country')}
          errors={errors}
          placeholder="Select country"
          hint={<MasterManageLink to="/admin/master/country">Manage Country</MasterManageLink>}
        />
        <AsyncMasterSelect
          name="course"
          control={control}
          label="Course"
          entity="course"
          errors={errors}
          placeholder="Search course"
          hint={<MasterManageLink to="/admin/master/course">Manage Courses</MasterManageLink>}
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
          hint={<MasterManageLink to="/admin/master/intake">Manage Intake</MasterManageLink>}
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
  );
}
