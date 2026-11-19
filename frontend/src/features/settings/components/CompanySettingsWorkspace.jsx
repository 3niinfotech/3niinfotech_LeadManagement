import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiRotateCcw } from 'react-icons/fi';
import ContentLoader from '../../../components/ui/ContentLoader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import ProfileTabs from '../../../components/ui/ProfileTabs';
import '../../master/styles/company-config.theme.css';
import {
  parseCompanySettings,
  followupSlotList,
  buildCompanySettingsPayload,
} from '../../../config/company-settings.config';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import { organizationApi, getOrgApiErrorMessage } from '../../master/services/organizationApi.service';
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
} from '../../master/components/company-config/CompanyConfigSections';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'layout', description: 'Company snapshot and configuration summary.' },
  { id: 'company', label: 'Logo & details', icon: 'briefcase', description: 'Logo, legal identity, contact, and address.' },
  { id: 'defaults', label: 'Defaults', icon: 'activity', description: 'Currency, timezone, follow-ups, and attendance.' },
  { id: 'mandatory', label: 'Mandatory fields', icon: 'checkSquare', description: 'Required enquiry fields for staff.' },
  { id: 'branding', label: 'Colour & title', icon: 'globe', description: 'Portal colours and welcome text.' },
  { id: 'social', label: 'Social', icon: 'message', description: 'Social links in workspace footer.' },
  { id: 'access', label: 'Access & IP', icon: 'shield', description: 'Login window, auto logout, and allowed IPs.' },
  { id: 'invoice', label: 'Invoice', icon: 'dollar', description: 'Tax, currency, and invoice terms.' },
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

export default function CompanySettingsWorkspace({ embedded = false, initialTab = 'overview' }) {
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.SETTINGS_UPDATE) || can(PERMISSIONS.MASTERS_MANAGE);
  const { applyCompany } = useCompanyRuntime();

  const [company, setCompany] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [baseline, setBaseline] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKind, setUploadingKind] = useState('');
  const [tab, setTab] = useState(initialTab);

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

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setTab(initialTab); }, [initialTab]);

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

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (dirty && !saving && canManage) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dirty, saving, canManage, form]);

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

  if (loading) {
    return (
      <div className={embedded ? 'crm-settings-embed-loading' : 'flex-1 min-h-0 overflow-auto p-4'}>
        <ContentLoader variant="module" />
      </div>
    );
  }

  if (!company) {
    return <Card className="p-8 text-center text-text-muted">Company not found.</Card>;
  }

  return (
    <div className={`crm-company-config ${embedded ? 'crm-company-config--embedded' : ''}`}>
      {/* Modern, clean Tab Navigation Bar with integrated Status Indicators */}
      <div className="crm-company-config__tabs-header">
        <div className="flex-1 min-w-0">
          <ProfileTabs
            tabs={TABS}
            activeTab={tab}
            onChange={setTab}
            layoutId={embedded ? 'settings-company-tabs' : 'company-config-tabs'}
            className="crm-company-config-tabs"
          />
        </div>
        <div className="flex items-center gap-2 pl-3 shrink-0">
          {dirty ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Unsaved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Saved
            </span>
          )}

          {canManage && (
            <>
              <Button
                size="sm"
                variant="outline"
                icon={FiRotateCcw}
                onClick={() => setForm(baseline)}
                disabled={saving || !dirty}
                className="text-xs h-8 px-2.5"
                title="Reset changes"
              >
                Reset
              </Button>

              <Button
                size="sm"
                variant="primary"
                icon={FiCheck}
                onClick={handleSave}
                loading={saving}
                disabled={!dirty}
                className="text-xs h-8 font-semibold px-3 shadow-xs"
                title="Save configuration (Ctrl+S)"
              >
                Save
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="crm-company-config__body">
        <div className="crm-company-config__inner">
          {tab === 'overview' && (
            <OverviewSection
              company={company}
              form={form}
              onNavigateTab={setTab}
            />
          )}
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
            <div className="space-y-4">
              <DefaultsSection
                form={form}
                setField={setField}
                currencyOptions={currencyOptions}
              />
              <AttendanceSettingsSection
                form={form}
                setField={setField}
              />
            </div>
          )}
          {tab === 'mandatory' && (
            <MandatorySection
              form={form}
              setField={setField}
            />
          )}
          {tab === 'branding' && (
            <BrandingSection
              form={form}
              setField={setField}
            />
          )}
          {tab === 'social' && (
            <SocialSection
              form={form}
              setField={setField}
            />
          )}
          {tab === 'access' && (
            <AccessSection
              form={form}
              setField={setField}
            />
          )}
          {tab === 'invoice' && (
            <InvoiceSection
              form={form}
              setField={setField}
              currencyOptions={currencyOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
}
