import { useMemo, useState } from 'react';
import {
  FiBriefcase, FiEdit2, FiHash, FiMapPin, FiPhone, FiSearch, FiShield, FiTrash2,
  FiUserX, FiCheck, FiInbox, FiTrendingUp, FiBookOpen, FiLayers, FiMail,
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
  const isAct = status === 'ACTIVE';
  const isSusp = status === 'SUSPENDED';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase ${
        isAct
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
          : isSusp
            ? 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-500' : isSusp ? 'bg-amber-500' : 'bg-slate-400'}`} />
      {status}
    </span>
  );
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

  const effectiveRoleOptions = useMemo(() => {
    if (!member?.role?.id) return roleOptions;
    const exists = roleOptions.some((r) => r.value === member.role.id);
    if (exists) return roleOptions;
    return [
      {
        value: member.role.id,
        label: member.role.name || 'Current Role',
        slug: member.role.slug,
        description: member.role.description || '',
      },
      ...roleOptions,
    ];
  }, [roleOptions, member?.role]);

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
      {/* ── Top Hero Profile Card ── */}
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
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="crm-member-hero__name">{fullName(member)}</h2>
            <StatusPill status={member.status} />
          </div>
          <p className="crm-member-hero__email flex items-center gap-1.5 mt-0.5">
            <FiMail size={12} className="text-slate-400" />
            <span>{member.email}</span>
          </p>

          <div className="crm-member-hero__tags">
            <RoleBadge slug={member.role?.slug} name={member.role?.name} />
            {dataScopeLabel && (
              <span className="crm-staff-tag">{dataScopeLabel}</span>
            )}
            {roleHasMultiBranch(member.role) && (
              <span className="crm-staff-tag crm-staff-tag--success">Multi-branch</span>
            )}
          </div>
        </div>

        {/* Action Buttons: Unified 36px height & theme styling */}
        <div className="crm-member-hero__actions">
          {canUpdate && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={onEdit}
              className="crm-hero-action-btn crm-hero-action-btn--edit"
              title="Edit staff details"
            >
              <FiEdit2 size={13} />
              <span>Edit</span>
            </button>
          )}

          {canUpdate && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={onStatusToggle}
              className={`crm-hero-action-btn ${member.status === 'ACTIVE' ? 'crm-hero-action-btn--deactivate' : 'crm-hero-action-btn--activate'}`}
              title={member.status === 'ACTIVE' ? 'Deactivate user' : 'Activate user'}
            >
              {member.status === 'ACTIVE' ? <FiUserX size={13} /> : <FiCheck size={13} />}
              <span>{member.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
            </button>
          )}

          <PermissionGate permission={PERMISSIONS.USERS_DELETE}>
            <button
              type="button"
              disabled={actionBusy}
              onClick={onDelete}
              className="crm-hero-action-btn crm-hero-action-btn--danger"
              title="Remove staff member"
            >
              <FiTrash2 size={13} />
              <span>Remove</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* ── Workload Stat KPI Cards ── */}
      {member.workload && (
        <div className="crm-member-kpi-grid">
          {[
            {
              label: 'Enquiries',
              value: member.workload.enquiries ?? 0,
              subtext: 'Assigned',
              icon: FiInbox,
              theme: 'crm-member-kpi-box--sky',
            },
            {
              label: 'Active Leads',
              value: member.workload.leads ?? 0,
              subtext: 'Pipeline',
              icon: FiTrendingUp,
              theme: 'crm-member-kpi-box--emerald',
            },
            {
              label: 'Students',
              value: member.workload.students ?? 0,
              subtext: 'Enrolled',
              icon: FiBookOpen,
              theme: 'crm-member-kpi-box--indigo',
            },
            {
              label: 'Total Workload',
              value: member.workload.total ?? 0,
              subtext: 'Cumulative',
              icon: FiLayers,
              accent: true,
              theme: 'crm-member-kpi-box--brand',
            },
          ].map(({ label, value, subtext, icon: Icon, accent, theme }) => (
            <div key={label} className={`crm-member-kpi-box ${accent ? 'crm-member-kpi-box--accent' : ''} ${theme}`}>
              <div className="crm-member-kpi-box__icon">
                <Icon size={19} />
              </div>
              <div className="crm-member-kpi-box__details">
                <div className="crm-member-kpi-box__value-row">
                  <span className="crm-member-kpi-box__value">{value}</span>
                  <span className="crm-member-kpi-box__sub">{subtext}</span>
                </div>
                <span className="crm-member-kpi-box__label">{label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Two Columns: Role & Access + Organization & Contact ── */}
      <div className="crm-member-info-grid">
        {/* Role & Access Card */}
        <div className="crm-member-section-card">
          <div className="crm-member-section-card__head">
            <div className="crm-member-section-card__head-icon crm-member-section-card__head-icon--brand">
              <FiShield size={16} />
            </div>
            <div>
              <h3 className="crm-member-section-card__title">Role & Access</h3>
              <p className="crm-member-section-card__subtitle">Permission scope & module visibility</p>
            </div>
          </div>
          <div className="crm-member-section-card__body">
            <div className="crm-member-role-desc-box">
              <span className="crm-member-role-name">{member.role?.name || '—'}</span>
              <p className="crm-member-role-desc">
                {member.role?.description || roleMeta.description || 'Custom assigned role'}
              </p>
            </div>

            {canUpdate ? (
              <div className="crm-member-field-group">
                <label className="crm-member-field-label">Assigned Role</label>
                <Select
                  value={member.role?.id || ''}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  options={effectiveRoleOptions}
                  disabled={roleSaving || actionBusy}
                  allowClear={false}
                />
              </div>
            ) : (
              <p className="crm-member-perm-count">{permTotal} permissions active</p>
            )}

            {canManageRoles && onManageRole && (
              <button
                type="button"
                className="crm-member-manage-role-btn"
                onClick={() => onManageRole(member.role?.id)}
              >
                <FiShield size={13} />
                <span>Manage Role Permissions</span>
              </button>
            )}
          </div>
        </div>

        {/* Contact & Branch Card */}
        <div className="crm-member-section-card">
          <div className="crm-member-section-card__head">
            <div className="crm-member-section-card__head-icon crm-member-section-card__head-icon--slate">
              <FiMapPin size={16} />
            </div>
            <div>
              <h3 className="crm-member-section-card__title">Organization & Contact</h3>
              <p className="crm-member-section-card__subtitle">Location and staff profile details</p>
            </div>
          </div>
          <div className="crm-member-section-card__body">
            <div className="crm-member-facts-list">
              <div className="crm-member-fact-row">
                <div className="crm-member-fact-icon">
                  <FiMapPin size={14} />
                </div>
                <div className="crm-member-fact-meta">
                  <span className="crm-member-fact-label">Campus / Branch</span>
                  <span className="crm-member-fact-val">{member.branch?.name || 'No branch assigned'}</span>
                </div>
              </div>

              <div className="crm-member-fact-row">
                <div className="crm-member-fact-icon">
                  <FiPhone size={14} />
                </div>
                <div className="crm-member-fact-meta">
                  <span className="crm-member-fact-label">Phone</span>
                  <span className="crm-member-fact-val">{member.phone || 'Not provided'}</span>
                </div>
              </div>

              <div className="crm-member-fact-row">
                <div className="crm-member-fact-icon">
                  <FiHash size={14} />
                </div>
                <div className="crm-member-fact-meta">
                  <span className="crm-member-fact-label">Employee Code</span>
                  <span className="crm-member-fact-val">{member.employeeCode || '—'}</span>
                </div>
              </div>

              <div className="crm-member-fact-row">
                <div className="crm-member-fact-icon">
                  <FiBriefcase size={14} />
                </div>
                <div className="crm-member-fact-meta">
                  <span className="crm-member-fact-label">Department</span>
                  <span className="crm-member-fact-val">{member.department || 'General Administration'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── What They Can Access Section ── */}
      {permissionGroups.length > 0 && (
        <div className="crm-member-access-section">
          <div className="crm-member-access-section__head">
            <div className="flex items-center gap-2">
              <h3 className="crm-member-access-section__title">What they can access</h3>
              <span className="crm-member-access-badge">{permissionGroups.length} modules</span>
            </div>
            <div className="crm-member-access-search">
              <FiSearch size={13} className="crm-member-access-search__icon" />
              <input
                type="search"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                placeholder="Filter modules…"
                className="crm-member-access-search__input"
              />
            </div>
          </div>

          <div className="crm-member-access-grid">
            {filteredPerms.map(([module, count]) => (
              <div key={module} className="crm-member-access-chip">
                <span className="crm-member-access-chip__dot" />
                <span className="crm-member-access-chip__name">{module}</span>
                <span className="crm-member-access-chip__count">{count}</span>
              </div>
            ))}
            {!filteredPerms.length && (
              <p className="crm-member-access-empty">No modules match "{permSearch}".</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
