import { Controller } from 'react-hook-form';
import DatePicker from '../../../../components/ui/DatePicker';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import FormSection from '../../../../components/ui/FormSection';
import ScrollArea from '../../../../components/ui/ScrollArea';

export default function AppointmentFormTab({ register, control, errors, enquiry, isEditMode }) {
  const history = enquiry?.appointments || [];

  return (
    <div className="space-y-4">
      <FormSection
        title="Appointments"
        description="Book a counselling session or campus visit."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
          <Controller
            name="appointmentDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Appointment Date"
                value={field.value || ''}
                onChange={field.onChange}
                name={field.name}
                error={errors.appointmentDate?.message}
              />
            )}
          />
          <Input
            label="Appointment Time"
            type="time"
            {...register('appointmentTime')}
            error={errors.appointmentTime?.message}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Appointment Remarks"
              {...register('appointmentRemarks')}
              error={errors.appointmentRemarks?.message}
              placeholder="Agenda, location, or meeting link..."
              rows={3}
            />
          </div>
        </div>
      </FormSection>

      {isEditMode && history.length > 0 && (
        <FormSection title="Appointment History">
          <ScrollArea axis="x" className="rounded-lg border border-border">
            <table className="w-full text-[12px]">
              <thead className="bg-row-hover text-left text-text-secondary">
                <tr>
                  <th className="px-3 py-2 font-semibold">Date & Time</th>
                  <th className="px-3 py-2 font-semibold">Title</th>
                  <th className="px-3 py-2 font-semibold">Remarks</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(row.startAt).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2">{row.title || 'Counselling'}</td>
                    <td className="px-3 py-2">{row.remark || '—'}</td>
                    <td className="px-3 py-2">{row.isCompleted ? 'Done' : 'Scheduled'}</td>
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
