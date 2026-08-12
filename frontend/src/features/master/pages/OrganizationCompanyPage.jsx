import { useCallback, useEffect, useState } from 'react';
import { FiHome, FiEdit2, FiSave, FiX, FiMapPin, FiMail, FiPhone, FiGlobe } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FormField from '../../../components/ui/FormField';
import ContentLoader from '../../../components/ui/ContentLoader';
import { ROUTES } from '../../../config/routes';
import { resolveMasterPage } from '../../../config/master-registry.config';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { useRelationalMasterOptions } from '../hooks/useRelationalMasterOptions';
import { organizationApi, getOrgApiErrorMessage } from '../services/organizationApi.service';
import toastService from '../../../services/toast/toast.service';

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-text-muted shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">{label}</p>
        <p className="text-sm text-text break-words whitespace-pre-line">{value}</p>
      </div>
    </div>
  );
}

function emptyForm() {
  return {
    name: '',
    legalName: '',
    email: '',
    phone: '',
    website: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    countryId: '',
    taxNumber: '',
    registrationNumber: '',
  };
}

function companyToForm(company) {
  if (!company) return emptyForm();
  return {
    name: company.name || '',
    legalName: company.legalName || '',
    email: company.email || '',
    phone: company.phone || '',
    website: company.website || '',
    addressLine1: company.addressLine1 || '',
    addressLine2: company.addressLine2 || '',
    city: company.city || '',
    state: company.state || '',
    postalCode: company.postalCode || '',
    countryId: company.country?.id || company.countryId || '',
    taxNumber: company.taxNumber || '',
    registrationNumber: company.registrationNumber || '',
  };
}

export default function OrganizationCompanyPage() {
  const hubItem = resolveMasterPage('company');
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.SETTINGS_UPDATE) || can(PERMISSIONS.MASTERS_MANAGE);

  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { options: countryOptions, loading: countriesLoading } = useRelationalMasterOptions('countries');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await organizationApi.getCompany();
      setCompany(data);
      setForm(companyToForm(data));
    } catch (err) {
      toastService.error(getOrgApiErrorMessage(err, 'Failed to load company'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toastService.error('Company name is required');
      return;
    }
    setSaving(true);
    try {
      const updated = await organizationApi.updateCompany({
        ...form,
        countryId: form.countryId || null,
        email: form.email || null,
        website: form.website || null,
      });
      setCompany(updated);
      setForm(companyToForm(updated));
      setEditing(false);
      toastService.success('Company profile updated');
    } catch (err) {
      toastService.error(getOrgApiErrorMessage(err, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(companyToForm(company));
    setEditing(false);
  };

  const addressParts = [
    company?.addressLine1,
    company?.addressLine2,
    [company?.city, company?.state, company?.postalCode].filter(Boolean).join(', '),
    company?.country?.name,
  ].filter(Boolean);

  return (
    <ModulePageCard
      title={hubItem?.label || 'Company'}
      subtitle={hubItem?.description}
      icon={FiHome}
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Master', path: ROUTES.MASTER },
        { label: hubItem?.label || 'Company' },
      ]}
      actions={
        canManage && !loading && company && !editing ? (
          <Button size="sm" variant="outline" icon={FiEdit2} onClick={() => setEditing(true)}>
            Edit profile
          </Button>
        ) : null
      }
    >
      <div className="flex-1 min-h-0 overflow-auto p-4">
        {loading ? (
          <ContentLoader variant="module" />
        ) : !company ? (
          <Card className="p-8 text-center text-text-muted">Company not found.</Card>
        ) : editing ? (
          <Card className="max-w-3xl mx-auto !p-6">
            <h3 className="text-base font-semibold text-text mb-4">Edit company profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Company name" required>
                <Input value={form.name} onChange={(e) => setField('name', e.target.value)} />
              </FormField>
              <FormField label="Legal name">
                <Input value={form.legalName} onChange={(e) => setField('legalName', e.target.value)} />
              </FormField>
              <FormField label="Email">
                <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
              </FormField>
              <FormField label="Phone">
                <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              </FormField>
              <FormField label="Website">
                <Input value={form.website} onChange={(e) => setField('website', e.target.value)} />
              </FormField>
              <FormField label="Country">
                <Select
                  value={form.countryId}
                  onChange={(e) => setField('countryId', e.target.value)}
                  options={countryOptions}
                  placeholder={countriesLoading ? 'Loading...' : 'Select country'}
                  allowClear
                  disabled={countriesLoading}
                />
              </FormField>
              <FormField label="Address line 1" className="md:col-span-2">
                <Input value={form.addressLine1} onChange={(e) => setField('addressLine1', e.target.value)} />
              </FormField>
              <FormField label="Address line 2" className="md:col-span-2">
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
              <FormField label="GST / Tax number">
                <Input value={form.taxNumber} onChange={(e) => setField('taxNumber', e.target.value)} />
              </FormField>
              <FormField label="Registration number">
                <Input value={form.registrationNumber} onChange={(e) => setField('registrationNumber', e.target.value)} />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-card-border">
              <Button variant="ghost" icon={FiX} onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button icon={FiSave} onClick={handleSave} loading={saving}>
                Save changes
              </Button>
            </div>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            <Card className="!p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                    {company.code}
                  </p>
                  <h2 className="text-xl font-bold text-text">{company.name}</h2>
                  {company.legalName && (
                    <p className="text-sm text-text-muted mt-1">{company.legalName}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                    {company.branchCount ?? 0} branch{(company.branchCount ?? 0) === 1 ? '' : 'es'}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      company.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {company.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="!p-5">
                <h3 className="text-sm font-semibold text-text mb-3">Contact</h3>
                <InfoRow icon={FiMail} label="Email" value={company.email} />
                <InfoRow icon={FiPhone} label="Phone" value={company.phone} />
                <InfoRow icon={FiGlobe} label="Website" value={company.website} />
              </Card>
              <Card className="!p-5">
                <h3 className="text-sm font-semibold text-text mb-3">Address</h3>
                <InfoRow
                  icon={FiMapPin}
                  label="Location"
                  value={addressParts.length ? addressParts.join('\n') : '—'}
                />
              </Card>
              <Card className="!p-5 md:col-span-2">
                <h3 className="text-sm font-semibold text-text mb-3">Registration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={FiHome} label="GST / Tax number" value={company.taxNumber} />
                  <InfoRow icon={FiHome} label="Registration number" value={company.registrationNumber} />
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ModulePageCard>
  );
}
