import PersonalDetailsTab from './PersonalDetailsTab';
import OtherDetailsTab from './OtherDetailsTab';

/** Lead details — personal + enquiry interest fields only */
export default function OverviewTab({
  register,
  control,
  errors,
  readOnly = false,
}) {
  return (
    <div className="space-y-4">
      <PersonalDetailsTab
        register={register}
        control={control}
        errors={errors}
        showPassport={false}
        disabled={readOnly}
      />
      <OtherDetailsTab
        register={register}
        errors={errors}
        control={control}
        variant="enquiry"
        disabled={readOnly}
      />
    </div>
  );
}
