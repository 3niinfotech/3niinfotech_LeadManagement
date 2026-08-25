import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiHome, FiSettings } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import ContentLoader from '../../../components/ui/ContentLoader';
import ProfileTabs from '../../../components/ui/ProfileTabs';
import '../../../components/ui/modal.theme.css';
import { resolveMasterPage, buildMasterBreadcrumbs } from '../../../config/master-registry.config';
import {
  parseCompanySettings,
  followupSlotList,
  buildCompanySettingsPayload,
} from '../../../config/company-settings.config';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { useRelationalMasterOptions } from '../hooks/useRelationalMasterOptions';
import { organizationApi, getOrgApiErrorMessage } from '../services/organizationApi.service';
import { useCompanyRuntime } from '../../organization/CompanyRuntime';
import toastService from '../../../services/toast/toast.service';
import {
  OverviewSection,
  CompanyDetailsSection,
  DefaultsSection,
  MandatorySection,
  BrandingSection,
  SocialSection,
  AccessSection,
  InvoiceSection,
  AttendanceSettingsSection,
  SaveBar,
} from '../components/company-config/CompanyConfigSections';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'layout' },
  { id: 'company', label: 'Logo & details', icon: 'briefcase' },
  { id: 'defaults', label: 'Defaults', icon: 'activity' },
  { id: 'mandatory', label: 'Mandatory fields', icon: 'checkSquare' },
  { id: 'branding', label: 'Colour & title', icon: 'globe' },
  { id: 'social', label: 'Social', icon: 'message' },
  { id: 'access', label: 'Access & IP', icon: 'shield' },
  { id: 'invoice', label: 'Invoice', icon: 'dollar' },
];

function emptyForm() {
  const settings = parseCompanySettings(null);
  return {
    name: '',
    legalName: '',
    email: '',
    phone: '',
    website: '',
    logo: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    countryId: '',
    taxNumber: '',
    registrationNumber: '',
    ...settings,
    followupSlotList: followupSlotList(settings),
  };
}

function companyToForm(company) {
  if (!company) return emptyForm();
  const settings = parseCompanySettings(company.settings);
  return {
    name: company.name || '',
    legalName: company.legalName || '',
    email: company.email || '',
    phone: company.phone || '',
    website: company.website || '',
    logo: company.logo || '',
    addressLine1: company.addressLine1 || '',
    addressLine2: company.addressLine2 || '',
    city: company.city || '',
    state: company.state || '',
    postalCode: company.postalCode || '',
    countryId: company.country?.id || company.countryId || '',
    taxNumber: company.taxNumber || '',
    registrationNumber: company.registrationNumber || '',
    ...settings,
    followupSlotList: followupSlotList(settings),
  };
}

export default function OrganizationCompanyPage() {
  const { slug } = useParams();
  const resolvedSlug = slug || 'company';
  const hubItem = resolveMasterPage(resolvedSlug)?.hubItem;
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.SETTINGS_UPDATE) || can(PERMISSIONS.MASTERS_MANAGE);
  const { applyCompany } = useCompanyRuntime();

  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [baseline, setBaseline] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState('');
  const [tab, setTab] = useState(resolvedSlug === 'invoice-config' ? 'invoice' : 'overview');

  const { options: countryOptions, loading: countriesLoading } = useRelationalMasterOptions('country');
  const { options: currencyOptions } = useRelationalMasterOptions('currency');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await organizationApi.getCompany();
      const next = companyToForm(data);
      setCompany(data);
      setForm(next);
      setBaseline(next);
      applyCompany?.(data);
    } catch (err) {
      toastService.error(getOrgApiErrorMessage(err, 'Failed to load company'));
    } finally {
      setLoading(false);
    }
  }, [applyCompany]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (resolvedSlug === 'invoice-config') setTab('invoice');
  }, [resolvedSlug]);

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(baseline), [form, baseline]);

  const persistCompany = (data) => {
    const next = companyToForm(data);
    setCompany(data);
    setForm(next);
    setBaseline(next);
    applyCompany?.(data);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toastService.error('Company name is required');
      setTab('company');
      return;
    }
    setSaving(true);
    try {
      const updated = await organizationApi.updateCompany({
        name: form.name,
        legalName: form.legalName,
        email: form.email || null,
        phone: form.phone,
        website: form.website || null,
        logo: form.logo || null,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        countryId: form.countryId || null,
        taxNumber: form.taxNumber,
        registrationNumber: form.registrationNumber,
        settings: buildCompanySettingsPayload(form),
      });
      persistCompany(updated);
      toastService.success('Company configuration saved');
    } catch (err) {
      toastService.error(getOrgApiErrorMessage(err, 'Update failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file, kind) => {
    setUploadingKind(kind);
    try {
      const updated = await organizationApi.uploadBranding(file, kind);
      persistCompany(updated);
      toastService.success(kind === 'favicon' ? 'Favicon uploaded' : 'Logo uploaded');
    } catch (err) {
      toastService.error(getOrgApiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploadingKind('');
    }
  };

  const title = hubItem?.label || 'Company Configuration';
  const Icon = resolvedSlug === 'company' ? FiHome : FiSettings;

  return (
    <ModulePageCard
      title={title}
      subtitle={hubItem?.description || 'Site configuration, branding, defaults, and enquiry rules'}
      icon={Icon}
      breadcrumbs={buildMasterBreadcrumbs(hubItem, title)}
    >
      {loading ? (
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <ContentLoader variant="module" />
        </div>
      ) : !company ? (
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <Card className="p-8 text-center text-text-muted">Company not found.</Card>
        </div>
      ) : (
        <>
          <div className="shrink-0 px-3 pt-2">
            <ProfileTabs tabs={TABS} activeTab={tab} onChange={setTab} layoutId="company-config-tabs" />
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-4">
            <div className="max-w-6xl mx-auto">
              {tab === 'overview' && <OverviewSection company={company} form={form} />}
              {tab === 'company' && (
                <CompanyDetailsSection
                  form={form}
                  setField={setField}
                  countryOptions={countryOptions}
                  countriesLoading={countriesLoading}
                  onUpload={handleUpload}
                  uploadingKind={uploadingKind}
                />
              )}
              {tab === 'defaults' && (
                <>
                  <DefaultsSection form={form} setField={setField} currencyOptions={currencyOptions} />
                  <div className="mt-6">
                    <AttendanceSettingsSection form={form} setField={setField} />
                  </div>
                </>
              )}
              {tab === 'mandatory' && <MandatorySection form={form} setField={setField} />}
              {tab === 'branding' && <BrandingSection form={form} setField={setField} />}
              {tab === 'social' && <SocialSection form={form} setField={setField} />}
              {tab === 'access' && <AccessSection form={form} setField={setField} />}
              {tab === 'invoice' && (
                <InvoiceSection form={form} setField={setField} currencyOptions={currencyOptions} />
              )}
            </div>
          </div>
          <SaveBar
            dirty={dirty}
            saving={saving}
            canManage={canManage}
            onSave={handleSave}
            onReset={() => setForm(baseline)}
          />
        </>
      )}
    </ModulePageCard>
  );
}
