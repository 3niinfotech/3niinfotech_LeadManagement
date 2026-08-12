import { Controller } from 'react-hook-form';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import DatePicker from '../../../../components/ui/DatePicker';
import FormSection from '../../../../components/ui/FormSection';
import FormSelectField from './FormSelectField';
import { useEnquiryFormOptions } from '../../hooks/useEnquiryFormOptions';

const GRID = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4';

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
    >
      <fieldset disabled={disabled} className="contents">
        <div className={GRID}>
          {/* Row 1 */}
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

          {/* Row 2 */}
          <div className="grid grid-cols-[5.5rem_1fr] gap-2 items-end min-w-0">
            <FormSelectField
              name="mobileCountry"
              control={control}
              label="Code"
              options={getOptions('countryCode')}
              errors={errors}
              allowClear={false}
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
            label="Alternate No"
            {...register('alternateNo')}
            error={errors.alternateNo?.message}
            placeholder="Optional alternate number"
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

          {/* Row 3 */}
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

          {/* Row 4 — full width */}
          <div className="md:col-span-2 lg:col-span-3">
            <Textarea
              label="Address"
              rows={2}
              {...register('address')}
              error={errors.address?.message}
              placeholder="Full address"
            />
          </div>
        </div>
      </fieldset>
    </FormSection>
  );
}
