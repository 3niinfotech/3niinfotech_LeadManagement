import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiActivity,
  FiBriefcase,
  FiCalendar,
  FiCamera,
  FiCheck,
  FiClock,
  FiGrid,
  FiLock,
  FiMail,
  FiMapPin,
  FiSettings,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import PageShell from '../../components/layout/PageShell';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import RoleBadge from '../../components/profile/RoleBadge';
import AvatarCropModal from '../../components/profile/AvatarCropModal';
import AvatarPreviewModal from '../../components/profile/AvatarPreviewModal';
import NotificationPreferencesCard from '../../features/settings/components/NotificationPreferencesCard';
import { WorkloadStats, ProfileInfoRow } from '../../components/profile/ProfileSections';
import {
  fetchProfile,
  logoutUser,
  removeProfileAvatar,
  selectUser,
  updateProfile,
  uploadProfileAvatar,
} from '../../redux/slices/authSlice';
import {
  selectTableDensity,
  selectTheme,
  setTableDensity,
  setTheme,
} from '../../redux/slices/uiSlice';
import { getRoleMeta } from '../../config/roles';
import { ROUTES } from '../../config/routes';
import { PERMISSIONS } from '../../config/permissions';
import { TABLE_DENSITY, THEMES } from '../../config/constants';
import { resolvePublicAssetUrl } from '../../config/company-settings.config';
import { usePermissions } from '../../hooks/usePermissions';
import { authService } from '../../services/auth/auth.service';
import toastService from '../../services/toast/toast.service';

const PROFILE_TABS = [
  { id: 'account', label: 'Account', icon: FiUser },
  { id: 'preferences', label: 'Preferences', icon: FiSettings },
  { id: 'security', label: 'Security', icon: FiLock },
];

function ChoiceButton({
  active, icon: Icon, label, description, onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        active
          ? 'border-brand/35 bg-brand-soft text-brand'
          : 'border-border bg-card-bg text-text-secondary hover:border-border-strong hover:bg-row-hover'
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-brand text-white' : 'bg-page text-text-muted'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-[11px] text-text-muted">{description}</span>
      </span>
      {active && <FiCheck className="h-4 w-4 shrink-0" />}
    </button>
  );
}

function WorkspaceLinks({ user, can, isAdmin, onOpen }) {
  const links = [
    (isAdmin || can(PERMISSIONS.USERS_VIEW)) && { label: 'Team & users', path: ROUTES.USERS, icon: FiUsers },
    (isAdmin || can(PERMISSIONS.ROLES_VIEW)) && { label: 'Roles & access', path: ROUTES.ROLES, icon: FiShield },
    (isAdmin || can(PERMISSIONS.SETTINGS_VIEW)) && { label: 'Company settings', path: ROUTES.SETTINGS, icon: FiSettings },
    can(PERMISSIONS.WALKIN_VIEW) && { label: 'Walk-ins', path: ROUTES.WALK_INS, icon: FiActivity },
    can(PERMISSIONS.CALENDAR_VIEW) && { label: 'Calendar', path: ROUTES.CALENDAR, icon: FiCalendar },
    can(PERMISSIONS.ENQUIRIES_VIEW) && { label: 'My enquiries', path: ROUTES.ENQUIRIES, icon: FiBriefcase },
    can(PERMISSIONS.STUDENTS_VIEW) && { label: 'Students', path: ROUTES.STUDENTS, icon: FiUsers },
  ].filter(Boolean).slice(0, 6);

  if (user?.portal === 'student') {
    links.splice(0, links.length,
      { label: 'Student home', path: ROUTES.STUDENT_DASHBOARD, icon: FiGrid },
      { label: 'My applications', path: ROUTES.STUDENT_APPLICATIONS, icon: FiBriefcase });
  }
  if (user?.portal === 'agent') {
    links.splice(0, links.length,
      { label: 'Agent home', path: ROUTES.AGENT_DASHBOARD, icon: FiGrid },
      { label: 'My students', path: ROUTES.AGENT_STUDENTS, icon: FiUsers });
  }

  if (!links.length) return null;

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text">My workspace</h3>
      <p className="mt-1 text-xs text-text-muted">Quick access based on your role and responsibilities.</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {links.map(({ label, path, icon: Icon }) => (
          <button
            key={`${label}-${path}`}
            type="button"
            onClick={() => onOpen(path)}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-page px-3 py-2.5 text-left text-xs font-semibold text-text-secondary transition-colors hover:border-brand/30 hover:bg-brand-soft hover:text-brand"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const user = useSelector(selectUser);
  const theme = useSelector(selectTheme);
  const density = useSelector(selectTableDensity);
  const { can, isAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState('account');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [password, setPassword] = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
    });
  }, [user]);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const roleMeta = getRoleMeta(user?.role?.slug);
  const avatarUrl = resolvePublicAssetUrl(user?.avatar);
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
  const dirty = form.firstName !== (user?.firstName || '')
    || form.lastName !== (user?.lastName || '')
    || form.phone !== (user?.phone || '');
  const lastLogin = useMemo(() => {
    if (!user?.lastLoginAt) return 'Not available';
    return new Date(user.lastLoginAt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }, [user?.lastLoginAt]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await dispatch(updateProfile(form)).unwrap();
      toastService.action.saved('Profile updated');
    } catch (err) {
      toastService.action.error(err || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toastService.action.error('Use a JPG, PNG, or WEBP image');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toastService.action.error('Choose an image smaller than 8 MB');
      return;
    }
    setAvatarFile(file);
  };

  const saveAvatar = async (file) => {
    setAvatarUploading(true);
    try {
      await dispatch(uploadProfileAvatar(file)).unwrap();
      setAvatarFile(null);
      toastService.action.saved('Profile photo updated');
    } catch (err) {
      toastService.action.error(err || 'Photo upload failed');
      throw err;
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarRemoving(true);
    try {
      await dispatch(removeProfileAvatar()).unwrap();
      setAvatarPreview(false);
      toastService.action.saved('Profile photo removed');
    } catch (err) {
      toastService.action.error(err || 'Photo removal failed');
    } finally {
      setAvatarRemoving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toastService.action.error('New passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await authService.changePassword(password);
      toastService.action.saved('Password changed. Please sign in again.');
      await dispatch(logoutUser());
      const loginPath = user?.portal === 'student'
        ? ROUTES.LOGIN_STUDENT
        : user?.portal === 'agent' ? ROUTES.LOGIN_AGENT : ROUTES.LOGIN_ADMIN;
      navigate(loginPath, { replace: true });
    } catch (err) {
      toastService.action.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <PageShell className="!space-y-4">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal account, preferences, and security"
        icon={FiUser}
        iconColor="brand"
        breadcrumbs={[{ label: 'Dashboard', path: user?.defaultRoute || ROUTES.DASHBOARD }, { label: 'Profile' }]}
      />

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="border-b border-border px-5 py-6 text-center">
              <div className="group relative mx-auto h-24 w-24">
                {avatarUrl ? (
                  <Avatar
                    name={fullName}
                    src={avatarUrl}
                    size="lg"
                    className="!h-24 !w-24 text-xl ring-4 ring-page shadow-md"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-accent text-2xl font-bold tracking-wide text-white shadow-md ring-4 ring-page">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => (avatarUrl ? setAvatarPreview(true) : fileInputRef.current?.click())}
                  className="absolute inset-0 flex scale-90 items-center justify-center rounded-full bg-slate-950/0 text-transparent opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:bg-slate-950/55 group-hover:text-white group-hover:opacity-100 focus:scale-100 focus:bg-slate-950/55 focus:text-white focus:opacity-100"
                  aria-label={avatarUrl ? 'View profile photo' : 'Add profile photo'}
                >
                  <FiCamera className="h-5 w-5" />
                </button>
                <span className="pointer-events-none absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card-bg bg-brand text-white shadow-sm transition-transform duration-200 group-hover:scale-110">
                  <FiCamera className="h-3.5 w-3.5" />
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={chooseAvatar}
              />
              <h2 className="mt-4 truncate text-lg font-bold text-text">{fullName}</h2>
              <div className="mt-2 flex justify-center">
                <RoleBadge slug={user?.role?.slug} name={user?.role?.name} size="lg" />
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 truncate text-xs text-text-secondary">
                <FiMail className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                {user?.email}
              </p>
              <p className="mx-auto mt-2 max-w-xs text-[11px] leading-relaxed text-text-muted">{roleMeta.description}</p>
            
            </div>

            <div className="space-y-1 p-4">
              <ProfileInfoRow icon={FiBriefcase} label="Company" value={user?.company?.name || 'Platform'} />
              <ProfileInfoRow icon={FiMapPin} label="Branch" value={user?.branch?.name || 'All branches'} />
              <ProfileInfoRow icon={FiUser} label="Account status" value={user?.status?.replace(/_/g, ' ')} />
              <ProfileInfoRow icon={FiClock} label="Last sign in" value={lastLogin} />
            </div>
          </Card>

          {user?.workload
            && user.portal !== 'student'
            && user?.role?.slug !== 'receptionist' && (
            <Card>
              <h3 className="text-sm font-semibold text-text">My workload</h3>
              <p className="mb-3 mt-1 text-[11px] text-text-muted">Records currently assigned to you</p>
              <WorkloadStats workload={user.workload} />
            </Card>
          )}
        </aside>

        <main className="min-w-0 space-y-4">
          <nav className="flex min-w-0 gap-1 overflow-x-auto rounded-xl border border-border bg-card-bg p-1 shadow-sm" aria-label="Profile sections">
            {PROFILE_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  activeTab === id ? 'bg-brand text-white shadow-sm' : 'text-text-secondary hover:bg-row-hover hover:text-text'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </nav>

          {activeTab === 'account' && (
            <>
              <Card>
                <div className="border-b border-border pb-3">
                  <h3 className="text-sm font-semibold text-text">Personal information</h3>
                  <p className="mt-1 text-xs text-text-muted">Keep your contact details accurate for your team.</p>
                </div>
                <form onSubmit={handleSave} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="First name"
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                    required
                  />
                  <Input
                    label="Last name"
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                    required
                  />
                  <Input
                    label="Phone"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                  <Input label="Email" value={user?.email || ''} disabled />
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-4 sm:col-span-2">
                    <p className="text-[11px] text-text-muted">
                      Email and role changes are managed by an authorized administrator.
                    </p>
                    <Button type="submit" icon={FiCheck} loading={saving} disabled={!dirty}>
                      Save changes
                    </Button>
                  </div>
                </form>
              </Card>
              <WorkspaceLinks user={user} can={can} isAdmin={isAdmin} onOpen={navigate} />
            </>
          )}

          {activeTab === 'preferences' && (
            <>
              <Card>
                <h3 className="text-sm font-semibold text-text">Appearance & workspace</h3>
                <p className="mt-1 text-xs text-text-muted">Choose how this device displays your workspace.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ChoiceButton
                    active={theme === THEMES.LIGHT}
                    icon={FiGrid}
                    label="Light theme"
                    description="Bright interface for daytime work"
                    onClick={() => dispatch(setTheme(THEMES.LIGHT))}
                  />
                  <ChoiceButton
                    active={theme === THEMES.DARK}
                    icon={FiActivity}
                    label="Dark theme"
                    description="Reduced glare for low-light work"
                    onClick={() => dispatch(setTheme(THEMES.DARK))}
                  />
                  <ChoiceButton
                    active={density === TABLE_DENSITY.COMFORTABLE}
                    icon={FiGrid}
                    label="Comfortable tables"
                    description="More space between data rows"
                    onClick={() => dispatch(setTableDensity(TABLE_DENSITY.COMFORTABLE))}
                  />
                  <ChoiceButton
                    active={density === TABLE_DENSITY.COMPACT}
                    icon={FiActivity}
                    label="Compact tables"
                    description="See more records at once"
                    onClick={() => dispatch(setTableDensity(TABLE_DENSITY.COMPACT))}
                  />
                </div>
              </Card>
              <NotificationPreferencesCard />
            </>
          )}

          {activeTab === 'security' && (
            <Card>
              <div className="flex items-start gap-3 border-b border-border pb-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <FiShield className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-text">Change password</h3>
                  <p className="mt-1 text-xs text-text-muted">
                    Use at least 8 characters. Changing it signs you out of all active sessions.
                  </p>
                </div>
              </div>
              <form onSubmit={changePassword} className="mt-4 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  type="password"
                  label="Current password"
                  value={password.currentPassword}
                  onChange={(event) => setPassword((current) => ({ ...current, currentPassword: event.target.value }))}
                  autoComplete="current-password"
                  required
                  className="sm:col-span-2"
                />
                <Input
                  type="password"
                  label="New password"
                  value={password.newPassword}
                  onChange={(event) => setPassword((current) => ({ ...current, newPassword: event.target.value }))}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <Input
                  type="password"
                  label="Confirm new password"
                  value={password.confirmPassword}
                  onChange={(event) => setPassword((current) => ({ ...current, confirmPassword: event.target.value }))}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <div className="flex justify-end border-t border-border pt-4 sm:col-span-2">
                  <Button
                    type="submit"
                    icon={FiLock}
                    loading={passwordSaving}
                    disabled={!password.currentPassword || password.newPassword.length < 8 || !password.confirmPassword}
                  >
                    Update password
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </main>
      </div>

      <AvatarPreviewModal
        open={avatarPreview && Boolean(avatarUrl)}
        src={avatarUrl}
        name={fullName}
        removing={avatarRemoving}
        onClose={() => setAvatarPreview(false)}
        onChange={() => {
          setAvatarPreview(false);
          fileInputRef.current?.click();
        }}
        onRemove={removeAvatar}
      />

      <AvatarCropModal
        file={avatarFile}
        open={Boolean(avatarFile)}
        uploading={avatarUploading}
        onClose={() => setAvatarFile(null)}
        onSave={saveAvatar}
      />
    </PageShell>
  );
}
