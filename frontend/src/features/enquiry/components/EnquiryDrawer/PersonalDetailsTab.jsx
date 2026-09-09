import { Controller } from 'react-hook-form';
import Input from '../../../../components/ui/Input';
import DatePicker from '../../../../components/ui/DatePicker';
import FormSection from '../../../../components/ui/FormSection';
import FormSelectField from './FormSelectField';
import { useEnquiryFormOptions } from '../../hooks/useEnquiryFormOptions';

const GRID = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-3 gap-y-3';

export default function PersonalDetailsTab({
  register, control, errors, showPassport = false, disabled = false,
}) {
  const { getOptions } = useEnquiryFormOptions();

  return (
    <FormSection
      title="Personal Details"
      description={showPassport
        ? 'Contact, identity, and passport information.'
        : 'Contact and basic identity for this lead.'}
      className="crm-personal-details"
    >
      <fieldset disabled={disabled} className="contents">
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
            {...register('lastName')}
            error={errors.lastName?.message}
            placeholder="Last name"
          />
          <Input
            label="Email"
            type="email"
            required
            {...register('email')}
            error={errors.email?.message}
            placeholder="email@example.com"
          />

          <div className="grid grid-cols-[4.5rem_1fr] gap-1.5 items-end min-w-0">
            <FormSelectField
              name="mobileCountry"
              control={control}
              label="Code"
              options={getOptions('countryCode')}
              errors={errors}
              allowClear={false}
              searchable
            />
            <Input
              label="Mobile"
              required
              {...register('mobile')}
              error={errors.mobile?.message}
              placeholder="81234 56789"
            />
          </div>
          <Input
            label="Alternate / Emergency"
            {...register('alternateNo')}
            error={errors.alternateNo?.message}
            placeholder="Alternate or emergency contact"
          />
          {showPassport ? (
            <Input
              label="Passport No"
              {...register('passportNo')}
              error={errors.passportNo?.message}
              placeholder="Passport number"
            />
          ) : (
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
          )}

          {showPassport && (
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
          )}
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
          <FormSelectField
            name="maritalStatus"
            control={control}
            label="Marital Status"
            options={getOptions('maritalStatus')}
            errors={errors}
            placeholder="Select status"
          />
          <div className="sm:col-span-2 xl:col-span-3">
            <Input
              label="Address"
              {...register('address')}
              error={errors.address?.message}
              placeholder="Street, city, state"
            />
          </div>
        </div>
      </fieldset>
    </FormSection>
  );
}
