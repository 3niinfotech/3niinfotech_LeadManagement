import { useFieldArray } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import FormSelectField from './FormSelectField';
import { ENQUIRY_STATUSES, ENQUIRY_PRIORITIES, ENQUIRY_TAGS } from '../../../../config/constants';
import { useEnquiryFormOptions } from '../../hooks/useEnquiryFormOptions';
import { useCounsellorOptions } from '../../hooks/useCounsellorOptions';

const STATUS_OPTIONS = ENQUIRY_STATUSES.map(({ value, label }) => ({ value, label }));
const PRIORITY_OPTIONS = ENQUIRY_PRIORITIES.map(({ value, label }) => ({ value, label }));
const TAG_OPTIONS = ENQUIRY_TAGS.map(({ value, label }) => ({ value, label }));
const FIELD_GRID = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4';

export default function OtherDetailsTab({
  register, errors, control, variant = 'full', disabled = false,
}) {
  const { getOptions } = useEnquiryFormOptions();
  const { options: counsellorOptions, loading: counsellorsLoading } = useCounsellorOptions();
  const isEnquiry = variant === 'enquiry';
  const { fields, append, remove } = useFieldArray({ control, name: 'testsGiven' });

  return (
    <div className="space-y-4">
      <FormSection
        title={isEnquiry ? 'Lead Interest' : 'Other Details'}
        description={isEnquiry
          ? 'Course interest, source, status, tags, and counsellor notes.'
          : 'Academic background, course interest, enquiry source, tags, and notes.'}
      >
        <fieldset disabled={disabled} className="contents">
          <div className={FIELD_GRID}>
            {!isEnquiry && (
              <FormSelectField
                name="highestQual"
                control={control}
                label="Highest Qualification"
                options={getOptions('highestQual')}
                errors={errors}
                placeholder="Select qualification"
              />
            )}
            {/* Row 1 */}
            <FormSelectField
              name="interestedCourse"
              control={control}
              label="Interested Course"
              options={getOptions('course')}
              errors={errors}
              placeholder="Select course"
            />
            <FormSelectField
              name="interestedCountry"
              control={control}
              label="Interested Country"
              options={getOptions('country')}
              errors={errors}
              placeholder="Select country"
            />
            <FormSelectField
              name="intake"
              control={control}
              label="Intake"
              options={getOptions('intake')}
              errors={errors}
              placeholder="Select intake"
            />
            {/* Row 2 */}
            {!isEnquiry && (
              <FormSelectField
                name="applyLevel"
                control={control}
                label="Apply Level"
                options={getOptions('applyLevel')}
                errors={errors}
                placeholder="Select level"
              />
            )}
            <FormSelectField
              name="source"
              control={control}
              label="Source"
              options={getOptions('source')}
              errors={errors}
              placeholder="Select source"
            />
            {isEnquiry && (
              <FormSelectField
                name="assignedToId"
                control={control}
                label="Counsellor"
                options={counsellorOptions}
                errors={errors}
                placeholder="Select counsellor"
                loading={counsellorsLoading}
                allowClear
              />
            )}
            <FormSelectField
              name="priority"
              control={control}
              label="Priority"
              options={PRIORITY_OPTIONS}
              errors={errors}
              allowClear={false}
              placeholder="Select priority"
            />
            <FormSelectField
              name="status"
              control={control}
              label="Status"
              options={STATUS_OPTIONS}
              errors={errors}
              allowClear={false}
              placeholder="Select status"
            />
            <Input
              label="Other / Reference"
              {...register('otherReference')}
              error={errors.otherReference?.message}
              placeholder="Referrer name or campaign"
            />
            <FormSelectField
              name="tags"
              control={control}
              label="Tags"
              options={TAG_OPTIONS}
              errors={errors}
              mode="multiple"
              placeholder="Select tags"
              allowClear
              searchable
            />
            <div className="md:col-span-2 lg:col-span-3">
              <Textarea
                label="Remark"
                disabled={disabled}
                {...register('remark')}
                error={errors.remark?.message}
                placeholder="Counsellor notes about this enquiry..."
                rows={3}
              />
            </div>
          </div>
        </fieldset>
      </FormSection>

      {!isEnquiry && (
        <FormSection title="Tests Given" description="Add entrance or language test scores.">
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_7rem_auto] gap-2 items-end p-3 rounded-lg border border-border bg-[color-mix(in_srgb,var(--bg-page)_40%,transparent)]"
              >
                <FormSelectField
                  name={`testsGiven.${index}.name`}
                  control={control}
                  label={index === 0 ? 'Test Name' : undefined}
                  options={getOptions('testName')}
                  errors={errors}
                  placeholder="Select test"
                />
                <Input
                  label={index === 0 ? 'Score' : undefined}
                  {...register(`testsGiven.${index}.score`)}
                  placeholder="e.g. 7.5"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={FiTrash2}
                  onClick={() => remove(index)}
                  className="text-danger hover:bg-danger-soft"
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              icon={FiPlus}
              onClick={() => append({ name: '', score: '' })}
            >
              Add Test
            </Button>
          </div>
        </FormSection>
      )}
    </div>
  );
}
