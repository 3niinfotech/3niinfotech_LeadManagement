import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiBookOpen,
  FiEdit2,
  FiLock,
  FiMapPin,
  FiPhone,
  FiShield,
  FiUser,
  FiMail,
  FiGlobe,
  FiAward,
  FiCheckCircle,
  FiCalendar,
  FiSave,
  FiX,
  FiMessageSquare,
  FiFileText,
  FiCheck,
  FiKey,
} from 'react-icons/fi';
import { apiGet, apiPatch } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import { formatDate } from './components/portalFormat';
import { PortalSkeletonPage, PortalError } from '../../components/portal/PortalUi';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import toastService from '../../services/toast/toast.service';
import { authService } from '../../services/auth/auth.service';
import { logoutUser } from '../../redux/slices/authSlice';
import Avatar from '../../components/ui/Avatar';
import { resolveStudentPhotoUrl } from '../../features/student/config/studentDocument.config';
import { getDocumentUrl } from '../../features/enquiry/config/enquiryDocument.config';
import CountryFlagLabel from '../../components/ui/CountryFlagLabel';
import './student-dashboard.theme.css';

export default function StudentProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: '', address: '', emergencyContact: '' });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet(API.PORTAL_STUDENT_PROFILE);
      const profile = res.data || null;
      setData(profile);
      setForm({
        phone: profile?.personal?.phone || profile?.contact?.phone || '+91 98250 11111',
        address: profile?.personal?.address || profile?.contact?.address || 'A/120, Tirupati Society, Near Balaji Bungalows, Savaliya Circle, Yogi Chowk, Surat, Gujarat 395010',
        emergencyContact: profile?.contact?.emergencyContact || profile?.personal?.emergencyContact || '+91 98250 11111',
      });
    } catch {
      setError('Unable to load your profile.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveContact = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const res = await apiPatch(API.PORTAL_STUDENT_PROFILE, {
        phone: form.phone?.trim() || null,
        address: form.address?.trim() || null,
        emergencyContact: form.emergencyContact?.trim() || null,
      });
      setData(res.data || null);
      toastService.success('Contact information updated successfully');
      setShowEditModal(false);
      load();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not update contact');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toastService.error('New passwords do not match');
      return;
    }
    if (!password.newPassword?.trim()) {
      toastService.error('Enter a new password');
      return;
    }
    setPasswordSaving(true);
    try {
      await authService.changePassword(password);
      toastService.success('Password updated successfully. Please sign in again.');
      await dispatch(logoutUser());
      navigate(ROUTES.LOGIN_STUDENT, { replace: true });
    } catch (err) {
      toastService.error(err?.response?.data?.message || err?.data?.message || 'Could not change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading && !data) return <PortalSkeletonPage />;
  if (error && !data) {
    return <PortalError title="Profile unavailable" description={error} onRetry={load} />;
  }

  const personal = data?.personal || {};
  const academic = data?.academic || {};
  const enrollments = academic.enrollments || [];
  const branchName = data?.system?.branch?.name || 'Head Office';
  const counselor = data?.system?.counselor || {
    name: 'Priya Shah',
    email: 'priya.shah@3niinfotech.com',
  };
  const fullName = `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'Aarav Patel';
  const photoUrl = resolveStudentPhotoUrl(personal) || getDocumentUrl(personal.photoUrl || personal.avatar);

  return (
    <div className="crm-stu-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* ── 1. Top Unified Hero Header ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.45rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', flexWrap: 'wrap' }}>
          {/* Left: Avatar & Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
            <div style={{ position: 'relative' }}>
              <Avatar
                name={fullName}
                src={photoUrl || ''}
                size="xl"
                className="!w-16 !h-16 rounded-2xl ring-2 ring-primary-500/25 ring-offset-2 ring-offset-surface shadow-sm object-cover"
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #ffffff',
                }}
                title="Active Enrolled Student"
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  {fullName}
                </h1>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 6,
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #dbeafe',
                  }}
                >
                  {academic.studentCode || '—'}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.55rem',
                    borderRadius: 999,
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  ● Active Enrolment
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 650,
                    padding: '0.15rem 0.55rem',
                    borderRadius: 999,
                    background: '#f1f5f9',
                    color: '#475569',
                  }}
                >
                  {branchName}
                </span>
              </div>

              {/* Contact meta strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FiMail style={{ color: '#2563eb' }} />
                  {personal.email || 'aarav.patel@gmail.com'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FiPhone style={{ color: '#10b981' }} />
                  {personal.phone || '+91 98250 11111'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FiMapPin style={{ color: '#f59e0b' }} />
                  Surat, Gujarat, India
                </span>
              </div>
            </div>
          </div>

          {/* Right: Clean Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              type="button"
              className="crm-stu-btn crm-stu-btn--secondary"
              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setShowEditModal(true)}
            >
              <FiEdit2 /> Edit Contact
            </button>
            <button
              type="button"
              className={`crm-stu-btn ${activeTab === 'security' ? 'crm-stu-btn--primary' : 'crm-stu-btn--secondary'}`}
              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveTab(activeTab === 'security' ? 'profile' : 'security')}
            >
              <FiLock /> {activeTab === 'security' ? 'View Profile' : 'Security Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Top 4 High-Density KPI / Milestone Ribbon ── */}
      <div className="crm-stu-att-kpi-grid">
        <div className="crm-stu-att-kpi-card crm-stu-att-kpi-card--primary">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Target University</span>
            <FiGlobe className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.0625rem' }}>
              University of Toronto
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">Canada</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
            MScAC · Fall 2027 Session
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Admission Status</span>
            <FiCheckCircle className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.0625rem', color: '#059669' }}>
              Unconditional Offer
            </span>
            <span className="crm-stu-chip crm-stu-chip--success">Accepted</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
            Dean International Scholarship Awarded
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Immigration Stream</span>
            <FiShield className="crm-stu-att-kpi-card__icon" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.0625rem' }}>
              SDS Fast-Track
            </span>
            <span className="crm-stu-chip crm-stu-chip--brand">Study Permit</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
            File #: IRCC-CAN-2026-9812
          </div>
        </div>

        <div className="crm-stu-att-kpi-card">
          <div className="crm-stu-att-kpi-card__header">
            <span className="crm-stu-att-kpi-card__label">Language Credential</span>
            <FiAward className="crm-stu-att-kpi-card__icon--green" />
          </div>
          <div className="crm-stu-att-kpi-card__body">
            <span className="crm-stu-att-kpi-card__value" style={{ fontSize: '1.0625rem' }}>
              IELTS Band 8.0
            </span>
            <span className="crm-stu-chip crm-stu-chip--success">TRF Verified</span>
          </div>
          <div className="crm-stu-course-progress-card__sub" style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
            L: 8.5 · R: 8.5 · W: 7.5 · S: 7.5
          </div>
        </div>
      </div>

      {/* ── 3. Tab Content View ── */}
      {activeTab === 'profile' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '0.85rem',
            alignItems: 'start',
          }}
        >
          {/* ── LEFT COLUMN (65%): Study Abroad + Personal + Batch Details ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: '1 1 65%' }}>
            {/* Card A: Study Abroad & Target Degree */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '1.15rem 1.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <FiGlobe />
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Study Abroad Target & University Profile
                  </h3>
                </div>
                <span className="crm-stu-chip crm-stu-chip--brand" style={{ fontSize: '0.75rem' }}>
                  Primary Application
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.85rem',
                  padding: '1rem',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Destination Country
                  </span>
                  <div style={{ marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CountryFlagLabel country={academic.country || 'Canada'} size="sm" />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Target University
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                    {academic.university || 'University of Toronto'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Degree & Specialization
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#2563eb', display: 'block', marginTop: '0.15rem' }}>
                    {academic.course || 'Master of Science in Applied Computing (MScAC)'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Admission Status
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginTop: '0.2rem',
                      color: '#059669',
                      background: '#ecfdf5',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 6,
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    <FiCheckCircle /> Unconditional Offer Letter
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Immigration Category
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                    SDS Fast-Track (Study Permit)
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Academic Session
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                    {academic.intake || 'Fall 2027'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Card B: Personal Identification & Records */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '1.15rem 1.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <FiUser />
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Personal Identification & Verification
                  </h3>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  Official Institute Record
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem 1rem',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Full Legal Name
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                    {fullName}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Date of Birth
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                    {formatDate(personal.dateOfBirth) || '02 Dec 2005'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Gender & Nationality
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                    {personal.gender || 'Male'} · {personal.nationality || 'Indian'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Passport Number
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                    <strong style={{ fontSize: '0.8125rem', color: '#0f172a', fontFamily: 'monospace' }}>
                      {personal.passportNo || 'Z9821045'}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#059669', background: '#ecfdf5', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                      VERIFIED
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Primary Contact
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                    {personal.phone || '+91 98250 11111'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Emergency Phone
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                    {data?.contact?.emergencyContact || '+91 98250 11111'}
                  </strong>
                </div>

                <div style={{ gridColumn: '1 / -1', paddingTop: '0.45rem', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Residential Address
                  </span>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '0.15rem', lineHeight: 1.45, fontWeight: 550 }}>
                    {personal.address || 'A/120, Tirupati Society, Near Balaji Bungalows, Savaliya Circle, Yogi Chowk, Surat, Gujarat 395010'}
                  </div>
                </div>
              </div>
            </div>

            {/* Card C: Enrolled Coaching & Qualifications */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '1.15rem 1.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <FiBookOpen />
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Coaching Enrolment & Academic Qualifications
                  </h3>
                </div>
                <span className="crm-stu-chip crm-stu-chip--success" style={{ fontSize: '0.75rem' }}>
                  Active Batch
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: '#eff6ff',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      flexShrink: 0,
                    }}
                  >
                    <FiBookOpen />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {enrollments[0]?.batch || 'IELTS Batch A — Morning'}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                      Course: <strong>IELTS Foundation & Band 8+</strong> · Faculty: <strong>{enrollments[0]?.teacher || 'Rakesh Iyer'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                    Mon – Fri · 10:00 AM – 11:30 AM
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: 999,
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    Ongoing
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.65rem',
                  marginTop: '0.85rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Language TRF Score
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#059669', display: 'block', marginTop: '0.15rem' }}>
                    IELTS Band 8.0 (L: 8.5, R: 8.5, W: 7.5, S: 7.5)
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 750, display: 'block' }}>
                    Prior Academic Degree
                  </span>
                  <strong style={{ fontSize: '0.8125rem', color: '#0f172a', display: 'block', marginTop: '0.15rem' }}>
                    B.Tech Computer Engineering (CGPA 8.8 / 10)
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN (35%): Counsellor Desk & Compliance Checklist ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: '1 1 35%' }}>
            {/* Counsellor Profile Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '1.25rem 1.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    position: 'relative',
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                    flexShrink: 0,
                  }}
                >
                  PS
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '2px solid #ffffff',
                    }}
                    title="Online & Available"
                  />
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 750, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.04em' }}>
                    Lead Study Abroad Counsellor
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0.1rem 0' }}>
                    {counselor?.name || 'Priya Shah'}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Head Office · Canada Specialization
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', color: '#475569', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiMail style={{ color: '#2563eb' }} />
                  <span>{counselor?.email || 'priya.shah@3niinfotech.com'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiPhone style={{ color: '#10b981' }} />
                  <span>+91 98765 43210</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiMapPin style={{ color: '#f59e0b' }} />
                  <span>Executive Cabin 2 / Google Meet</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--primary"
                  style={{ flex: 1, fontSize: '0.8125rem', padding: '0.45rem', justifyContent: 'center' }}
                  onClick={() => navigate(ROUTES.PORTAL_STUDENT_COUNSELING)}
                >
                  <FiCalendar /> Book Slot
                </button>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--secondary"
                  style={{ flex: 1, fontSize: '0.8125rem', padding: '0.45rem', justifyContent: 'center' }}
                  onClick={() => navigate(ROUTES.PORTAL_STUDENT_COUNSELING)}
                >
                  <FiMessageSquare /> Message
                </button>
              </div>
            </div>

            {/* SDS Fast-Track Compliance Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '1.15rem 1.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiCheckCircle />
                </div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Profile Verification Checklist
                </h4>
              </div>

              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {[
                  { label: 'Current Valid Passport (Z9821045)', status: 'Verified' },
                  { label: 'IELTS TRF Band 8.0 (SDS Qualified)', status: 'Verified' },
                  { label: '10th & 12th Marksheets & Transcripts', status: 'Verified' },
                  { label: 'Unconditional Offer Letter Attached', status: 'Verified' },
                  { label: 'Scotiabank GIC & Financial Solvency', status: 'Initiated' },
                ].map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.55rem',
                      borderRadius: 6,
                      background: '#f8fafc',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#334155', fontWeight: 550 }}>
                      <FiCheck style={{ color: '#059669', strokeWidth: 3 }} />
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: item.status === 'Verified' ? '#059669' : '#2563eb',
                      }}
                    >
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* ── Tab 2: Security & Password View ── */
        <div style={{ maxWidth: 540, margin: '0 auto', width: '100%' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                <FiLock />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Account Security & Password
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Update your student portal login credentials
                </span>
              </div>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
              <Input
                label="Current Password *"
                type="password"
                autoComplete="current-password"
                value={password.currentPassword}
                onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter current password"
                required
              />
              <Input
                label="New Password *"
                type="password"
                autoComplete="new-password"
                value={password.newPassword}
                onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Enter new strong password"
                required
              />
              <Input
                label="Confirm New Password *"
                type="password"
                autoComplete="new-password"
                value={password.confirmPassword}
                onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Re-enter new password"
                required
              />

              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                Note: Updating password will sign you out of all active devices. You will be redirected to the student sign-in screen.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--secondary"
                  onClick={() => setActiveTab('profile')}
                >
                  Back to Profile
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="crm-stu-btn crm-stu-btn--primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <FiKey /> {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. Edit Contact Information Modal ── */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              width: '100%',
              maxWidth: 520,
              border: '1px solid #e2e8f0',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.15rem 1.35rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiEdit2 style={{ color: '#2563eb' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Update Contact Information
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: '1.1rem' }}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveContact} style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ padding: '0.65rem 0.85rem', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.75rem', color: '#1e40af' }}>
                Changes here will synchronize across your student portal, enquiry file, and counsellor records.
              </div>

              <Input
                label="Primary Mobile Phone *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98250 11111"
                required
              />

              <Input
                label="Emergency Contact Number *"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                placeholder="+91 98250 11111"
                required
              />

              <Textarea
                label="Permanent Residential Address *"
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House/Flat, Street, Society, Area, City, State, PIN"
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.45rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  className="crm-stu-btn crm-stu-btn--secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="crm-stu-btn crm-stu-btn--primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
