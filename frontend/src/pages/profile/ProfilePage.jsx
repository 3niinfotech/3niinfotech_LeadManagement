import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSave, FiUser } from 'react-icons/fi';
import PageShell from '../../components/layout/PageShell';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import RoleBadge from '../../components/profile/RoleBadge';
import { WorkloadStats, ProfileInfoRow, FiMail, FiBriefcase, FiMapPin } from '../../components/profile/ProfileSections';
import { fetchProfile, updateProfile, selectUser } from '../../redux/slices/authSlice';
import { getRoleMeta } from '../../config/roles';
import { ROUTES } from '../../config/routes';
import { usePermissions } from '../../hooks/usePermissions';
import toastService from '../../services/toast/toast.service';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isAdmin } = usePermissions();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const roleMeta = getRoleMeta(user?.role?.slug);

  const handleSave = async (e) => {
    e.preventDefault();
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

  const permissions = user?.role?.permissions || [];
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const [module] = perm.split(':');
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm);
    return acc;
  }, {});

  return (
    <PageShell>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account details and view your access"
        icon={FiUser}
        iconColor="brand"
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Profile' }]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 !p-0 overflow-hidden">
          <div className="relative px-6 pt-8 pb-6 text-center border-b border-border bg-gradient-to-br from-brand-soft via-card-bg to-info-soft/20">
            <Avatar name={fullName} size="lg" className="mx-auto ring-4 ring-card-bg shadow-lg w-20 h-20 text-xl" />
            <h2 className="mt-4 text-lg font-bold text-text">{fullName}</h2>
            <div className="mt-2 flex justify-center">
              <RoleBadge slug={user?.role?.slug} name={user?.role?.name} size="lg" />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-text-secondary">
              <FiMail className="w-3.5 h-3.5 text-text-muted" />
              {user?.email}
            </p>
            <p className="mt-2 text-xs text-text-muted max-w-xs mx-auto">{roleMeta.description}</p>
          </div>

          <div className="p-5 space-y-1">
            <ProfileInfoRow icon={FiBriefcase} label="Company" value={user?.company?.name} />
            <ProfileInfoRow icon={FiMapPin} label="Branch" value={user?.branch?.name} />
            <ProfileInfoRow
              icon={FiUser}
              label="Account status"
              value={user?.status?.replace(/_/g, ' ')}
            />
          </div>
        </Card>

        <div className="xl:col-span-2 space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-text mb-4">Personal information</h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First name"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                required
              />
              <Input
                label="Last name"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                required
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="sm:col-span-2"
              />
              <Input label="Email" value={user?.email || ''} disabled className="sm:col-span-2" />
              <div className="sm:col-span-2 flex justify-end pt-2">
                <Button type="submit" icon={FiSave} loading={saving}>
                  Save changes
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text mb-1">My workload</h3>
            <p className="text-xs text-text-muted mb-4">Records currently assigned to you</p>
            <WorkloadStats workload={user?.workload} />
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-text mb-1">Access & permissions</h3>
            <p className="text-xs text-text-muted mb-4">
              {isAdmin ? 'Your role has elevated admin access across the CRM' : 'Permissions granted by your role'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto scroll-area pr-1">
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module} className="rounded-lg border border-border p-3 bg-page">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand mb-2">{module}</p>
                  <ul className="space-y-1">
                    {perms.map((p) => (
                      <li key={p} className="text-[12px] text-text-secondary font-mono">{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
