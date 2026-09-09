import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MasterFormShell from '../../master/components/MasterFormShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import FormField from '../../../components/ui/FormField';
import MasterSwitchField from '../../master/components/MasterSwitchField';
import AnnouncementAttachmentField from './AnnouncementAttachmentField';
import { ANNOUNCEMENT_AUDIENCE_OPTIONS } from '../utils/announcement.utils';

const schema = z.object({
  code: z.string().min(1, 'Code is required').max(80),
  name: z.string().min(1, 'Title is required').max(200),
  channel: z.string().min(1),
  subject: z.string().max(255).optional().nullable().or(z.literal('')),
  body: z.string().min(1, 'Message is required').max(10000),
  eventType: z.string().min(1, 'Target audience is required'),
  attachments: z.array(z.object({
    url: z.string(),
    name: z.string(),
    mimeType: z.string().nullable().optional(),
    size: z.number().optional(),
    kind: z.enum(['image', 'file']).optional(),
  })).max(5).optional(),
  description: z.string().max(5000).optional().nullable().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const defaults = {
  code: '',
  name: '',
  channel: 'ANNOUNCEMENT',
  subject: '',
  body: '',
  eventType: 'student_portal',
  attachments: [],
  description: '',
  sortOrder: 0,
  isActive: true,
};

export default function AnnouncementFormDrawer({
  open,
  mode = 'add',
  record,
  submitting = false,
  submitError = null,
  onClose,
  onSubmit,
}) {
  const readOnly = mode === 'view';
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'add') {
      reset(defaults);
      return;
    }
    reset({
      ...defaults,
      ...record,
      attachments: record?.attachments || [],
      sortOrder: record?.sortOrder ?? 0,
      isActive: record?.isActive ?? true,
    });
  }, [open, mode, record, reset]);

  const busy = submitting || isSubmitting;
  const title = mode === 'add' ? 'New announcement' : mode === 'edit' ? 'Edit announcement' : 'View announcement';

  const submit = handleSubmit(async (values) => {
    if (readOnly) return;
    const payload = { ...values };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') payload[k] = null;
    });
    await onSubmit?.(payload);
  });

  return (
    <MasterFormShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Add title, message, upload images or files, and choose who should see it"
      size="lg"
      variant="form"
      error={submitError}
      footer={(
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button type="submit" form="crm-announcement-form" size="sm" loading={busy}>
              {mode === 'add' ? 'Publish announcement' : 'Save changes'}
            </Button>
          )}
        </>
      )}
    >
      <form id="crm-announcement-form" className="crm-master-form crm-ann-form" onSubmit={submit} noValidate>
        <div className="crm-ann-form__grid">
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <FormField label="Code" required error={errors.code?.message}>
                <Input {...field} disabled={readOnly || busy} placeholder="ANN-001" />
              </FormField>
            )}
          />
          <Controller
            name="eventType"
            control={control}
            render={({ field }) => (
              <FormField label="Who should see this?" required error={errors.eventType?.message}>
                <Select
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={ANNOUNCEMENT_AUDIENCE_OPTIONS}
                  disabled={readOnly || busy}
                />
              </FormField>
            )}
          />
        </div>

        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <FormField label="Title" required error={errors.name?.message}>
              <Input {...field} disabled={readOnly || busy} placeholder="Important notice for students" />
            </FormField>
          )}
        />

        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <FormField label="Subtitle (optional)" error={errors.subject?.message}>
              <Input {...field} disabled={readOnly || busy} placeholder="Short summary line" />
            </FormField>
          )}
        />

        <Controller
          name="body"
          control={control}
          render={({ field }) => (
            <FormField label="Message" required error={errors.body?.message}>
              <Textarea
                {...field}
                rows={5}
                disabled={readOnly || busy}
                placeholder="Write your announcement here…"
              />
            </FormField>
          )}
        />

        <Controller
          name="attachments"
          control={control}
          render={({ field }) => (
            <AnnouncementAttachmentField
              value={field.value || []}
              onChange={field.onChange}
              disabled={readOnly || busy}
              error={errors.attachments?.message}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <FormField label="Internal notes (admin only)" error={errors.description?.message}>
              <Textarea {...field} rows={2} disabled={readOnly || busy} placeholder="Optional admin notes" />
            </FormField>
          )}
        />

        <div className="crm-ann-form__grid">
          <Controller
            name="sortOrder"
            control={control}
            render={({ field }) => (
              <FormField label="Sort order" error={errors.sortOrder?.message}>
                <Input
                  type="number"
                  value={field.value ?? 0}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  disabled={readOnly || busy}
                />
              </FormField>
            )}
          />
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <MasterSwitchField
                label="Published / Active"
                checked={Boolean(field.value)}
                onChange={field.onChange}
                disabled={readOnly || busy}
              />
            )}
          />
        </div>
      </form>
    </MasterFormShell>
  );
}
