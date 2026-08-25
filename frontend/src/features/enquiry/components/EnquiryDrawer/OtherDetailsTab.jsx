import { useFieldArray, useWatch } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import FormSelectField from './FormSelectField';
import AsyncMasterSelect from '../../../master/components/AsyncMasterSelect';
import MasterManageLink from '../../../master/components/MasterManageLink';
import { useEnquiryStatusOptions } from '../../hooks/useEnquiryStatusOptions';
import { ENQUIRY_PRIORITIES } from '../../../../config/constants';
import { useEnquiryFormOptions } from '../../hooks/useEnquiryFormOptions';
import { useCounsellorOptions } from '../../hooks/useCounsellorOptions';
import { useEnquiryTagOptions } from '../../hooks/useEnquiryTagOptions';

const PRIORITY_OPTIONS = ENQUIRY_PRIORITIES.map(({ value, label }) => ({ value, label }));
const FIELD_GRID = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4';

export default function OtherDetailsTab({
  register, errors, control, variant = 'full', disabled = false,
}) {
  const branchId = useWatch({ control, name: 'branchId' });
  const { getOptions } = useEnquiryFormOptions();
  const { statusOptions } = useEnquiryStatusOptions();
  const { options: counsellorOptions, loading: counsellorsLoading } = useCounsellorOptions({ branchId });
  const { options: tagOptions, loading: tagsLoading } = useEnquiryTagOptions();
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
                hint={<MasterManageLink to="/admin/master/qualification">Manage Qualification</MasterManageLink>}
              />
            )}
            {/* Row 1 */}
            <AsyncMasterSelect
              name="interestedCourse"
              control={control}
              label="Interested Course"
              entity="course"
              errors={errors}
              placeholder="Search course"
              hint={<MasterManageLink to="/admin/master/course">Manage Courses</MasterManageLink>}
            />
            <FormSelectField
              name="interestedCountry"
              control={control}
              label="Interested Country"
              options={getOptions('country')}
              errors={errors}
              placeholder="Select country"
              hint={<MasterManageLink to="/admin/master/country">Manage Country</MasterManageLink>}
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
            {/* Row 2 */}
            {!isEnquiry && (
              <FormSelectField
                name="applyLevel"
                control={control}
                label="Apply Level"
                options={getOptions('applyLevel')}
                errors={errors}
                placeholder="Select level"
                hint={<MasterManageLink to="/admin/master/applyLevel">Manage Apply Level</MasterManageLink>}
              />
            )}
            <FormSelectField
              name="source"
              control={control}
              label="Source"
              options={getOptions('source')}
              errors={errors}
              placeholder="Select source"
              hint={<MasterManageLink to="/admin/master/lead-source">Manage Sources</MasterManageLink>}
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
              options={statusOptions.map(({ value, label }) => ({ value, label }))}
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
              options={tagOptions}
              errors={errors}
              mode="multiple"
              placeholder={tagsLoading ? 'Loading tags...' : 'Select tags'}
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
