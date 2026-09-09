import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiBriefcase,
  FiCamera,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiEdit2,
  FiGrid,
  FiKey,
  FiLock,
  FiLogIn,
  FiMail,
  FiMapPin,
  FiMonitor,
  FiPhone,
  FiPlus,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import PageShell from '../../components/layout/PageShell';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import RoleBadge from '../../components/profile/RoleBadge';
import AvatarCropModal from '../../components/profile/AvatarCropModal';
import AvatarPreviewModal from '../../components/profile/AvatarPreviewModal';
import {
  fetchProfile,
  logoutUser,
  removeProfileAvatar,
  selectUser,
  updateProfile,
  uploadProfileAvatar,
  updateUserPreferences,
} from '../../redux/slices/authSlice';
import {
  selectTableDensity,
  selectTheme,
  setTableDensity,
  setTheme,
} from '../../redux/slices/uiSlice';
import { ROUTES } from '../../config/routes';
import { TABLE_DENSITY, THEMES } from '../../config/constants';
import { resolvePublicAssetUrl } from '../../config/company-settings.config';
import {
  getDefaultShortcutIds,
  LANDING_PAGE_OPTIONS,
  PAGE_SIZE_OPTIONS,
  resolveShortcuts,
  SHORTCUT_CATALOG,
  WORKSPACE_TIPS,
} from '../../config/profile-workspace.config';
import { authService } from '../../services/auth/auth.service';
import toastService from '../../services/toast/toast.service';
import { STORAGE_KEYS } from '../../config/storageKeys';
import './profile.theme.css';

const TABS = [
  { id: 'account', label: 'Account', icon: FiUser },
  { id: 'workspace', label: 'Workspace', icon: FiGrid },
  { id: 'security', label: 'Security', icon: FiLock },
];

function fmtDate(value, withTime = true) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

function relativeAgo(value) {
  if (!value) return '';
  const ms = Date.now() - new Date(value).getTime();
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-border'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function ShortcutTile({ item, onClick }) {
  const Icon = item.icon;
  return (
    <button type="button" className="crm-my-profile-shortcut" onClick={() => onClick(item)}>
      <span className={`crm-my-profile-shortcut__icon crm-tone-${item.tone}`} aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
      <span className="crm-my-profile-shortcut__label">{item.label}</span>
    </button>
  );
}

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const user = useSelector(selectUser);
  const theme = useSelector(selectTheme);
  const density = useSelector(selectTableDensity);

  const [tab, setTab] = useState('account');
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [tokensOpen, setTokensOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', department: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(false);

  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [apiTokens, setApiTokens] = useState([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [createdToken, setCreatedToken] = useState(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  const prefs = user?.preferences && typeof user.preferences === 'object' ? user.preferences : {};
  const roleSlug = user?.role?.slug;
  const shortcutIds = prefs.shortcuts?.length
    ? prefs.shortcuts
    : getDefaultShortcutIds(roleSlug);
  const shortcuts = resolveShortcuts(shortcutIds);
  const recentModules = Array.isArray(prefs.recentModules) ? prefs.recentModules : [];

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const avatarUrl = resolvePublicAssetUrl(user?.avatar);
  const initials = fullName.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U';

  const loadSecurity = useCallback(async () => {
    setLoadingSecurity(true);
    try {
      const [ov, act, hist] = await Promise.all([
        authService.getSecurityOverview(),
        authService.listActivity(8),
        authService.listLoginHistory(10),
      ]);
      setOverview(ov);
      setActivity(Array.isArray(act) ? act : []);
      setLoginHistory(Array.isArray(hist) ? hist : []);
    } catch {
      /* keep previous */
    } finally {
      setLoadingSecurity(false);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchProfile());
    loadSecurity();
  }, [dispatch, loadSecurity]);

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      department: user.department || '',
    });
  }, [user]);

  const persistPreferences = async (patch) => {
    try {
      const next = await authService.updatePreferences(patch);
      if (next?.preferences) {
        dispatch(updateUserPreferences(next.preferences));
      }
      if (next) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
      }
      await dispatch(fetchProfile());
      return next;
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Could not save preferences');
      throw err;
    }
  };

  const trackRecent = async (item) => {
    const entry = {
      id: item.id,
      label: item.label,
      path: item.path,
      tone: item.tone,
      at: new Date().toISOString(),
    };
    const next = [entry, ...recentModules.filter((r) => r.path !== item.path)].slice(0, 8);
    try {
      await persistPreferences({ recentModules: next });
    } catch { /* ignore */ }
    navigate(item.path);
  };

  const openShortcut = (item) => trackRecent(item);

  const chooseAvatar = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toastService.error('Use a JPG, PNG, or WEBP image');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toastService.error('Choose an image smaller than 8 MB');
      return;
    }
    setAvatarFile(file);
  };

  const saveAvatar = async (file) => {
    setAvatarUploading(true);
    try {
      await dispatch(uploadProfileAvatar(file)).unwrap();
      setAvatarFile(null);
      toastService.success('Profile photo updated');
      loadSecurity();
    } catch (err) {
      toastService.error(err || 'Photo upload failed');
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
      toastService.success('Profile photo removed');
    } catch (err) {
      toastService.error(err || 'Photo removal failed');
    } finally {
      setAvatarRemoving(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await dispatch(updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
        department: form.department || null,
      })).unwrap();
      toastService.success('Profile updated');
      setEditOpen(false);
      loadSecurity();
    } catch (err) {
      toastService.error(err || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toastService.error('New passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await authService.changePassword(password);
      toastService.success('Password changed. Please sign in again.');
      await dispatch(logoutUser());
      const loginPath = user?.portal === 'student'
        ? ROUTES.LOGIN_STUDENT
        : user?.portal === 'agent' ? ROUTES.LOGIN_AGENT : ROUTES.LOGIN_ADMIN;
      navigate(loginPath, { replace: true });
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Could not change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const openSessions = async () => {
    setSessionsOpen(true);
    try {
      const rows = await authService.listSessions();
      setSessions(Array.isArray(rows) ? rows : []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Could not load sessions');
    }
  };

  const openTokens = async () => {
    setTokensOpen(true);
    setCreatedToken(null);
    try {
      const rows = await authService.listApiTokens();
      setApiTokens(Array.isArray(rows) ? rows : []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Could not load tokens');
    }
  };

  const toggleTwoFactor = async () => {
    const next = !Boolean(prefs.twoFactorEnabled);
    await persistPreferences({ twoFactorEnabled: next });
    toastService.success(next ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled');
    loadSecurity();
  };

  const tip = WORKSPACE_TIPS[tipIndex % WORKSPACE_TIPS.length];

  const activityIcon = (tone) => {
    if (tone === 'success') return FiCheck;
    if (tone === 'warning') return FiKey;
    if (tone === 'danger') return FiLock;
    return FiUser;
  };

  const draftShortcutIds = useMemo(() => shortcutIds, [shortcutIds]);
  const [shortcutDraft, setShortcutDraft] = useState(draftShortcutIds);
  useEffect(() => {
    if (shortcutsOpen) setShortcutDraft(shortcutIds);
  }, [shortcutsOpen, shortcutIds]);

  return (
    <PageShell className="!space-y-2 crm-profile-shell">
      <PageHeader
        title="My Profile"
        subtitle="Account, workspace, and security"
        icon={FiUser}
        iconColor="brand"
        className="!mb-0 [&>div]:!pt-1.5 [&>div]:!pb-2 [&_h1]:!text-[15px] [&_p]:!text-[12px] [&_p]:!mt-0.5"
        breadcrumbs={[
          { label: 'Dashboard', path: user?.defaultRoute || ROUTES.DASHBOARD },
          { label: 'Profile' },
        ]}
      />

      <div className="crm-my-profile">
        <nav className="crm-my-profile-tabs" aria-label="Profile sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`crm-my-profile-tabs__tab${tab === id ? ' crm-my-profile-tabs__tab--active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </nav>

        {tab === 'account' && (
          <>
            <section className="crm-my-profile-hero-card">
              <div className="crm-my-profile-hero">
                <div className="crm-my-profile-hero__photo">
                  <div className="crm-my-profile-hero__avatar">
                    {avatarUrl ? (
                      <Avatar
                        name={fullName}
                        src={avatarUrl}
                        size="lg"
                        className="!h-[4.5rem] !w-[4.5rem] !rounded-2xl text-base"
                      />
                    ) : (
                      <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-accent text-base font-bold text-white shadow-sm">
                        {initials}
                      </div>
                    )}
                    <span className="crm-my-profile-hero__online" title="Online" />
                  </div>
                  <button
                    type="button"
                    className="crm-my-profile-hero__photo-btn"
                    onClick={() => (avatarUrl ? setAvatarPreview(true) : fileInputRef.current?.click())}
                  >
                    <FiCamera className="h-3.5 w-3.5" />
                    Change photo
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={chooseAvatar} />
                </div>

                <div className="crm-my-profile-hero__body">
                  <div className="crm-my-profile-hero__top">
                    <div className="crm-my-profile-hero__identity">
                      <h2 className="crm-my-profile-hero__name">{fullName}</h2>
                      <RoleBadge slug={user?.role?.slug} name={user?.role?.name} size="sm" />
                    </div>
                    <div className="crm-my-profile-hero__actions">
                      <span className="crm-my-profile-pill crm-my-profile-pill--success">
                        {user?.status || 'ACTIVE'}
                      </span>
                      <Button size="sm" variant="outline-primary" icon={FiEdit2} onClick={() => setEditOpen(true)}>
                        Edit Profile
                      </Button>
                    </div>
                  </div>

                  <div className="crm-my-profile-hero__chips">
                    <div className="crm-my-profile-chip" title={user?.email || ''}>
                      <FiMail />
                      <div>
                        <span>Email</span>
                        <strong>{user?.email || '—'}</strong>
                      </div>
                    </div>
                    <div className="crm-my-profile-chip" title={user?.phone || ''}>
                      <FiPhone />
                      <div>
                        <span>Phone</span>
                        <strong>{user?.phone || '—'}</strong>
                      </div>
                    </div>
                    <div className="crm-my-profile-chip">
                      <FiShield />
                      <div>
                        <span>Role</span>
                        <strong>{user?.role?.name || '—'}</strong>
                      </div>
                    </div>
                    <div className="crm-my-profile-chip">
                      <FiBriefcase />
                      <div>
                        <span>Employee ID</span>
                        <strong>{user?.employeeCode || '—'}</strong>
                      </div>
                    </div>
                    <div className="crm-my-profile-chip">
                      <FiGrid />
                      <div>
                        <span>Department</span>
                        <strong>{user?.department || prefs.departmentLabel || '—'}</strong>
                      </div>
                    </div>
                    <div className="crm-my-profile-chip" title={user?.branch?.name || 'All branches'}>
                      <FiMapPin />
                      <div>
                        <span>Branch</span>
                        <strong>{user?.branch?.name || 'All branches'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="crm-my-profile-hero__meta">
                    <span className="crm-my-profile-meta-item">
                      <FiMonitor />
                      <em>Last login</em>
                      <strong>{fmtDate(user?.lastLoginAt || overview?.lastLoginAt)}</strong>
                    </span>
                    <span className="crm-my-profile-meta-item">
                      <FiLock />
                      <em>Password</em>
                      <strong>{fmtDate(user?.passwordChangedAt || overview?.passwordChangedAt, false)}</strong>
                    </span>
                    <span className="crm-my-profile-meta-item">
                      <FiBriefcase />
                      <em>Company</em>
                      <strong>{user?.company?.name || 'Platform'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <div className="crm-my-profile-grid-2">
              <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Workspace Shortcuts</h3>
                    <p className="crm-my-profile-card__sub">Most used modules</p>
                  </div>
                  <Button size="sm" variant="outline" icon={FiGrid} onClick={() => setShortcutsOpen(true)}>Manage</Button>
                </div>
                <div className="crm-my-profile-shortcuts">
                  {shortcuts.slice(0, 9).map((item) => (
                    <ShortcutTile key={item.id} item={item} onClick={openShortcut} />
                  ))}
                  <button type="button" className="crm-my-profile-shortcut crm-my-profile-shortcut--add" onClick={() => setShortcutsOpen(true)}>
                    <span className="crm-my-profile-shortcut__icon" aria-hidden><FiPlus className="h-4 w-4" /></span>
                    <span className="crm-my-profile-shortcut__label">Add Shortcut</span>
                  </button>
                </div>
              </section>

              <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Security</h3>
                    <p className="crm-my-profile-card__sub">Password and access</p>
                  </div>
                </div>
                <div className="crm-my-profile-secure-list">
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiLock className="h-4 w-4" /></span>
                    <div className="crm-my-profile-secure-copy">
                      <strong>Password</strong>
                      <span>Last changed {fmtDate(user?.passwordChangedAt || overview?.passwordChangedAt, false)}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setPasswordOpen(true)}>Change Password</Button>
                  </div>
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiShield className="h-4 w-4" /></span>
                    <div className="crm-my-profile-secure-copy">
                      <strong>Two-Factor Authentication</strong>
                      <span>Add an extra layer of security</span>
                    </div>
                    <button type="button" onClick={toggleTwoFactor} className="crm-my-profile-pill crm-my-profile-pill--success">
                      {prefs.twoFactorEnabled || overview?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiMonitor className="h-4 w-4" /></span>
                    <div className="crm-my-profile-secure-copy">
                      <strong>Active Sessions</strong>
                      <span>{overview?.activeSessions ?? '—'} active sessions</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={openSessions}>View Sessions</Button>
                  </div>
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiKey className="h-4 w-4" /></span>
                    <div className="crm-my-profile-secure-copy">
                      <strong>API Access Tokens</strong>
                      <span>Manage your API keys</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={openTokens}>Manage Tokens</Button>
                  </div>
                </div>
              </section>
            </div>

            <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Recent Account Activity</h3>
                    <p className="crm-my-profile-card__sub">Latest account actions</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setHistoryOpen(true); setTab('security'); }}>View All</Button>
                </div>
              <div className="crm-my-profile-activity">
                {!activity.length && (
                  <p className="crm-my-profile-empty">{loadingSecurity ? 'Loading activity…' : 'No recent activity yet. Sign in and updates appear here.'}</p>
                )}
                {activity.slice(0, 5).map((row) => {
                  const Icon = activityIcon(row.tone);
                  return (
                    <div key={row.id} className="crm-my-profile-activity__row">
                      <span className={`crm-my-profile-activity__icon crm-my-profile-activity__icon--${row.tone || 'neutral'}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="crm-my-profile-activity__title">{row.title}</p>
                        <p className="crm-my-profile-activity__meta">
                          {[row.browser, row.deviceLabel, row.ipAddress].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <span className="crm-my-profile-activity__time">{fmtDate(row.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {tab === 'workspace' && (
          <div className="crm-my-profile-grid-2">
            <div className="crm-my-profile-col">
              <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Workspace Shortcuts</h3>
                    <p className="crm-my-profile-card__sub">Quick access to the modules you use most</p>
                  </div>
                </div>
                <div className="crm-my-profile-shortcuts">
                  {shortcuts.slice(0, 9).map((item) => (
                    <ShortcutTile key={item.id} item={item} onClick={openShortcut} />
                  ))}
                  <button type="button" className="crm-my-profile-shortcut crm-my-profile-shortcut--add" onClick={() => setShortcutsOpen(true)}>
                    <span className="crm-my-profile-shortcut__icon"><FiPlus className="h-4 w-4" /></span>
                    <span className="crm-my-profile-shortcut__label">Add Shortcut</span>
                  </button>
                </div>
              </section>

              <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Recent Modules</h3>
                    <p className="crm-my-profile-card__sub">Recently opened</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setShortcutsOpen(true)}>View All</Button>
                </div>
                <div className="crm-my-profile-recent">
                  {!recentModules.length && <p className="crm-my-profile-empty">Open a shortcut to build your recent list.</p>}
                  {recentModules.map((item) => (
                    <button
                      key={`${item.path}-${item.at}`}
                      type="button"
                      className="crm-my-profile-recent__chip"
                      onClick={() => navigate(item.path)}
                    >
                      <span className={`inline-flex h-5 w-5 items-center justify-center rounded crm-tone-${item.tone || 'slate'}`}>
                        <FiGrid className="h-3 w-3" />
                      </span>
                      {item.label} · {relativeAgo(item.at)}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="crm-my-profile-col">
              <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Customize Workspace</h3>
                    <p className="crm-my-profile-card__sub">Personalize login and density</p>
                  </div>
                </div>
                <div>
                  <div className="crm-my-profile-setting-row">
                    <span className="crm-my-profile-secure-icon"><FiLogIn className="h-4 w-4" /></span>
                    <div className="crm-my-profile-secure-copy">
                      <strong>Default Landing Page</strong>
                      <span>Module shown on login</span>
                    </div>
                    <select
                      value={prefs.landingPage || user?.defaultRoute || '/admin/dashboard'}
                      onChange={async (e) => {
                        await persistPreferences({ landingPage: e.target.value });
                        toastService.success('Landing page updated');
                      }}
                    >
                      {LANDING_PAGE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="crm-my-profile-setting-row">
                    <span className="crm-my-profile-secure-icon"><FiGrid className="h-4 w-4" /></span>
                    <div className="crm-my-profile-secure-copy">
                      <strong>Items Per Page</strong>
                      <span>Records per table page</span>
                    </div>
                    <select
                      value={prefs.pageSize || 25}
                      onChange={async (e) => {
                        await persistPreferences({ pageSize: Number(e.target.value) });
                        toastService.success('Page size updated');
                      }}
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="crm-my-profile-setting-row">
                    <span className="crm-my-profile-secure-icon"><FiMonitor className="h-4 w-4" /></span>
                    <div className="crm-my-profile-secure-copy">
                      <strong>Theme</strong>
                      <span>Preferred appearance</span>
                    </div>
                    <select
                      value={prefs.theme || theme}
                      onChange={async (e) => {
                        const value = e.target.value;
                        dispatch(setTheme(value));
                        await persistPreferences({ theme: value });
                      }}
                    >
                      <option value={THEMES.LIGHT}>Light</option>
                      <option value={THEMES.DARK}>Dark</option>
                    </select>
                  </div>
                  <div className="crm-my-profile-setting-row">
                    <span className="crm-my-profile-secure-icon"><FiGrid className="h-4 w-4" /></span>
                    <div className="crm-my-profile-secure-copy">
                      <strong>Compact Mode</strong>
                      <span>More rows, less padding</span>
                    </div>
                    <Switch
                      checked={Boolean(prefs.compactMode) || density === TABLE_DENSITY.COMPACT}
                      onChange={async (on) => {
                        dispatch(setTableDensity(on ? TABLE_DENSITY.COMPACT : TABLE_DENSITY.COMFORTABLE));
                        await persistPreferences({
                          compactMode: on,
                          density: on ? TABLE_DENSITY.COMPACT : TABLE_DENSITY.COMFORTABLE,
                        });
                      }}
                    />
                  </div>
                </div>
              </section>

              <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Workspace Tips</h3>
                    <p className="crm-my-profile-card__sub">Work faster</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <button type="button" className="p-1 rounded hover:bg-row-hover" onClick={() => setTipIndex((i) => (i + WORKSPACE_TIPS.length - 1) % WORKSPACE_TIPS.length)}>
                      <FiChevronLeft />
                    </button>
                    <span>{(tipIndex % WORKSPACE_TIPS.length) + 1} / {WORKSPACE_TIPS.length}</span>
                    <button type="button" className="p-1 rounded hover:bg-row-hover" onClick={() => setTipIndex((i) => i + 1)}>
                      <FiChevronRight />
                    </button>
                  </div>
                </div>
                <div className="crm-my-profile-tip">
                  <span className="crm-my-profile-secure-icon"><FiCheck className="h-4 w-4" /></span>
                  <div>
                    <strong className="text-sm text-text">{tip.title}</strong>
                    <p className="mt-0.5 text-[11px] text-text-muted leading-snug">{tip.body}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <>
            <div className="crm-my-profile-grid-2">
              <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Security Settings</h3>
                    <p className="crm-my-profile-card__sub">Password, sessions, and access</p>
                  </div>
                </div>
                <div className="crm-my-profile-secure-list">
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiLock /></span>
                    <div className="crm-my-profile-secure-copy"><strong>Password</strong><span>Update your account password</span></div>
                    <Button size="sm" variant="outline" onClick={() => setPasswordOpen(true)}>Change Password</Button>
                  </div>
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiShield /></span>
                    <div className="crm-my-profile-secure-copy"><strong>Two-Factor Authentication</strong><span>Extra login protection</span></div>
                    <button type="button" className="crm-my-profile-pill crm-my-profile-pill--success" onClick={toggleTwoFactor}>
                      {prefs.twoFactorEnabled || overview?.twoFactorEnabled ? 'Enabled' : 'Enable'}
                    </button>
                  </div>
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiMonitor /></span>
                    <div className="crm-my-profile-secure-copy"><strong>Active Sessions</strong><span>Devices signed in now</span></div>
                    <Button size="sm" variant="outline" onClick={openSessions}>View Sessions</Button>
                  </div>
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiKey /></span>
                    <div className="crm-my-profile-secure-copy"><strong>API Access Tokens</strong><span>Integration keys</span></div>
                    <Button size="sm" variant="outline" onClick={openTokens}>Manage Tokens</Button>
                  </div>
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiClock /></span>
                    <div className="crm-my-profile-secure-copy"><strong>Login History</strong><span>Recent sign-ins</span></div>
                    <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>View History</Button>
                  </div>
                  <div className="crm-my-profile-secure-row">
                    <span className="crm-my-profile-secure-icon"><FiMonitor /></span>
                    <div className="crm-my-profile-secure-copy"><strong>Trusted Devices</strong><span>Linked session devices</span></div>
                    <Button size="sm" variant="outline" onClick={openSessions}>Manage Devices</Button>
                  </div>
                </div>
              </section>

              <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Security Overview</h3>
                    <p className="crm-my-profile-card__sub">Live account status</p>
                  </div>
                </div>
                <div className="crm-my-profile-overview">
                  <div className="crm-my-profile-overview__banner">
                    <FiCheck className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">Your account is secure</strong>
                      <span>Sessions and password history are synced live.</span>
                    </div>
                  </div>
                  <div className="crm-my-profile-status__row"><span className="crm-my-profile-status__label"><FiLock /> Last Password Change</span><span className="crm-my-profile-status__value">{fmtDate(overview?.passwordChangedAt || user?.passwordChangedAt)}</span></div>
                  <div className="crm-my-profile-status__row"><span className="crm-my-profile-status__label"><FiShield /> Two-Factor Authentication</span><span className="crm-my-profile-status__value">{overview?.twoFactorEnabled || prefs.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span></div>
                  <div className="crm-my-profile-status__row"><span className="crm-my-profile-status__label"><FiMonitor /> Active Sessions</span><span className="crm-my-profile-status__value">{overview?.activeSessions ?? 0} active</span></div>
                  <div className="crm-my-profile-status__row"><span className="crm-my-profile-status__label"><FiKey /> API Tokens</span><span className="crm-my-profile-status__value">{overview?.apiTokenCount ?? 0} tokens</span></div>
                </div>
              </section>
            </div>

            <section className="crm-my-profile-card">
                <div className="crm-my-profile-card__head">
                  <div>
                    <h3 className="crm-my-profile-card__title">Recent Login Activity</h3>
                    <p className="crm-my-profile-card__sub">Sign-in history</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setHistoryOpen(true)}>View All</Button>
                </div>
              <div className="overflow-x-auto">
                <table className="crm-my-profile-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Device</th>
                      <th>Browser</th>
                      <th>IP Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!loginHistory.length && (
                      <tr><td colSpan={5} className="crm-my-profile-empty">No login history yet</td></tr>
                    )}
                    {loginHistory.slice(0, 8).map((row) => (
                      <tr key={row.id}>
                        <td>{fmtDate(row.createdAt)}</td>
                        <td>{row.device}</td>
                        <td>{row.browser}</td>
                        <td>{row.ipAddress}</td>
                        <td>
                          <span className={`crm-my-profile-pill ${row.status === 'Success' ? 'crm-my-profile-pill--success' : 'crm-my-profile-pill--danger'}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Edit profile */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="md" footer={(
        <>
          <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button form="profile-edit-form" type="submit" loading={saving}>Save changes</Button>
        </>
      )}
      >
        <form id="profile-edit-form" onSubmit={saveProfile} className="crm-my-profile-modal-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="First name" value={form.firstName} onChange={(e) => setForm((c) => ({ ...c, firstName: e.target.value }))} required />
            <Input label="Last name" value={form.lastName} onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value }))} required />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} />
            <Input label="Email" value={user?.email || ''} disabled />
            <Input label="Department" value={form.department} onChange={(e) => setForm((c) => ({ ...c, department: e.target.value }))} />
            <Input label="Employee ID" value={user?.employeeCode || ''} disabled />
          </div>
        </form>
      </Modal>

      {/* Password */}
      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change Password" size="md" footer={(
        <>
          <Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button>
          <Button form="profile-password-form" type="submit" loading={passwordSaving} icon={FiLock}>Update password</Button>
        </>
      )}
      >
        <form id="profile-password-form" onSubmit={changePassword} className="crm-my-profile-modal-form">
          <Input type="password" label="Current password" value={password.currentPassword} onChange={(e) => setPassword((c) => ({ ...c, currentPassword: e.target.value }))} required autoComplete="current-password" />
          <Input type="password" label="New password" value={password.newPassword} onChange={(e) => setPassword((c) => ({ ...c, newPassword: e.target.value }))} required minLength={8} autoComplete="new-password" />
          <Input type="password" label="Confirm password" value={password.confirmPassword} onChange={(e) => setPassword((c) => ({ ...c, confirmPassword: e.target.value }))} required minLength={8} autoComplete="new-password" />
        </form>
      </Modal>

      {/* Sessions */}
      <Modal
        open={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
        title="Active Sessions"
        size="lg"
        footer={(
          <>
            <Button variant="outline" onClick={() => setSessionsOpen(false)}>Close</Button>
            <Button
              variant="outline-primary"
              onClick={async () => {
                try {
                  await authService.revokeOtherSessions();
                  toastService.success('Other sessions revoked');
                  const rows = await authService.listSessions();
                  setSessions(Array.isArray(rows) ? rows : []);
                  loadSecurity();
                } catch (err) {
                  toastService.error(err?.response?.data?.message || 'Failed to revoke sessions');
                }
              }}
            >
              Revoke other sessions
            </Button>
          </>
        )}
      >
        <div className="overflow-x-auto">
          <table className="crm-my-profile-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Browser</th>
                <th>IP</th>
                <th>Last used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!sessions.length && <tr><td colSpan={5} className="crm-my-profile-empty">No active sessions</td></tr>}
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.deviceLabel}{s.current ? ' · Current' : ''}</td>
                  <td>{s.browser}</td>
                  <td>{s.ipAddress || '—'}</td>
                  <td>{fmtDate(s.lastUsedAt)}</td>
                  <td>
                    {!s.current && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await authService.revokeSession(s.id);
                            setSessions((rows) => rows.filter((r) => r.id !== s.id));
                            loadSecurity();
                            toastService.success('Session revoked');
                          } catch (err) {
                            toastService.error(err?.response?.data?.message || 'Failed');
                          }
                        }}
                      >
                        Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* API tokens */}
      <Modal open={tokensOpen} onClose={() => setTokensOpen(false)} title="API Access Tokens" size="lg" footer={<Button variant="outline" onClick={() => setTokensOpen(false)}>Close</Button>}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[180px]">
              <Input label="Token name" value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)} placeholder="e.g. Integration key" />
            </div>
            <Button
              onClick={async () => {
                try {
                  const created = await authService.createApiToken({ name: newTokenName, expiresInDays: 90 });
                  setCreatedToken(created.token);
                  setNewTokenName('');
                  const rows = await authService.listApiTokens();
                  setApiTokens(Array.isArray(rows) ? rows : []);
                  loadSecurity();
                  toastService.success('Token created — copy it now');
                } catch (err) {
                  toastService.error(err?.response?.data?.message || 'Could not create token');
                }
              }}
            >
              Create token
            </Button>
          </div>
          {createdToken && (
            <div className="rounded-lg border border-warning/30 bg-warning-soft/50 p-3 text-xs break-all">
              <strong className="block mb-1">Copy this token now — it won’t be shown again</strong>
              {createdToken}
            </div>
          )}
          <table className="crm-my-profile-table">
            <thead>
              <tr><th>Name</th><th>Prefix</th><th>Created</th><th>Expires</th><th /></tr>
            </thead>
            <tbody>
              {!apiTokens.length && <tr><td colSpan={5} className="crm-my-profile-empty">No API tokens yet</td></tr>}
              {apiTokens.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td className="font-mono">{t.tokenPrefix}…</td>
                  <td>{fmtDate(t.createdAt, false)}</td>
                  <td>{fmtDate(t.expiresAt, false)}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await authService.revokeApiToken(t.id);
                      setApiTokens((rows) => rows.filter((r) => r.id !== t.id));
                      loadSecurity();
                      toastService.success('Token revoked');
                    }}
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Shortcuts manager */}
      <Modal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title="Manage Shortcuts"
        size="lg"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShortcutsOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await persistPreferences({ shortcuts: shortcutDraft.slice(0, 9) });
                toastService.success('Shortcuts saved');
                setShortcutsOpen(false);
              }}
            >
              Save shortcuts
            </Button>
          </>
        )}
      >
        <div className="crm-my-profile-shortcuts">
          {SHORTCUT_CATALOG.map((item) => {
            const selected = shortcutDraft.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`crm-my-profile-shortcut${selected ? '' : ' opacity-60'}`}
                onClick={() => {
                  setShortcutDraft((ids) => (
                    ids.includes(item.id)
                      ? ids.filter((id) => id !== item.id)
                      : [...ids, item.id].slice(0, 9)
                  ));
                }}
              >
                <span className={`crm-my-profile-shortcut__icon crm-tone-${item.tone}`}>
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="crm-my-profile-shortcut__label">{item.label}{selected ? ' ✓' : ''}</span>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Full history */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Login History" size="lg" footer={<Button variant="outline" onClick={() => setHistoryOpen(false)}>Close</Button>}>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="crm-my-profile-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Device</th>
                <th>Browser</th>
                <th>IP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.map((row) => (
                <tr key={row.id}>
                  <td>{fmtDate(row.createdAt)}</td>
                  <td>{row.device}</td>
                  <td>{row.browser}</td>
                  <td>{row.ipAddress}</td>
                  <td><span className={`crm-my-profile-pill ${row.status === 'Success' ? 'crm-my-profile-pill--success' : 'crm-my-profile-pill--danger'}`}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <AvatarPreviewModal
        open={avatarPreview && Boolean(avatarUrl)}
        src={avatarUrl}
        name={fullName}
        removing={avatarRemoving}
        onClose={() => setAvatarPreview(false)}
        onChange={() => { setAvatarPreview(false); fileInputRef.current?.click(); }}
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
