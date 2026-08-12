import { Controller } from 'react-hook-form';
import Input from '../../../../../components/ui/Input';
import DatePicker from '../../../../../components/ui/DatePicker';
import FormSection from '../../../../../components/ui/FormSection';
import FormSelectField from '../../../../enquiry/components/EnquiryDrawer/FormSelectField';
import { useEnquiryFormOptions } from '../../../../enquiry/hooks/useEnquiryFormOptions';

export default function StudentPersonalTab({ register, control, errors }) {
  const { getOptions } = useEnquiryFormOptions();

  return (
    <FormSection title="Personal Details" description="Identity, contact, and passport information.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
        <Input
          label="First Name"
          required
          {...register('firstName')}
          error={errors.firstName?.message}
        />
        <Input
          label="Last Name"
          required
          {...register('lastName')}
          error={errors.lastName?.message}
        />
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Phone"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label="Passport No"
          {...register('passportNo')}
          error={errors.passportNo?.message}
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
        <div className="sm:col-span-2">
          <Input
            label="Address"
            {...register('address')}
            error={errors.address?.message}
          />
        </div>
      </div>
    </FormSection>
  );
}
