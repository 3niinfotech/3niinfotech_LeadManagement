import { Controller } from 'react-hook-form';
import DatePicker from '../../../../components/ui/DatePicker';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import FormSection from '../../../../components/ui/FormSection';
import ScrollArea from '../../../../components/ui/ScrollArea';

export default function FollowUpFormTab({ register, control, errors, enquiry, isEditMode }) {
  const history = enquiry?.followups || [];

  return (
    <div className="space-y-4">
      <FormSection
        title="Follow Up"
        description="Schedule the next callback and add follow-up notes."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
          <Controller
            name="followUpDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Follow Up Date"
                value={field.value || ''}
                onChange={field.onChange}
                name={field.name}
                error={errors.followUpDate?.message}
              />
            )}
          />
          <Input
            label="Follow Up Time"
            type="time"
            {...register('followUpTime')}
            error={errors.followUpTime?.message}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Follow Up Remarks"
              {...register('followUpRemarks')}
              error={errors.followUpRemarks?.message}
              placeholder="What to discuss on the next call..."
              rows={3}
            />
          </div>
        </div>
      </FormSection>

      {isEditMode && history.length > 0 && (
        <FormSection title="Follow-up History" description="Previous follow-up entries.">
          <ScrollArea axis="x" className="rounded-lg border border-border">
            <table className="w-full text-[12px]">
              <thead className="bg-row-hover text-left text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Remark</th>
                  <th className="px-3 py-2 font-semibold">Stage</th>
                  <th className="px-3 py-2 font-semibold">Next Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(row.followupAt || row.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-3 py-2">{row.remark || '—'}</td>
                    <td className="px-3 py-2">{row.stage || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.nextDate ? new Date(row.nextDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </FormSection>
      )}
    </div>
  );
}
