import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiBookOpen, FiEdit2, FiLock, FiMapPin, FiPhone, FiShield, FiUser } from 'react-icons/fi';
import { apiGet, apiPatch } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import { formatDate } from './components/portalFormat';
import {
  PortalPage,
  PortalPanel,
  PortalEmpty,
  PortalError,
  PortalSkeletonPage,
  PortalBadge,
} from '../../components/portal/PortalUi';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import toastService from '../../services/toast/toast.service';
import { authService } from '../../services/auth/auth.service';
import { logoutUser } from '../../redux/slices/authSlice';

function ReadField({ label, value, locked, hint }) {
  return (
    <div className={`crm-student-field${locked ? ' crm-student-field--locked' : ' crm-student-field--editable'}`}>
      <dt className="crm-student-field__label">
        {label}
        {locked ? (
          <span className="crm-student-field__locked">Institute</span>
        ) : (
          <span className="crm-student-field__editable-tag">You can edit</span>
        )}
      </dt>
      <dd className="crm-student-field__value">{value || '—'}</dd>
      {hint && <p className="crm-student-field__hint">{hint}</p>}
    </div>
  );
}

export default function StudentProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
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
        phone: profile?.personal?.phone || profile?.contact?.phone || '',
        address: profile?.personal?.address || profile?.contact?.address || '',
        emergencyContact: profile?.contact?.emergencyContact || '',
      });
    } catch {
      setError('Unable to load your profile.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiPatch(API.PORTAL_STUDENT_PROFILE, {
        phone: form.phone?.trim() || null,
        address: form.address?.trim() || null,
        emergencyContact: form.emergencyContact?.trim() || null,
      });
      setData(res.data || null);
      toastService.success('Profile updated across your student record');
      setEditing(false);
      load();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not update profile');
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
      toastService.success('Password updated everywhere. Please sign in again.');
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
  const branchName = data?.system?.branch?.name;
  const counselor = data?.system?.counselor;
  const fullName = `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || 'Student';
  const initial = fullName.charAt(0).toUpperCase();
  const editable = new Set(data?.editableFields || ['phone', 'address', 'emergencyContact']);

  return (
    <PortalPage className="crm-stu-profile">
      <div className="crm-portal-page-toolbar">
        {!editing ? (
          <Button size="sm" variant="outline" icon={FiEdit2} onClick={() => setEditing(true)}>
            Edit contact
          </Button>
        ) : (
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); load(); }}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={handleSave}>Save changes</Button>
          </div>
        )}
      </div>

      <section className="crm-stu-profile__hero">
        <div className="crm-stu-profile__avatar" aria-hidden>{initial}</div>
        <div className="crm-stu-profile__hero-copy min-w-0">
          <h2 className="crm-stu-profile__name">{fullName}</h2>
          <p className="crm-stu-profile__meta">
            {[academic.studentCode, academic.status?.replace?.(/_/g, ' '), branchName]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {(personal.email || personal.phone) && (
            <p className="crm-stu-profile__contacts">
              {personal.email && <span>{personal.email}</span>}
              {personal.phone && <span><FiPhone aria-hidden /> {personal.phone}</span>}
            </p>
          )}
        </div>
        {counselor?.name && (
          <div className="crm-stu-profile__counsellor">
            <span>Counsellor</span>
            <strong>{counselor.name}</strong>
          </div>
        )}
      </section>

      <div className="crm-stu-profile__grid">
        <div className="crm-stu-profile__main">
          <PortalPanel
            title="Personal details"
            description="Identity is managed by your institute. Contact fields below are yours to update."
            padded
          >
            {editing ? (
              <div className="crm-stu-profile__edit">
                <div className="crm-stu-profile__edit-note">
                  <FiShield aria-hidden />
                  <p>
                    Saving updates your student master record, and keeps enquiry / lead contact
                    details in sync for staff.
                  </p>
                </div>
                {editable.has('phone') && (
                  <Input
                    label="Phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 ..."
                  />
                )}
                {editable.has('address') && (
                  <Textarea
                    label="Address"
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Street, city, state"
                  />
                )}
                {editable.has('emergencyContact') && (
                  <Input
                    label="Emergency contact"
                    value={form.emergencyContact}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyContact: e.target.value }))}
                    placeholder="Name / number"
                  />
                )}
              </div>
            ) : (
              <dl className="crm-student-fields">
                <ReadField label="Full name" value={fullName} locked />
                <ReadField label="Email" value={personal.email} locked />
                <ReadField label="Phone" value={personal.phone} />
                <ReadField label="Date of birth" value={formatDate(personal.dateOfBirth)} locked />
                <ReadField label="Gender" value={personal.gender} locked />
                <ReadField label="Nationality" value={personal.nationality} locked />
                <ReadField label="Address" value={personal.address} />
                <ReadField label="Emergency contact" value={data?.contact?.emergencyContact} />
              </dl>
            )}
          </PortalPanel>

          <PortalPanel title="Academic record" padded>
            <dl className="crm-student-fields">
              <ReadField label="Student ID" value={academic.studentCode} locked />
              <ReadField label="Status" value={academic.status} locked />
              <ReadField label="Course" value={academic.course} locked />
              <ReadField label="Country" value={academic.country} locked />
              <ReadField label="University" value={academic.university} locked />
              <ReadField label="Intake" value={academic.intake} locked />
              <ReadField label="Branch" value={branchName} locked />
            </dl>
          </PortalPanel>
        </div>

        <aside className="crm-stu-profile__side">
          <PortalPanel title="Enrolled batches" padded>
            {!enrollments.length ? (
              <PortalEmpty title="No active batches" description="Your class enrollments will appear here." />
            ) : (
              <ul className="crm-stu-profile__batches">
                {enrollments.map((row, idx) => (
                  <li key={row.batchId || idx} className="crm-stu-profile__batch">
                    <span className="crm-stu-profile__batch-icon" aria-hidden>
                      <FiBookOpen />
                    </span>
                    <div className="min-w-0">
                      <div className="crm-stu-profile__batch-title">{row.batch || row.course || 'Batch'}</div>
                      <div className="crm-stu-profile__batch-meta">
                        {[row.course, row.teacher].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <PortalBadge tone="info">Active</PortalBadge>
                  </li>
                ))}
              </ul>
            )}
          </PortalPanel>

          <PortalPanel title="Contact tips" padded>
            <ul className="crm-stu-profile__tips">
              <li>
                <FiPhone aria-hidden />
                Keep phone current so counselling and fee reminders reach you.
              </li>
              <li>
                <FiMapPin aria-hidden />
                Address is shared with your institute student record.
              </li>
              <li>
                <FiUser aria-hidden />
                Emergency contact shows on staff overview and enquiry alternate contact.
              </li>
            </ul>
          </PortalPanel>

          <PortalPanel
            title="Password"
            description="One login password for the student portal. Changing it signs you out everywhere."
            padded
          >
            <form className="crm-stu-profile__password" onSubmit={handleChangePassword}>
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={password.currentPassword}
                onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))}
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={password.newPassword}
                onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))}
                placeholder="Testing default: 123"
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={password.confirmPassword}
                onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))}
              />
              <Button type="submit" size="sm" loading={passwordSaving} icon={FiLock}>
                Update password
              </Button>
            </form>
          </PortalPanel>
        </aside>
      </div>
    </PortalPage>
  );
}
