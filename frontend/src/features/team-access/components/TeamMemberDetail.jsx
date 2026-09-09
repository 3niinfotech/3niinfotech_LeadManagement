import { useMemo, useState } from 'react';
import {
  FiBriefcase, FiEdit2, FiHash, FiMapPin, FiPhone, FiSearch, FiShield, FiTrash2, FiUserX, FiCheck,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import PermissionGate from '../../../components/common/PermissionGate';
import RoleBadge from '../../../components/profile/RoleBadge';
import StaffAvatarEditor from './StaffAvatarEditor';
import { DATA_SCOPE_PLAIN } from '../../rbac/config/permissionLabels';
import { getRoleMeta } from '../../../config/roles';
import { PERMISSIONS } from '../../../config/permissions';
import { groupPermissionsByModule } from '../config/teamAccessHelp.config';

function StatusPill({ status }) {
  const tone = status === 'ACTIVE'
    ? 'crm-staff-status--active'
    : status === 'SUSPENDED'
      ? 'crm-staff-status--suspended'
      : 'crm-staff-status--inactive';
  return <span className={`crm-staff-status ${tone}`}>{status}</span>;
}

function fullName(row) {
  return `${row?.firstName || ''} ${row?.lastName || ''}`.trim() || row?.email || 'User';
}

function roleHasMultiBranch(role) {
  const perms = role?.permissions || [];
  return perms.includes('branch.switch') && perms.includes('branch.view_multiple');
}

export default function TeamMemberDetail({
  member,
  roleOptions = [],
  canUpdate,
  canDelete,
  canManageRoles,
  actionBusy,
  onEdit,
  onStatusToggle,
  onDelete,
  onManageRole,
  onRoleChange,
  onAvatarUpdated,
}) {
  const [permSearch, setPermSearch] = useState('');
  const [roleSaving, setRoleSaving] = useState(false);

  const roleMeta = getRoleMeta(member?.role?.slug);
  const permissionGroups = useMemo(
    () => groupPermissionsByModule(member?.role?.permissions || []),
    [member?.role?.permissions],
  );

  const filteredPerms = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return permissionGroups;
    return permissionGroups.filter(([name]) => name.toLowerCase().includes(q));
  }, [permissionGroups, permSearch]);

  const permTotal = member?.role?.permissions?.length || 0;
  const dataScopeLabel = DATA_SCOPE_PLAIN[member?.role?.dataScope]?.label;

  const handleRoleSelect = async (roleId) => {
    if (!roleId || roleId === member?.role?.id || !onRoleChange) return;
    setRoleSaving(true);
    try {
      await onRoleChange(roleId);
    } finally {
      setRoleSaving(false);
    }
  };

  if (!member) return null;

  return (
    <div className="crm-member-detail">
      <div className="crm-member-hero">
        <StaffAvatarEditor
          userId={member.id}
          name={fullName(member)}
          avatar={member.avatar}
          size="2xl"
          canEdit={canUpdate}
          onUpdated={onAvatarUpdated}
        />
        <div className="crm-member-hero__main">
          <h2 className="crm-member-hero__name">{fullName(member)}</h2>
          <p className="crm-member-hero__email">{member.email}</p>
          <div className="crm-member-hero__tags">
            <RoleBadge slug={member.role?.slug} name={member.role?.name} />
            <StatusPill status={member.status} />
            {dataScopeLabel && <span className="crm-staff-tag">{dataScopeLabel}</span>}
            {roleHasMultiBranch(member.role) && (
              <span className="crm-staff-tag crm-staff-tag--success">Multi-branch</span>
            )}
          </div>
        </div>
        <div className="crm-member-hero__actions">
          {canUpdate && (
            <Button size="sm" variant="secondary" icon={FiEdit2} disabled={actionBusy} onClick={onEdit}>
              Edit
            </Button>
          )}
          {canUpdate && (
            <Button
              size="sm"
              variant="secondary"
              icon={member.status === 'ACTIVE' ? FiUserX : FiCheck}
              disabled={actionBusy}
              onClick={onStatusToggle}
            >
              {member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          <PermissionGate permission={PERMISSIONS.USERS_DELETE}>
            <Button size="sm" variant="danger" icon={FiTrash2} disabled={actionBusy} onClick={onDelete}>
              Remove
            </Button>
          </PermissionGate>
        </div>
      </div>

      {member.workload && (
        <div className="crm-member-kpis">
          {[
            { label: 'Enquiries', value: member.workload.enquiries ?? 0 },
            { label: 'Leads', value: member.workload.leads ?? 0 },
            { label: 'Students', value: member.workload.students ?? 0 },
            { label: 'Total', value: member.workload.total ?? 0, accent: true },
          ].map(({ label, value, accent }) => (
            <div key={label} className={`crm-member-kpi ${accent ? 'crm-member-kpi--accent' : ''}`}>
              <span className="crm-member-kpi__value">{value}</span>
              <span className="crm-member-kpi__label">{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="crm-member-cards">
        <div className="crm-member-card">
          <h3 className="crm-member-card__title"><FiShield size={14} /> Role & access</h3>
          <p className="crm-member-card__desc">
            {member.role?.name || '—'}
            {roleMeta.description ? ` · ${roleMeta.description}` : ''}
          </p>
          {canUpdate ? (
            <div className="crm-member-card__field">
              <label className="crm-member-card__label">Change role</label>
              <Select
                value={member.role?.id || ''}
                onChange={(e) => handleRoleSelect(e.target.value)}
                options={roleOptions}
                disabled={roleSaving || actionBusy}
                allowClear={false}
              />
            </div>
          ) : (
            <p className="crm-member-card__meta">{permTotal} permissions enabled</p>
          )}
          {canManageRoles && onManageRole && (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              icon={FiShield}
              onClick={() => onManageRole(member.role?.id)}
            >
              Edit role permissions
            </Button>
          )}
        </div>

        <div className="crm-member-card">
          <h3 className="crm-member-card__title"><FiMapPin size={14} /> Contact & branch</h3>
          <ul className="crm-member-facts">
            <li><FiMapPin size={13} /><span>{member.branch?.name || 'No branch assigned'}</span></li>
            {member.phone && <li><FiPhone size={13} /><span>{member.phone}</span></li>}
            {member.employeeCode && <li><FiHash size={13} /><span>{member.employeeCode}</span></li>}
            {member.department && <li><FiBriefcase size={13} /><span>{member.department}</span></li>}
          </ul>
        </div>
      </div>

      {permissionGroups.length > 0 && (
        <div className="crm-member-access">
          <div className="crm-member-access__head">
            <h3 className="crm-member-access__title">What they can access</h3>
            <div className="crm-member-access__search">
              <FiSearch size={13} />
              <input
                type="search"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Filter modules…"
              />
            </div>
          </div>
          <div className="crm-staff-perm-grid">
            {filteredPerms.map(([module, count]) => (
              <div key={module} className="crm-staff-perm-chip">
                <span className="crm-staff-perm-chip__dot" />
                <span className="crm-staff-perm-chip__name">{module}</span>
                <span className="crm-staff-perm-chip__count">{count}</span>
              </div>
            ))}
            {!filteredPerms.length && (
              <p className="crm-member-access__empty">No modules match your search.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
