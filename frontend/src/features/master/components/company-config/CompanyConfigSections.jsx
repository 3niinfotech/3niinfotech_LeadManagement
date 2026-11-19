import { useRef, useState, useMemo } from 'react';
import {
  FiImage,
  FiUpload,
  FiMail,
  FiPhone,
  FiGlobe,
  FiMapPin,
  FiHome,
  FiFileText,
  FiPlus,
  FiX,
  FiCheck,
  FiCheckSquare,
  FiActivity,
  FiLayers,
  FiClock,
  FiArrowRight,
  FiShield,
  FiDollarSign,
  FiCalendar,
  FiExternalLink,
  FiCopy,
  FiHelpCircle,
  FiSliders,
  FiSun,
  FiMonitor,
  FiLock,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiBookmark,
  FiTrash2,
} from 'react-icons/fi';
import {
  FaLinkedinIn,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaFacebookF,
  FaPinterestP,
  FaWhatsapp,
} from 'react-icons/fa';
import FormSection from '../../../../components/ui/FormSection';
import FormField from '../../../../components/ui/FormField';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import toastService from '../../../../services/toast/toast.service';
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

// ── Logical Categories for Mandatory Enquiry Fields ──
export const MANDATORY_FIELD_GROUPS = [
  {
    id: 'personal',
    label: 'Personal & Identity',
    description: 'Name, gender, date of birth and nationality',
    keys: ['firstName', 'lastName', 'gender', 'dateOfBirth', 'maritalStatus', 'nationality'],
  },
  {
    id: 'contact',
    label: 'Contact Information',
    description: 'Email, mobile and residential address',
    keys: ['email', 'mobile', 'alternateNo', 'address'],
  },
  {
    id: 'academic',
    label: 'Academic & Course Intent',
    description: 'Prior education, tests and applied course level',
    keys: ['highestQual', 'interestedCourse', 'testsGiven', 'applyLevel'],
  },
  {
    id: 'pipeline',
    label: 'Lead Tracking & CRM Funnel',
    description: 'Lead source, funnel status, target country and intake',
    keys: ['source', 'status', 'interestedCountry', 'intake', 'remark'],
  },
  {
    id: 'passport',
    label: 'Passport & Travel Verification',
    description: 'International travel and visa document details',
    keys: ['passportNo', 'dateOfIssue', 'dateOfExpiry'],
  },
];

// ── Theme Color Presets ──
const THEME_PRESETS = [
  {
    id: 'indigo',
    name: 'Enterprise Indigo',
    primary: '#4F46E5',
    secondary: '#6366F1',
    header: '#0F172A',
    font: '#FFFFFF',
  },
  {
    id: 'blue',
    name: 'Corporate Blue',
    primary: '#2563EB',
    secondary: '#3B82F6',
    header: '#1E293B',
    font: '#FFFFFF',
  },
  {
    id: 'emerald',
    name: 'Emerald Growth',
    primary: '#059669',
    secondary: '#10B981',
    header: '#064E3B',
    font: '#FFFFFF',
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    header: '#1E1B4B',
    font: '#FFFFFF',
  },
  {
    id: 'slate',
    name: 'Minimal Slate',
    primary: '#0F172A',
    secondary: '#334155',
    header: '#F8FAFC',
    font: '#0F172A',
  },
];

// Helper: Copy to clipboard
function copyToClipboard(text, label = 'Copied') {
  if (!text) return;
  navigator.clipboard.writeText(text);
  toastService.success(`${label} copied to clipboard`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. OVERVIEW SECTION
// ─────────────────────────────────────────────────────────────────────────────
export function OverviewSection({ company, form, onNavigateTab }) {
  const addressFormatted = [
    form.addressLine1,
    form.addressLine2,
    [form.city, form.state, form.postalCode].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(', ');

  const logoUrl = resolvePublicAssetUrl(form.logo);
  const enabledCount = ENQUIRY_MANDATORY_FIELDS.filter((f) => form.mandatoryFields?.[f.key]).length;
  const totalCount = ENQUIRY_MANDATORY_FIELDS.length;
  const mandatoryPct = totalCount ? Math.round((enabledCount / totalCount) * 100) : 0;

  const kpis = [
    {
      id: 'mandatory',
      label: 'Mandatory Enquiry Fields',
      value: `${enabledCount} / ${totalCount}`,
      sub: `${mandatoryPct}% required fields`,
      icon: FiCheckSquare,
      color: 'indigo',
      tab: 'mandatory',
    },
    {
      id: 'followup',
      label: 'Next Follow-up Slot',
      value: `${form.followupSlotDuration || 10} min`,
      sub: 'Default prompt interval',
      icon: FiClock,
      color: 'sky',
      tab: 'defaults',
    },
    {
      id: 'layout',
      label: 'Navigation Style',
      value: form.navbarType === 'compact' ? 'Compact Dock' : 'Vertical Sidebar',
      sub: 'Active sidebar layout',
      icon: FiLayers,
      color: 'amber',
      tab: 'defaults',
    },
    {
      id: 'branches',
      label: 'Branch Network',
      value: `${company?.branchCount ?? 0} Offices`,
      sub: company?.branchCount === 1 ? '1 active location' : 'Active locations',
      icon: FiHome,
      color: 'emerald',
      tab: null,
    },
  ];

  const quickLinks = [
    { id: 'company', label: 'Logo & Details', icon: FiImage },
    { id: 'defaults', label: 'Defaults & Attendance', icon: FiSliders },
    { id: 'mandatory', label: 'Mandatory Fields', icon: FiCheckSquare },
    { id: 'branding', label: 'Colours & Title', icon: FiGlobe },
    { id: 'social', label: 'Social Media', icon: FiMail },
    { id: 'access', label: 'Access & IP Policy', icon: FiShield },
    { id: 'invoice', label: 'Invoice Terms', icon: FiDollarSign },
  ];

  return (
    <div className="space-y-4">
      {/* ── Top Hero Identity Card ── */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <FiHome className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  {company?.code || 'MAIN'}
                </span>
                <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  {company?.isActive ? 'Active Workspace' : 'Inactive'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {company?.branchCount ?? 0} Branch Offices
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {form.name || 'Company Name'}
              </h2>
              {form.legalName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {form.legalName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Button
              size="sm"
              variant="outline"
              icon={FiImage}
              onClick={() => onNavigateTab('company')}
              className="text-xs"
            >
              Edit Branding
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={FiSliders}
              onClick={() => onNavigateTab('defaults')}
              className="text-xs"
            >
              Configure Defaults
            </Button>
          </div>
        </div>
      </div>

      {/* ── 4 High-Impact KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.id}
              type="button"
              disabled={!kpi.tab}
              onClick={() => kpi.tab && onNavigateTab(kpi.tab)}
              className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs text-left transition-all group ${
                kpi.tab
                  ? 'hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xs cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </span>
                <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {kpi.value}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>{kpi.sub}</span>
                {kpi.tab && (
                  <FiArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 3-Column Structured Information Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Direct Contact Channels */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FiMail className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Contact Channels
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('company')}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Official Email</span>
                {form.email ? (
                  <div className="flex items-center justify-between group">
                    <a
                      href={`mailto:${form.email}`}
                      className="text-slate-800 dark:text-slate-200 font-semibold hover:text-indigo-600 truncate"
                    >
                      {form.email}
                    </a>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.email, 'Email')}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
                      title="Copy email"
                    >
                      <FiCopy className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Not configured</span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Primary Phone</span>
                {form.phone ? (
                  <div className="flex items-center justify-between group">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {form.phone}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.phone, 'Phone')}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
                    >
                      <FiCopy className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Not configured</span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">WhatsApp Support</span>
                {form.whatsapp ? (
                  <span className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <FaWhatsapp className="w-3.5 h-3.5" />
                    {form.whatsapp}
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Not set</span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Official Website</span>
                {form.website ? (
                  <a
                    href={form.website.startsWith('http') ? form.website : `https://${form.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{form.website.replace(/^https?:\/\//, '')}</span>
                    <FiExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Not configured</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Registered Corporate Office */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FiMapPin className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Head Office Address
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('company')}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Street & Building</span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                  {form.addressLine1 || form.addressLine2 ? (
                    <>
                      {form.addressLine1}
                      {form.addressLine2 && <span className="block">{form.addressLine2}</span>}
                    </>
                  ) : (
                    <span className="text-slate-400 italic font-normal">No address line added</span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">City / State</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">
                    {[form.city, form.state].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Postal / PIN</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">
                    {form.postalCode || '—'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Country / Region</span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold">
                  {form.country?.name || form.defaultNationality || 'India'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Tax, Legal & System Defaults */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <FiFileText className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Tax & Identification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('invoice')}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold"
              >
                Edit
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">GST / Tax Identification</span>
                <div className="flex items-center justify-between group">
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                    {form.taxNumber || '—'}
                  </span>
                  {form.taxNumber && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.taxNumber, 'Tax Number')}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
                    >
                      <FiCopy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Company Registration / CIN</span>
                <div className="flex items-center justify-between group">
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                    {form.registrationNumber || '—'}
                  </span>
                  {form.registrationNumber && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(form.registrationNumber, 'Registration')}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity"
                    >
                      <FiCopy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Currency</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {form.defaultCurrencyCode || 'INR (₹)'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Timezone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {form.timezone?.split('/')?.[1] || 'Kolkata'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Jump Configuration Buttons ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Quick Configuration Shortcuts
          </span>
          <span className="text-xs text-slate-400">Click to jump into any tab</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigateTab(link.id)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{link.label}</span>
                <FiArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPANY DETAILS (LOGO & DETAILS)
// ─────────────────────────────────────────────────────────────────────────────
export function CompanyDetailsSection({
  form,
  setField,
  countryOptions,
  countriesLoading,
  onUpload,
  uploadingKind,
}) {
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  const logoPreview = resolvePublicAssetUrl(form.logo);
  const faviconPreview = resolvePublicAssetUrl(form.favicon);

  return (
    <div className="space-y-4">
      {/* ── Brand Assets Upload Cards (Logo & Favicon) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Logo Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Company Brand Logo
              </h3>
              <p className="text-[11px] text-slate-400">Used on navigation, invoices, and letterheads</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              PNG / SVG / WebP
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <FiImage className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={FiUpload}
                  loading={uploadingKind === 'logo'}
                  onClick={() => logoInputRef.current?.click()}
                  className="text-xs"
                >
                  Upload Logo
                </Button>
                {form.logo && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={FiTrash2}
                    onClick={() => setField('logo', '')}
                    className="text-xs text-rose-600 hover:text-rose-700 border-rose-200"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Recommended 512×512 square transparent PNG or SVG for best clarity.
              </p>
            </div>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onUpload(file, 'logo');
            }}
          />
        </div>

        {/* Favicon Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Browser Tab Favicon
              </h3>
              <p className="text-[11px] text-slate-400">Displayed in browser bookmarks & tab bars</p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              ICO / PNG
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {faviconPreview ? (
                <img src={faviconPreview} alt="Favicon" className="w-10 h-10 object-contain" />
              ) : (
                <FiGlobe className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={FiUpload}
                  loading={uploadingKind === 'favicon'}
                  onClick={() => faviconInputRef.current?.click()}
                  className="text-xs"
                >
                  Upload Favicon
                </Button>
                {form.favicon && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={FiTrash2}
                    onClick={() => setField('favicon', '')}
                    className="text-xs text-rose-600 hover:text-rose-700 border-rose-200"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Recommended 32×32 or 64×64 pixels .ico or square PNG.
              </p>
            </div>
          </div>
          <input
            ref={faviconInputRef}
            type="file"
            accept="image/x-icon,image/png,image/svg+xml,.ico"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onUpload(file, 'favicon');
            }}
          />
        </div>
      </div>

      {/* ── General Company Information ── */}
      <FormSection
        title="General Identity & Communications"
        description="Public trade name, legal entity name, and official communication channels."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Company Trade Name" required hint="Shown in top header, emails and portal branding">
            <Input
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. 3ni Infotech"
            />
          </FormField>

          <FormField label="Registered Legal Entity Name" hint="Official corporate entity name for invoices and agreements">
            <Input
              value={form.legalName}
              onChange={(e) => setField('legalName', e.target.value)}
              placeholder="e.g. 3ni Infotech Education & Visa Services Pvt. Ltd."
            />
          </FormField>

          <FormField label="Official Contact Email" required hint="System emails, alerts and invoices are sent from this">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="e.g. info@company.com"
            />
          </FormField>

          <FormField label="Primary Contact Phone" required hint="General inquiries and customer support helpline">
            <Input
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+91 79 1234 5678"
            />
          </FormField>

          <FormField label="WhatsApp Business Number" hint="Optional link for instant messaging in portals">
            <Input
              value={form.whatsapp}
              onChange={(e) => setField('whatsapp', e.target.value)}
              placeholder="+91 98765 43210"
            />
          </FormField>

          <FormField label="Official Website URL" hint="Main website address">
            <Input
              value={form.website}
              onChange={(e) => setField('website', e.target.value)}
              placeholder="https://www.company.com"
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── Registered Office Address ── */}
      <FormSection
        title="Registered Office & Address"
        description="Primary headquarters location printed on invoices, letters and legal documentation."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Address Line 1" required className="md:col-span-2">
            <Input
              value={form.addressLine1}
              onChange={(e) => setField('addressLine1', e.target.value)}
              placeholder="Building name, Floor, Suite number, Street name"
            />
          </FormField>

          <FormField label="Address Line 2" className="md:col-span-2">
            <Input
              value={form.addressLine2}
              onChange={(e) => setField('addressLine2', e.target.value)}
              placeholder="Landmark, Area, Cross roads (optional)"
            />
          </FormField>

          <FormField label="City / District">
            <Input
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
              placeholder="e.g. Ahmedabad"
            />
          </FormField>

          <FormField label="State / Province">
            <Input
              value={form.state}
              onChange={(e) => setField('state', e.target.value)}
              placeholder="e.g. Gujarat"
            />
          </FormField>

          <FormField label="Postal / PIN Code">
            <Input
              value={form.postalCode}
              onChange={(e) => setField('postalCode', e.target.value)}
              placeholder="e.g. 380015"
            />
          </FormField>

          <FormField label="Country">
            <Select
              value={form.countryId}
              onChange={(e) => setField('countryId', e.target.value)}
              options={countryOptions}
              placeholder={countriesLoading ? 'Loading countries…' : 'Select country'}
              allowClear
              disabled={countriesLoading}
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── Regulatory Identification ── */}
      <FormSection
        title="Regulatory & Tax Registration"
        description="Corporate identity numbers required for billing compliance and tax authorities."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="GST / VAT / Tax ID" hint="Printed on client tax invoices and billing receipts">
            <Input
              value={form.taxNumber}
              onChange={(e) => setField('taxNumber', e.target.value)}
              placeholder="e.g. GSTIN24AABCU9603R1ZM"
            />
          </FormField>

          <FormField label="Company Registration / CIN / License" hint="Incorporation number registered with government">
            <Input
              value={form.registrationNumber}
              onChange={(e) => setField('registrationNumber', e.target.value)}
              placeholder="e.g. U80900GJ2018PTC105432"
            />
          </FormField>
        </div>
      </FormSection>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DEFAULTS & ATTENDANCE SECTION
// ─────────────────────────────────────────────────────────────────────────────
export function DefaultsSection({ form, setField, currencyOptions = [] }) {
  // Preset time slots
  const setStandardSlots = () => {
    setField('followupSlotList', ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']);
  };

  const setMorningSlots = () => {
    setField('followupSlotList', ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00']);
  };

  const setAfternoonSlots = () => {
    setField('followupSlotList', ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']);
  };

  return (
    <div className="space-y-4">
      {/* ── Regional & System Localization Defaults ── */}
      <FormSection
        title="Regional & System Defaults"
        description="Pre-fill values for new enquiries, international dials, and global timestamps."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Default Calling Code" hint="Pre-selected on student/enquiry mobile">
            <Select
              value={form.defaultMobileCode}
              onChange={(e) => setField('defaultMobileCode', e.target.value)}
              options={ENQUIRY_FORM_OPTIONS.countryCode}
              allowClear={false}
            />
          </FormField>

          <FormField label="Default Base Currency" hint="Primary currency for fees and billing">
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

          <FormField label="Default Nationality" hint="Standard nationality on admission forms">
            <Select
              value={form.defaultNationality}
              onChange={(e) => setField('defaultNationality', e.target.value)}
              options={ENQUIRY_FORM_OPTIONS.nationality}
              placeholder="Select nationality"
              allowClear
            />
          </FormField>

          <FormField label="System Timezone" hint="Used for logs, reminders & audit trails">
            <Select
              value={form.timezone}
              onChange={(e) => setField('timezone', e.target.value)}
              options={TIMEZONE_OPTIONS}
              allowClear={false}
            />
          </FormField>

          <FormField label="Calendar Date Format" hint="Standard date display across reports & tables">
            <Select
              value={form.dateFormat}
              onChange={(e) => setField('dateFormat', e.target.value)}
              options={DATE_FORMAT_OPTIONS}
              allowClear={false}
            />
          </FormField>

          <FormField label="Default Follow-up Duration" hint="Suggested next contact offset">
            <Select
              value={String(form.followupSlotDuration || '10')}
              onChange={(e) => setField('followupSlotDuration', e.target.value)}
              options={FOLLOWUP_DURATION_OPTIONS}
              allowClear={false}
            />
          </FormField>
        </div>
      </FormSection>

      {/* ── Navigation & Workflow Style ── */}
      <FormSection
        title="Navigation & Workflow Experience"
        description="Sidebar presentation style and enquiry creation behavior."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Navigation Style Visual Switcher */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
              Sidebar Navigation Layout
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setField('navbarType', 'vertical')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.navbarType === 'vertical'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <FiLayers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {form.navbarType === 'vertical' && <FiCheck className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="font-bold text-xs">Vertical Sidebar</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Classic full sidebar with collapsible groups
                </p>
              </button>

              <button
                type="button"
                onClick={() => setField('navbarType', 'compact')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.navbarType === 'compact'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <FiMonitor className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {form.navbarType === 'compact' && <FiCheck className="w-4 h-4 text-indigo-600" />}
                </div>
                <div className="font-bold text-xs">Compact Dock</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Slim icon dock maximizing table workspace
                </p>
              </button>
            </div>
          </div>

          {/* Follow-up Popup Prompt */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
              Enquiry Creation Follow-up Prompt
            </label>
            <div
              onClick={() => setField('followupPopup', !form.followupPopup)}
              className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                form.followupPopup
                  ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                  Auto-open Follow-up Schedule Tab
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Prompts staff to immediately schedule the first callback when creating an enquiry.
                </p>
              </div>
              <span
                className={`inline-flex h-5 w-9 items-center rounded-full px-0.5 shrink-0 transition-colors ${
                  form.followupPopup ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                    form.followupPopup ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
            </div>
          </div>
        </div>
      </FormSection>

      {/* ── Follow-up Time Slots Interactive Generator ── */}
      <FormSection
        title="Follow-up Time Slots Picker"
        description="Quick-select time chips available when scheduling calls, demos, and counseling."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Active slots: <strong className="text-slate-800 dark:text-slate-200">{form.followupSlotList?.length || 0} times</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Presets:</span>
              <button
                type="button"
                onClick={setStandardSlots}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                09:00 – 17:00 (Standard)
              </button>
              <button
                type="button"
                onClick={setMorningSlots}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Morning
              </button>
              <button
                type="button"
                onClick={setAfternoonSlots}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Afternoon
              </button>
              <button
                type="button"
                onClick={() => setField('followupSlotList', [])}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <ChipEditor
            values={form.followupSlotList || []}
            onChange={(list) => setField('followupSlotList', list)}
            placeholder="Type 24-hr time, e.g. 10:30 and press Enter"
            hint="Enter times in HH:MM (24-hour format, e.g. 09:30, 14:00, 16:30)"
          />
        </div>
      </FormSection>
    </div>
  );
}

// ── Attendance Settings Section ──
export function AttendanceSettingsSection({ form, setField }) {
  const att = form.attendance || {};
  const patch = (key, value) => setField('attendance', { ...att, [key]: value });

  return (
    <FormSection
      title="Class Attendance Window & Alerts"
      description="Operational policies for student attendance marking, late status suggestions, and absentee alerts."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <FormField label="Window Opens" hint="Minutes before class starts">
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={180}
              value={att.openMinutesBefore ?? 15}
              onChange={(e) => patch('openMinutesBefore', Number(e.target.value))}
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">min</span>
          </div>
        </FormField>

        <FormField label="Window Closes" hint="Minutes after class ends">
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={240}
              value={att.closeMinutesAfter ?? 30}
              onChange={(e) => patch('closeMinutesAfter', Number(e.target.value))}
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">min</span>
          </div>
        </FormField>

        <FormField label="Late Threshold" hint="Minutes after class start">
          <div className="relative">
            <Input
              type="number"
              min={0}
              max={120}
              value={att.lateThresholdMinutes ?? 15}
              onChange={(e) => patch('lateThresholdMinutes', Number(e.target.value))}
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">min</span>
          </div>
        </FormField>

        <FormField label="Min Attendance Alert" hint="Triggers warning if below">
          <div className="relative">
            <Input
              type="number"
              min={1}
              max={100}
              value={att.lowAttendancePercent ?? 75}
              onChange={(e) => patch('lowAttendancePercent', Number(e.target.value))}
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">%</span>
          </div>
        </FormField>

        <FormField label="Absence Trigger" hint="Alert on consecutive days">
          <div className="relative">
            <Input
              type="number"
              min={1}
              max={20}
              value={att.consecutiveAbsenceAlert ?? 3}
              onChange={(e) => patch('consecutiveAbsenceAlert', Number(e.target.value))}
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">days</span>
          </div>
        </FormField>
      </div>
    </FormSection>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MANDATORY FIELDS SECTION (CATEGORIZED WITH BULK CONTROLS)
// ─────────────────────────────────────────────────────────────────────────────
export function MandatorySection({ form, setField }) {
  const toggle = (key) => {
    setField('mandatoryFields', {
      ...(form.mandatoryFields || {}),
      [key]: !form.mandatoryFields?.[key],
    });
  };

  const enabledCount = ENQUIRY_MANDATORY_FIELDS.filter((f) => form.mandatoryFields?.[f.key]).length;
  const totalCount = ENQUIRY_MANDATORY_FIELDS.length;
  const pct = Math.round((enabledCount / totalCount) * 100);

  const enableAll = () => {
    const all = {};
    ENQUIRY_MANDATORY_FIELDS.forEach((f) => {
      all[f.key] = true;
    });
    setField('mandatoryFields', all);
    toastService.success('All 22 enquiry fields marked as mandatory');
  };

  const disableAll = () => {
    setField('mandatoryFields', {});
    toastService.info('All mandatory requirements cleared');
  };

  const setRecommended = () => {
    setField('mandatoryFields', {
      firstName: true,
      email: true,
      mobile: true,
      interestedCountry: true,
    });
    toastService.success('Standard recommended mandatory fields applied');
  };

  return (
    <div className="space-y-4">
      {/* ── Summary & Quick Bulk Actions Banner ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Enquiry Form Mandatory Requirements
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {enabledCount} of {totalCount} Required ({pct}%)
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Staff will not be able to submit new enquiries unless these required fields are completed.
          </p>
          <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="xs" variant="outline" onClick={setRecommended}>
            Recommended (4)
          </Button>
          <Button size="xs" variant="outline" onClick={enableAll}>
            Select All
          </Button>
          <Button size="xs" variant="outline" onClick={disableAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* ── Categorized Field Groups ── */}
      <div className="space-y-3">
        {MANDATORY_FIELD_GROUPS.map((group) => {
          const groupFields = ENQUIRY_MANDATORY_FIELDS.filter((f) => group.keys.includes(f.key));
          const groupActiveCount = groupFields.filter((f) => form.mandatoryFields?.[f.key]).length;

          return (
            <div
              key={group.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
            >
              <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {group.label}
                  </span>
                  <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                    {group.description}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {groupActiveCount} / {groupFields.length} active
                </span>
              </div>

              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {groupFields.map((field) => {
                  const on = Boolean(form.mandatoryFields?.[field.key]);
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => toggle(field.key)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        on
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span
                          className={`text-xs block truncate ${
                            on
                              ? 'font-bold text-indigo-900 dark:text-indigo-200'
                              : 'font-medium text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {field.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {on ? 'Required' : 'Optional'}
                        </span>
                      </div>

                      <span
                        className={`inline-flex h-5 w-9 items-center rounded-full px-0.5 shrink-0 transition-colors ${
                          on ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                            on ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BRANDING (COLOUR & TITLE) WITH REAL-TIME CRM WORKSPACE PREVIEW
// ─────────────────────────────────────────────────────────────────────────────
export function BrandingSection({ form, setField }) {
  const applyPreset = (preset) => {
    setField('primaryColour', preset.primary);
    setField('secondaryColour', preset.secondary);
    setField('headerColour', preset.header);
    setField('fontColour', preset.font);
    toastService.success(`Applied ${preset.name} theme preset`);
  };

  const primary = form.primaryColour || '#4F46E5';
  const secondary = form.secondaryColour || '#6366F1';
  const headerBg = form.headerColour || '#0F172A';
  const fontColor = form.fontColour || '#FFFFFF';

  return (
    <div className="space-y-4">
      {/* ── Theme Presets Row ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              One-Click Theme Palettes
            </h3>
            <p className="text-xs text-slate-500">Pick an enterprise preset or customize individual hex codes below</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {THEME_PRESETS.map((p) => {
            const active =
              form.primaryColour?.toLowerCase() === p.primary.toLowerCase() &&
              form.headerColour?.toLowerCase() === p.header.toLowerCase();

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }} />
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.secondary }} />
                  <span className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: p.header }} />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {p.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Split Layout: Left Controls & Right Real-Time CRM Mockup Preview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Color Pickers & Text Inputs */}
        <div className="lg:col-span-7 space-y-4">
          <FormSection
            title="Custom Palette Codes"
            description="Fine-tune primary brand, secondary accent, header background and font color."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ColorField
                label="Primary Brand Color"
                hint="Main buttons, active tabs, links"
                value={form.primaryColour}
                onChange={(v) => setField('primaryColour', v)}
              />
              <ColorField
                label="Secondary Accent"
                hint="Hover badges, highlights"
                value={form.secondaryColour}
                onChange={(v) => setField('secondaryColour', v)}
              />
              <ColorField
                label="Workspace Header Color"
                hint="Top navigation background"
                value={form.headerColour}
                onChange={(v) => setField('headerColour', v)}
              />
              <ColorField
                label="Header Font Color"
                hint="Text color in header bar"
                value={form.fontColour}
                onChange={(v) => setField('fontColour', v)}
              />
            </div>
          </FormSection>

          <FormSection
            title="Portal Welcome & Notice Copy"
            description="Welcome messaging and optional announcement ticker for all users."
          >
            <div className="space-y-3">
              <FormField label="Portal Welcome Title">
                <Input
                  value={form.portalTitle}
                  onChange={(e) => setField('portalTitle', e.target.value)}
                  placeholder="e.g. Welcome to 3ni Infotech"
                />
              </FormField>

              <FormField label="Portal Subtitle">
                <Input
                  value={form.portalSubtitle}
                  onChange={(e) => setField('portalSubtitle', e.target.value)}
                  placeholder="e.g. Global Education & Visa Services Portal"
                />
              </FormField>

              <FormField label="Scrolling Announcement Banner" hint="Leave empty to hide the marquee banner">
                <Input
                  value={form.scrollingText}
                  onChange={(e) => setField('scrollingText', e.target.value)}
                  placeholder="e.g. Notice: System maintenance on Sunday 11 PM IST."
                />
              </FormField>
            </div>
          </FormSection>
        </div>

        {/* Right Column (5 cols): Real-Time Interactive Live Mockup Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FiMonitor className="w-3.5 h-3.5 text-indigo-600" />
                Live Workspace Preview
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                Real-Time
              </span>
            </div>

            {/* Rendered Mockup Frame */}
            <div className="p-3 bg-slate-100/70 dark:bg-slate-950">
              <div className="rounded-xl overflow-hidden shadow-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* Header Mockup */}
                <div
                  className="px-3.5 py-3 transition-colors duration-200"
                  style={{ backgroundColor: headerBg, color: fontColor }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-2xs"
                        style={{ backgroundColor: primary, color: '#fff' }}
                      >
                        {form.name?.[0] || 'C'}
                      </div>
                      <div>
                        <div className="font-bold text-xs truncate max-w-[150px]">
                          {form.portalTitle || form.name || 'Company Portal'}
                        </div>
                        <div className="text-[10px] opacity-75 truncate max-w-[150px]">
                          {form.portalSubtitle || 'Consultancy Workspace'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[10px] opacity-80">Admin</span>
                    </div>
                  </div>
                </div>

                {/* Optional Scrolling Banner */}
                {form.scrollingText && (
                  <div
                    className="px-3 py-1 text-[10px] font-semibold truncate transition-colors"
                    style={{ backgroundColor: secondary, color: '#FFFFFF' }}
                  >
                    📢 {form.scrollingText}
                  </div>
                )}

                {/* Mockup Workspace Body */}
                <div className="p-3.5 space-y-3 bg-white dark:bg-slate-900">
                  {/* Tabs Row */}
                  <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: primary }}
                    >
                      Dashboard
                    </span>
                    <span className="px-2 py-1 text-[11px] font-medium text-slate-500">
                      Enquiries
                    </span>
                    <span className="px-2 py-1 text-[11px] font-medium text-slate-500">
                      Reports
                    </span>
                  </div>

                  {/* Sample KPI Widget */}
                  <div className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Active Leads</span>
                      <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">148</span>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded text-[11px] font-bold text-white shadow-2xs"
                      style={{ backgroundColor: primary }}
                    >
                      + New Enquiry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SOCIAL MEDIA CHANNELS WITH LIVE FOOTER PREVIEW
// ─────────────────────────────────────────────────────────────────────────────
export function SocialSection({ form, setField }) {
  const socials = [
    {
      key: 'socialLinkedin',
      label: 'LinkedIn Profile / Company',
      icon: FaLinkedinIn,
      iconColor: 'bg-[#0077b5] text-white',
      placeholder: 'https://linkedin.com/company/your-consultancy',
    },
    {
      key: 'socialInstagram',
      label: 'Instagram Handle / Page',
      icon: FaInstagram,
      iconColor: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white',
      placeholder: 'https://instagram.com/your-brand',
    },
    {
      key: 'socialTwitter',
      label: 'Twitter / X Profile',
      icon: FaTwitter,
      iconColor: 'bg-slate-900 text-white',
      placeholder: 'https://x.com/your-brand',
    },
    {
      key: 'socialYoutube',
      label: 'YouTube Channel',
      icon: FaYoutube,
      iconColor: 'bg-[#FF0000] text-white',
      placeholder: 'https://youtube.com/@your-channel',
    },
    {
      key: 'socialFacebook',
      label: 'Facebook Business Page',
      icon: FaFacebookF,
      iconColor: 'bg-[#1877F2] text-white',
      placeholder: 'https://facebook.com/your-page',
    },
    {
      key: 'socialPinterest',
      label: 'Pinterest Board',
      icon: FaPinterestP,
      iconColor: 'bg-[#BD081C] text-white',
      placeholder: 'https://pinterest.com/your-board',
    },
  ];

  return (
    <div className="space-y-4">
      <FormSection
        title="Social Media Channels"
        description="Public links appear in the student portal, emails and website footer."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {socials.map((s) => {
            const Icon = s.icon;
            const val = form[s.key] || '';
            const isValidUrl = val.startsWith('http');

            return (
              <div
                key={s.key}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${s.iconColor}`}>
                      <Icon className="w-3 h-3" />
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {s.label}
                    </span>
                  </div>
                  {isValidUrl && (
                    <a
                      href={val}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Visit</span>
                      <FiExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <Input
                  value={val}
                  onChange={(e) => setField(s.key, e.target.value)}
                  placeholder={s.placeholder}
                />
              </div>
            );
          })}
        </div>
      </FormSection>

      {/* ── Footer Live Preview ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Student Portal / Website Footer Preview
        </h4>
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-500">
            © {new Date().getFullYear()} {form.name || 'Company'}. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            {socials.map((s) => {
              const Icon = s.icon;
              const hasVal = Boolean(form[s.key]);
              return (
                <span
                  key={s.key}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-opacity ${
                    hasVal
                      ? `${s.iconColor} shadow-2xs`
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 opacity-40'
                  }`}
                  title={hasVal ? s.label : `${s.label} (Not configured)`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ACCESS & IP POLICY
// ─────────────────────────────────────────────────────────────────────────────
export function AccessSection({ form, setField }) {
  const setStandardHours = () => {
    setField('loginStartTime', '09:00');
    setField('loginEndTime', '18:00');
    toastService.info('Standard hours set (09:00 - 18:00)');
  };

  const setExtendedHours = () => {
    setField('loginStartTime', '08:30');
    setField('loginEndTime', '20:00');
    toastService.info('Extended hours set (08:30 - 20:00)');
  };

  const clearHours = () => {
    setField('loginStartTime', '');
    setField('loginEndTime', '');
    toastService.info('Office hours cleared (24/7 unrestricted access)');
  };

  return (
    <div className="space-y-4">
      {/* ── Working Hours Window ── */}
      <FormSection
        title="Office Working Hours Window"
        description="Limit employee sign-ins to specified working hours. Super Admins retain 24/7 emergency access."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Active window:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {form.loginStartTime && form.loginEndTime
                  ? `${form.loginStartTime} to ${form.loginEndTime}`
                  : '24/7 Unrestricted'}
              </strong>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Presets:</span>
              <button
                type="button"
                onClick={setStandardHours}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                09:00 – 18:00
              </button>
              <button
                type="button"
                onClick={setExtendedHours}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                08:30 – 20:00
              </button>
              <button
                type="button"
                onClick={clearHours}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 transition-colors"
              >
                24 Hours (Unrestricted)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Office Shift Start Time" hint="Earliest login permitted for staff">
              <Input
                type="time"
                value={form.loginStartTime}
                onChange={(e) => setField('loginStartTime', e.target.value)}
              />
            </FormField>

            <FormField label="Office Shift End Time" hint="Staff sessions expire at end of shift">
              <Input
                type="time"
                value={form.loginEndTime}
                onChange={(e) => setField('loginEndTime', e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </FormSection>

      {/* ── Auto Logout Inactivity Policy ── */}
      <FormSection
        title="Session Timeout & Auto-Logout"
        description="Automatically terminate inactive employee sessions for physical security."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <FormField label="Idle Inactivity Timeout (Minutes)" hint="0 keeps the session until the authorization token expires">
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="480"
                value={form.autoLogoutMinutes}
                onChange={(e) => setField('autoLogoutMinutes', Number(e.target.value))}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-semibold pointer-events-none">
                minutes
              </span>
            </div>
          </FormField>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 block">Recommended Presets:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[15, 30, 60, 120, 0].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setField('autoLogoutMinutes', mins)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    Number(form.autoLogoutMinutes) === mins
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {mins === 0 ? 'Disabled (0)' : `${mins} min`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormSection>

      {/* ── Whitelisted Office IP Addresses ── */}
      <FormSection
        title="Corporate IP Whitelist Security"
        description="Limit access to specific corporate broadband or VPN IP subnets. Leave empty to allow any connection."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-slate-500">
              Active IP filters: <strong className="text-slate-800 dark:text-slate-200">{form.allowedIps?.length || 0} whitelisted</strong>
            </span>
            {(!form.allowedIps || form.allowedIps.length === 0) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <FiCheckCircle className="w-3.5 h-3.5" />
                Access Allowed From Any IP Address
              </span>
            )}
          </div>

          <ChipEditor
            values={form.allowedIps || []}
            onChange={(list) => setField('allowedIps', list)}
            placeholder="Enter IPv4, IPv6 or CIDR (e.g. 103.21.244.0/24)"
            hint="Supports static public IPs (e.g. 49.36.128.5) and CIDR subnets."
          />
        </div>
      </FormSection>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. INVOICE CONFIGURATION & LIVE FOOTER PREVIEW
// ─────────────────────────────────────────────────────────────────────────────
export function InvoiceSection({ form, setField, currencyOptions = [] }) {
  const insertTemplate1 = () => {
    const text = `1. Payment is strictly due within 15 days of invoice date.\n2. Bank transfers must quote the invoice number as reference.\n3. Tuition fees are subject to university intake regulations.\n4. Late payments incur 1.5% interest per month.`;
    setField('invoiceTerms', text);
    toastService.success('Standard payment terms inserted');
  };

  const insertTemplate2 = () => {
    const text = `BANK TRANSFER DETAILS:\nBank: HDFC Bank Ltd.\nAccount Name: ${form.legalName || form.name || 'Company Pvt Ltd'}\nAccount Number: 50200012345678\nIFSC Code: HDFC0001234\nBranch: SG Highway, Ahmedabad`;
    setField('invoiceTerms', text);
    toastService.success('Bank details template inserted');
  };

  return (
    <div className="space-y-4">
      {/* ── Tax & Currency ── */}
      <FormSection
        title="Tax Numbers & Invoicing Identity"
        description="These legal identifiers and currency will be pre-filled on new student invoices."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="GST / VAT / Tax Number" hint="Printed on the invoice header">
            <Input
              value={form.taxNumber}
              onChange={(e) => setField('taxNumber', e.target.value)}
              placeholder="e.g. GSTIN24AABCU9603R1ZM"
            />
          </FormField>

          <FormField label="Company CIN / Registration" hint="Corporate identity number">
            <Input
              value={form.registrationNumber}
              onChange={(e) => setField('registrationNumber', e.target.value)}
              placeholder="e.g. U80900GJ2018PTC105432"
            />
          </FormField>

          <FormField label="Default Invoicing Currency" hint="Standard base currency for fees">
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
        </div>
      </FormSection>

      {/* ── Invoice Terms & Conditions ── */}
      <FormSection
        title="Terms & Conditions / Payment Instructions"
        description="Printed in the footer of every generated client invoice and payment receipt."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-slate-500">
              Character count: <strong className="text-slate-800 dark:text-slate-200">{form.invoiceTerms?.length || 0}</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">Quick Templates:</span>
              <Button size="xs" variant="outline" onClick={insertTemplate1}>
                + Standard 15-Day Terms
              </Button>
              <Button size="xs" variant="outline" onClick={insertTemplate2}>
                + Bank Transfer Template
              </Button>
            </div>
          </div>

          <Textarea
            rows={5}
            value={form.invoiceTerms}
            onChange={(e) => setField('invoiceTerms', e.target.value)}
            placeholder="Enter standard payment terms, bank wire details, refund caveats, and legal notes..."
          />
        </div>
      </FormSection>

      {/* ── Real-Time Live Client Invoice Preview ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <FiFileText className="w-3.5 h-3.5 text-indigo-600" />
            Live Client Invoice Bottom Preview
          </h4>
          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
            Official PDF Layout
          </span>
        </div>

        <div className="p-5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                {form.legalName || form.name || 'Company Name'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                GSTIN: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{form.taxNumber || '—'}</span> | CIN: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{form.registrationNumber || '—'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Billing Currency</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {form.defaultCurrencyCode || 'INR (₹)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Terms & Conditions / Payment Instructions
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {form.invoiceTerms || 'No custom terms configured. University standard terms apply.'}
              </p>
            </div>
            <div className="flex flex-col justify-end items-end">
              <div className="w-44 border-b border-slate-300 dark:border-slate-700 h-10 mb-1" />
              <span className="text-[11px] font-semibold text-slate-500">Authorized Signatory</span>
              <span className="text-[10px] text-slate-400">For {form.name || 'Company'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. UNIVERSAL STICKY SAVE BAR WITH SHORTCUT HINT
// ─────────────────────────────────────────────────────────────────────────────
export function SaveBar({ dirty, saving, onSave, onReset, canManage }) {
  if (!canManage) return null;

  return (
    <div className="sticky bottom-0 z-40 px-5 py-3 border-t border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            dirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
          }`}
        />
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          {dirty
            ? 'You have unsaved changes in this company configuration.'
            : 'All settings are saved and active.'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          icon={FiX}
          onClick={onReset}
          disabled={saving || !dirty}
          className="text-xs h-8"
        >
          Reset
        </Button>

        <Button
          size="sm"
          variant="primary"
          icon={FiCheck}
          onClick={onSave}
          loading={saving}
          disabled={!dirty}
          className="text-xs h-8 font-semibold shadow-xs"
        >
          <span>Save configuration</span>
          <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-indigo-700/50 text-indigo-100 font-mono">
            Ctrl+S
          </span>
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE CHIP EDITOR & COLOR FIELD
// ─────────────────────────────────────────────────────────────────────────────
function ChipEditor({ values = [], onChange, placeholder, hint }) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const next = draft.trim();
    if (!next || values.includes(next)) return;
    onChange([...values, next]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[2rem] p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        {values.length === 0 && (
          <span className="text-xs text-slate-400 italic self-center">None added yet</span>
        )}
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 px-2.5 py-1 text-xs font-semibold"
          >
            <span>{value}</span>
            <button
              type="button"
              className="text-indigo-400 hover:text-rose-600 transition-colors cursor-pointer"
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
        <Button variant="outline" size="sm" icon={FiPlus} onClick={add} className="shrink-0 text-xs">
          Add
        </Button>
      </div>
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function ColorField({ label, hint, value, onChange }) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#4F46E5';

  return (
    <FormField label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0 shadow-2xs">
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#4F46E5"
          className="font-mono text-xs uppercase"
        />
      </div>
    </FormField>
  );
}
