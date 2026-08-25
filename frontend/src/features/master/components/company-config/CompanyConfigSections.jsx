import { useRef, useState } from 'react';
import {
  FiImage, FiUpload, FiMail, FiPhone, FiGlobe, FiMapPin, FiHome, FiFileText,
  FiPlus, FiX, FiCheck,
} from 'react-icons/fi';
import FormSection from '../../../../components/ui/FormSection';
import FormField from '../../../../components/ui/FormField';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import {
  ENQUIRY_MANDATORY_FIELDS,
  FOLLOWUP_DURATION_OPTIONS,
  NAVBAR_TYPE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
  SOCIAL_FIELDS,
  resolvePublicAssetUrl,
} from '../../../../config/company-settings.config';
import { ENQUIRY_FORM_OPTIONS } from '../../../enquiry/config/enquiryFormOptions.config';

const GRID = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-4';

function ChipEditor({ values = [], onChange, placeholder, hint }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const next = draft.trim();
    if (!next || values.includes(next)) return;
    onChange([...values, next]);
    setDraft('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[1.75rem]">
        {values.length === 0 && (
          <span className="text-xs text-text-muted">None added yet</span>
        )}
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full bg-primary-50 text-primary-700 px-2.5 py-1 text-xs font-medium"
          >
            {value}
            <button
              type="button"
              className="text-primary-500 hover:text-danger"
              onClick={() => onChange(values.filter((item) => item !== value))}
              aria-label={`Remove ${value}`}
            >
              <FiX className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button variant="outline" icon={FiPlus} onClick={add}>
          Add
        </Button>
      </div>
      {hint && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

function ColorField({ label, value, onChange, hint }) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#2563EB';
  return (
    <FormField label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 rounded-lg border border-card-border bg-white cursor-pointer"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#2563EB"
        />
      </div>
    </FormField>
  );
}

function ImageAssetField({
  label,
  hint,
  value,
  onUrlChange,
  onFile,
  uploading,
  kind,
}) {
  const inputRef = useRef(null);
  const preview = resolvePublicAssetUrl(value);

  return (
    <FormField label={label} hint={hint}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-24 h-24 shrink-0 rounded-xl border border-dashed border-card-border bg-slate-50 overflow-hidden flex items-center justify-center hover:border-primary-300 hover:bg-primary-50/40 transition-colors"
        >
          {preview ? (
            <img src={preview} alt="" className="w-full h-full object-contain bg-white" />
          ) : (
            <FiImage className="w-7 h-7 text-text-muted" />
          )}
        </button>
        <div className="flex-1 min-w-0 space-y-2">
          <Input
            value={value}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder={kind === 'favicon' ? 'Favicon URL or upload' : 'Logo URL or upload'}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={FiUpload}
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              Upload {kind}
            </Button>
            {value && (
              <Button variant="ghost" size="sm" onClick={() => onUrlChange('')}>
                Remove
              </Button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onFile(file);
          }}
        />
      </div>
    </FormField>
  );
}

export function OverviewSection({ company, form }) {
  const address = [
    form.addressLine1,
    form.addressLine2,
    [form.city, form.state, form.postalCode].filter(Boolean).join(', '),
  ].filter(Boolean).join('\n');
  const logo = resolvePublicAssetUrl(form.logo);
  const enabledCount = ENQUIRY_MANDATORY_FIELDS.filter((field) => form.mandatoryFields?.[field.key]).length;

  return (
    <div className="space-y-4">
      <Card className="!p-6">
        <div className="flex flex-wrap items-start gap-5">
          <div className="w-20 h-20 rounded-2xl border border-card-border bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
            {logo ? (
              <img src={logo} alt="" className="w-full h-full object-contain bg-white" />
            ) : (
              <FiHome className="w-8 h-8 text-text-muted" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
              {company?.code || 'Company'}
            </p>
            <h2 className="text-xl font-bold text-text">{form.name || 'Untitled company'}</h2>
            {form.legalName && <p className="text-sm text-text-muted mt-1">{form.legalName}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              {company?.branchCount ?? 0} branch{(company?.branchCount ?? 0) === 1 ? '' : 'es'}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              company?.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {company?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Mandatory enquiry fields', value: `${enabledCount} / ${ENQUIRY_MANDATORY_FIELDS.length}` },
          { label: 'Follow-up slot', value: `${form.followupSlotDuration || 10} min` },
          { label: 'Navbar', value: form.navbarType === 'compact' ? 'Compact' : 'Vertical' },
        ].map((item) => (
          <Card key={item.label} className="!p-4">
            <p className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">{item.label}</p>
            <p className="text-lg font-semibold text-text mt-1">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="!p-5">
          <h3 className="text-sm font-semibold text-text mb-3">Contact</h3>
          <InfoLine icon={FiMail} label="Email" value={form.email} />
          <InfoLine icon={FiPhone} label="Mobile" value={form.phone} />
          <InfoLine icon={FiPhone} label="WhatsApp" value={form.whatsapp} />
          <InfoLine icon={FiGlobe} label="Website" value={form.website} />
        </Card>
        <Card className="!p-5">
          <h3 className="text-sm font-semibold text-text mb-3">Address</h3>
          <InfoLine icon={FiMapPin} label="Location" value={address || '—'} />
        </Card>
        <Card className="!p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-text mb-3">Registration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoLine icon={FiHome} label="GST / Tax number" value={form.taxNumber} />
            <InfoLine icon={FiFileText} label="Registration number" value={form.registrationNumber} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoLine({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="w-4 h-4 mt-0.5 text-text-muted shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <p className="text-sm text-text break-words whitespace-pre-line">{value}</p>
      </div>
    </div>
  );
}

export function CompanyDetailsSection({
  form, setField, countryOptions, countriesLoading, onUpload, uploadingKind,
}) {
  return (
    <div className="space-y-4">
      <FormSection
        title="Company logo & details"
        description="Logo and favicon appear in the sidebar, browser tab, and invoices."
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ImageAssetField
            label="Company logo"
            kind="logo"
            value={form.logo}
            uploading={uploadingKind === 'logo'}
            onUrlChange={(value) => setField('logo', value)}
            onFile={(file) => onUpload(file, 'logo')}
            hint="PNG or SVG, square works best."
          />
          <ImageAssetField
            label="Favicon"
            kind="favicon"
            value={form.favicon}
            uploading={uploadingKind === 'favicon'}
            onUrlChange={(value) => setField('favicon', value)}
            onFile={(file) => onUpload(file, 'favicon')}
            hint="Small icon for the browser tab."
          />
        </div>
        <div className={`${GRID} mt-4`}>
          <FormField label="Company name" required className="xl:col-span-2">
            <Input value={form.name} onChange={(e) => setField('name', e.target.value)} />
          </FormField>
          <FormField label="Legal name">
            <Input value={form.legalName} onChange={(e) => setField('legalName', e.target.value)} />
          </FormField>
          <FormField label="Company email" required>
            <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </FormField>
          <FormField label="Company mobile" required>
            <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
          </FormField>
          <FormField label="WhatsApp no">
            <Input value={form.whatsapp} onChange={(e) => setField('whatsapp', e.target.value)} placeholder="+91…" />
          </FormField>
          <FormField label="Website">
            <Input value={form.website} onChange={(e) => setField('website', e.target.value)} placeholder="https://" />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Company address" description="Used on invoices, letters, and the company profile.">
        <div className={GRID}>
          <FormField label="Address line 1" required className="md:col-span-2 xl:col-span-3">
            <Input value={form.addressLine1} onChange={(e) => setField('addressLine1', e.target.value)} />
          </FormField>
          <FormField label="Address line 2" className="md:col-span-2 xl:col-span-3">
            <Input value={form.addressLine2} onChange={(e) => setField('addressLine2', e.target.value)} />
          </FormField>
          <FormField label="City">
            <Input value={form.city} onChange={(e) => setField('city', e.target.value)} />
          </FormField>
          <FormField label="State">
            <Input value={form.state} onChange={(e) => setField('state', e.target.value)} />
          </FormField>
          <FormField label="Postal code">
            <Input value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} />
          </FormField>
          <FormField label="Country">
            <Select
              value={form.countryId}
              onChange={(e) => setField('countryId', e.target.value)}
              options={countryOptions}
              placeholder={countriesLoading ? 'Loading…' : 'Select country'}
              allowClear
              disabled={countriesLoading}
            />
          </FormField>
          <FormField label="GST / Tax number">
            <Input value={form.taxNumber} onChange={(e) => setField('taxNumber', e.target.value)} />
          </FormField>
          <FormField label="Registration number">
            <Input value={form.registrationNumber} onChange={(e) => setField('registrationNumber', e.target.value)} />
          </FormField>
        </div>
      </FormSection>
    </div>
  );
}

export function DefaultsSection({ form, setField, currencyOptions }) {
  return (
    <FormSection
      title="Default setting"
      description="These values pre-fill enquiry, follow-up, and invoice screens for this company."
    >
      <div className={GRID}>
        <FormField label="Default mobile code" hint="Used on new enquiry mobile numbers.">
          <Select
            value={form.defaultMobileCode}
            onChange={(e) => setField('defaultMobileCode', e.target.value)}
            options={ENQUIRY_FORM_OPTIONS.countryCode}
            allowClear={false}
          />
        </FormField>
        <FormField label="Default currency">
          <Select
            value={form.defaultCurrencyCode}
            onChange={(e) => setField('defaultCurrencyCode', e.target.value)}
            options={currencyOptions.map((o) => ({
              value: o.code || o.label,
              label: (o.code ? `${o.code} — ` : '') + o.label,
            }))}
            placeholder="Select currency"
            allowClear
          />
        </FormField>
        <FormField label="Default nationality">
          <Select
            value={form.defaultNationality}
            onChange={(e) => setField('defaultNationality', e.target.value)}
            options={ENQUIRY_FORM_OPTIONS.nationality}
            placeholder="Select nationality"
            allowClear
          />
        </FormField>
        <FormField label="Navbar type">
          <Select
            value={form.navbarType}
            onChange={(e) => setField('navbarType', e.target.value)}
            options={NAVBAR_TYPE_OPTIONS}
            allowClear={false}
          />
        </FormField>
        <FormField label="Timezone">
          <Select
            value={form.timezone}
            onChange={(e) => setField('timezone', e.target.value)}
            options={TIMEZONE_OPTIONS}
            allowClear={false}
          />
        </FormField>
        <FormField label="Date format">
          <Select
            value={form.dateFormat}
            onChange={(e) => setField('dateFormat', e.target.value)}
            options={DATE_FORMAT_OPTIONS}
            allowClear={false}
          />
        </FormField>
        <FormField label="Follow-up popup" hint="Open the follow-up tab when creating an enquiry.">
          <Select
            value={form.followupPopup ? 'yes' : 'no'}
            onChange={(e) => setField('followupPopup', e.target.value === 'yes')}
            options={[
              { value: 'yes', label: 'Enabled' },
              { value: 'no', label: 'Disabled' },
            ]}
            allowClear={false}
          />
        </FormField>
        <FormField label="Follow-up slots" hint="Suggested next follow-up time from now.">
          <Select
            value={String(form.followupSlotDuration || '10')}
            onChange={(e) => setField('followupSlotDuration', e.target.value)}
            options={FOLLOWUP_DURATION_OPTIONS}
            allowClear={false}
          />
        </FormField>
        <FormField label="Follow-up time slots" className="md:col-span-2 xl:col-span-3" hint="Times shown in the enquiry follow-up picker.">
          <ChipEditor
            values={form.followupSlotList || []}
            onChange={(list) => setField('followupSlotList', list)}
            placeholder="Add time, e.g. 10:00"
          />
        </FormField>
      </div>
    </FormSection>
  );
}

export function AttendanceSettingsSection({ form, setField }) {
  const att = form.attendance || {};
  const patch = (key, value) => setField('attendance', { ...att, [key]: value });
  return (
    <FormSection
      title="Class attendance window"
      description="Controls when class attendance can be marked, late suggestion, and low-attendance alerts. Does not apply to teacher attendance."
    >
      <div className={GRID}>
        <FormField label="Opens (minutes before class)">
          <Input type="number" min={0} max={180} value={att.openMinutesBefore ?? 15} onChange={(e) => patch('openMinutesBefore', Number(e.target.value))} />
        </FormField>
        <FormField label="Closes (minutes after class)">
          <Input type="number" min={0} max={240} value={att.closeMinutesAfter ?? 30} onChange={(e) => patch('closeMinutesAfter', Number(e.target.value))} />
        </FormField>
        <FormField label="Late after (minutes from start)">
          <Input type="number" min={0} max={120} value={att.lateThresholdMinutes ?? 15} onChange={(e) => patch('lateThresholdMinutes', Number(e.target.value))} />
        </FormField>
        <FormField label="Low attendance threshold (%)">
          <Input type="number" min={1} max={100} value={att.lowAttendancePercent ?? 75} onChange={(e) => patch('lowAttendancePercent', Number(e.target.value))} />
        </FormField>
        <FormField label="Consecutive absence alert">
          <Input type="number" min={1} max={20} value={att.consecutiveAbsenceAlert ?? 3} onChange={(e) => patch('consecutiveAbsenceAlert', Number(e.target.value))} />
        </FormField>
      </div>
    </FormSection>
  );
}

export function MandatorySection({ form, setField }) {
  const toggle = (key) => {
    setField('mandatoryFields', {
      ...(form.mandatoryFields || {}),
      [key]: !form.mandatoryFields?.[key],
    });
  };

  return (
    <FormSection
      title="Mandatory permissions"
      description="Enable or disable fields to set mandatory requirements on the enquiry form."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {ENQUIRY_MANDATORY_FIELDS.map((field) => {
          const on = Boolean(form.mandatoryFields?.[field.key]);
          return (
            <button
              key={field.key}
              type="button"
              onClick={() => toggle(field.key)}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                on
                  ? 'border-primary-200 bg-primary-50 text-primary-800'
                  : 'border-card-border bg-card-bg text-text hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-medium">{field.label}</span>
              <span className={`inline-flex h-5 w-9 items-center rounded-full px-0.5 ${on ? 'bg-primary-600' : 'bg-slate-300'}`}>
                <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`} />
              </span>
            </button>
          );
        })}
      </div>
    </FormSection>
  );
}

export function BrandingSection({ form, setField }) {
  return (
    <div className="space-y-4">
      <FormSection
        title="Portal colour & title / subtitle"
        description="Branding applies to the logged-in workspace after save."
      >
        <div className={GRID}>
          <ColorField label="Primary colour" value={form.primaryColour} onChange={(v) => setField('primaryColour', v)} />
          <ColorField label="Secondary colour" value={form.secondaryColour} onChange={(v) => setField('secondaryColour', v)} />
          <ColorField label="Header colour" value={form.headerColour} onChange={(v) => setField('headerColour', v)} />
          <ColorField label="Font colour" value={form.fontColour} onChange={(v) => setField('fontColour', v)} />
          <FormField label="Title" className="md:col-span-2">
            <Input
              value={form.portalTitle}
              onChange={(e) => setField('portalTitle', e.target.value)}
              placeholder="Welcome to your consultancy"
            />
          </FormField>
          <FormField label="Sub title" className="md:col-span-2 xl:col-span-3">
            <Input
              value={form.portalSubtitle}
              onChange={(e) => setField('portalSubtitle', e.target.value)}
              placeholder="CRM for study abroad, immigration and institute"
            />
          </FormField>
          <FormField label="Scrolling text" className="md:col-span-2 xl:col-span-3">
            <Input
              value={form.scrollingText}
              onChange={(e) => setField('scrollingText', e.target.value)}
              placeholder="Shown as a banner under the header"
            />
          </FormField>
        </div>
      </FormSection>

      <Card className="!p-5">
        <p className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-3">Live preview</p>
        <div
          className="rounded-xl overflow-hidden border border-card-border"
          style={{ background: form.headerColour || '#1e293b' }}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: form.fontColour || '#fff' }}>
                {form.portalTitle || form.name || 'Portal title'}
              </p>
              <p className="text-xs opacity-80" style={{ color: form.fontColour || '#fff' }}>
                {form.portalSubtitle || 'Subtitle appears here'}
              </p>
            </div>
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: form.primaryColour || '#2563EB', color: '#fff' }}
            >
              Primary
            </span>
          </div>
          {form.scrollingText && (
            <div
              className="text-[11px] px-4 py-1.5 truncate"
              style={{ background: form.secondaryColour || form.primaryColour || '#1d4ed8', color: '#fff' }}
            >
              {form.scrollingText}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export function SocialSection({ form, setField }) {
  return (
    <FormSection
      title="Social media icons"
      description="Links appear in the workspace footer when filled."
    >
      <div className={GRID}>
        {SOCIAL_FIELDS.map((field) => (
          <FormField key={field.key} label={field.label}>
            <Input
              value={form[field.key] || ''}
              onChange={(e) => setField(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          </FormField>
        ))}
      </div>
    </FormSection>
  );
}

export function AccessSection({ form, setField }) {
  return (
    <div className="space-y-4">
      <FormSection
        title="Login time setting"
        description="Office-hour window for admin and employee logins. Stored on this company; login enforcement stays on the auth policy."
      >
        <div className={GRID}>
          <FormField label="Start time">
            <Input
              type="time"
              value={form.loginStartTime}
              onChange={(e) => setField('loginStartTime', e.target.value)}
            />
          </FormField>
          <FormField label="End time">
            <Input
              type="time"
              value={form.loginEndTime}
              onChange={(e) => setField('loginEndTime', e.target.value)}
            />
          </FormField>
          <FormField label="Auto logout (min)" hint="0 keeps the session until the token expires.">
            <Input
              type="number"
              min="0"
              value={form.autoLogoutMinutes}
              onChange={(e) => setField('autoLogoutMinutes', e.target.value)}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="IP security"
        description="Add office or location IPs for this company. Empty list means no IP restriction is stored."
      >
        <ChipEditor
          values={form.allowedIps || []}
          onChange={(list) => setField('allowedIps', list)}
          placeholder="Add IPv4, IPv6, or CIDR"
          hint="Example: 103.21.244.0/24"
        />
      </FormSection>
    </div>
  );
}

export function InvoiceSection({ form, setField, currencyOptions = [] }) {
  return (
    <FormSection
      title="Invoice configuration"
      description="Legal name, tax number, and terms printed on invoices for this company."
    >
      <div className={GRID}>
        <FormField label="GST / Tax number">
          <Input value={form.taxNumber} onChange={(e) => setField('taxNumber', e.target.value)} />
        </FormField>
        <FormField label="Registration number">
          <Input value={form.registrationNumber} onChange={(e) => setField('registrationNumber', e.target.value)} />
        </FormField>
        <FormField label="Default invoice currency">
          <Select
            value={form.defaultCurrencyCode}
            onChange={(e) => setField('defaultCurrencyCode', e.target.value)}
            options={currencyOptions.map((o) => ({
              value: o.code || o.label,
              label: (o.code ? `${o.code} — ` : '') + o.label,
            }))}
            placeholder="Select currency"
            allowClear
          />
        </FormField>
        <FormField label="Invoice terms & conditions" className="md:col-span-2 xl:col-span-3">
          <Textarea
            rows={5}
            value={form.invoiceTerms}
            onChange={(e) => setField('invoiceTerms', e.target.value)}
            placeholder="Payment terms, bank details, and legal notes"
          />
        </FormField>
      </div>
    </FormSection>
  );
}

export function SaveBar({ dirty, saving, onSave, onReset, canManage }) {
  if (!canManage) return null;
  return (
    <div className="shrink-0 border-t border-card-border bg-card-bg px-4 py-3 flex items-center justify-between gap-3">
      <p className="text-xs text-text-muted">
        {dirty ? 'Unsaved changes on this company.' : 'All changes saved.'}
      </p>
      <div className="flex gap-2">
        <Button variant="ghost" icon={FiX} onClick={onReset} disabled={saving || !dirty}>
          Reset
        </Button>
        <Button icon={FiCheck} onClick={onSave} loading={saving} disabled={!dirty}>
          Save configuration
        </Button>
      </div>
    </div>
  );
}
