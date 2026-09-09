import { Controller } from 'react-hook-form';
import Input from '../../../../../components/ui/Input';
import DatePicker from '../../../../../components/ui/DatePicker';
import FormSection from '../../../../../components/ui/FormSection';
import FormSelectField from '../../../../enquiry/components/EnquiryDrawer/FormSelectField';
import { useEnquiryFormOptions } from '../../../../enquiry/hooks/useEnquiryFormOptions';

const GRID = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-3 gap-y-3';

export default function StudentPersonalTab({ register, control, errors }) {
  const { getOptions } = useEnquiryFormOptions();

  return (
    <FormSection
      title="Personal Details"
      description="Identity, contact, and passport — same master record for the full journey."
      className="crm-personal-details"
    >
      <div className={GRID}>
        <Input
          label="First Name"
          required
          {...register('firstName')}
          error={errors.firstName?.message}
          placeholder="First name"
        />
        <Input
          label="Last Name"
          required
          {...register('lastName')}
          error={errors.lastName?.message}
          placeholder="Last name"
        />
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          placeholder="email@example.com"
        />
        <Input
          label="Phone"
          {...register('phone')}
          error={errors.phone?.message}
          placeholder="Mobile number"
        />
        <Input
          label="Passport No"
          {...register('passportNo')}
          error={errors.passportNo?.message}
          placeholder="Passport number"
        />
        <Controller
          name="dateOfBirth"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Date of Birth"
              value={field.value || ''}
              onChange={field.onChange}
              name={field.name}
              error={errors.dateOfBirth?.message}
            />
          )}
        />
        <FormSelectField
          name="gender"
          control={control}
          label="Gender"
          options={getOptions('gender')}
          errors={errors}
          placeholder="Select gender"
        />
        <FormSelectField
          name="nationality"
          control={control}
          label="Nationality"
          options={getOptions('nationality')}
          errors={errors}
          placeholder="Select nationality"
        />
        <div className="sm:col-span-2 xl:col-span-3">
          <Input
            label="Address"
            {...register('address')}
            error={errors.address?.message}
            placeholder="Street, city, state"
          />
        </div>
        <div className="sm:col-span-2 xl:col-span-3">
          <Input
            label="Emergency contact"
            {...register('emergencyContact')}
            error={errors.emergencyContact?.message}
            placeholder="Name / number"
          />
        </div>
      </div>
    </FormSection>
  );
}
