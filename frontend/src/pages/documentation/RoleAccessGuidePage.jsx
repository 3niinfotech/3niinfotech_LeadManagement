import { FiBookOpen, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ModulePageCard from '../../components/layout/ModulePageLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ROLE_ACCESS_GUIDE, ACCESS_HOWTO } from '../../config/access-policy';
import { ROUTES } from '../../config/routes';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../config/permissions';

/**
 * Notepad-style role access documentation for Admins.
 */
export default function RoleAccessGuidePage() {
  const { can, isAdmin } = usePermissions();
  const canOpenAdvanced = isAdmin || can(PERMISSIONS.ROLES_UPDATE);

  return (
    <ModulePageCard>
      <div className="mx-auto max-w-4xl p-4 md:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-text-muted text-xs font-semibold uppercase tracking-wide">
              <FiBookOpen size={14} /> Access notepad
            </div>
            <h1 className="text-2xl font-semibold text-text-primary mt-1">
              Role access guide
            </h1>
            <p className="text-sm text-text-secondary mt-2 max-w-2xl">
              Short reference for every role: screens, buttons, and data scope.
              Live changes: Masters → Advanced Access (Admin only).
            </p>
          </div>
          {canOpenAdvanced && (
            <Link to={ROUTES.ADVANCED_ACCESS}>
              <Button variant="primary" size="sm" icon={FiShield}>
                Open Advanced Access
              </Button>
            </Link>
          )}
        </div>

        <Card className="p-4 border-dashed">
          <h2 className="text-sm font-semibold text-text-primary mb-2">How permissions work</h2>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-text-secondary">
            {ACCESS_HOWTO.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-text-muted">
            Permission = button / menu visibility. Data scope = which rows appear in lists
            (OWN = assigned records only, BRANCH = branch, COMPANY = company, GLOBAL = platform).
          </p>
        </Card>

        <div className="space-y-3">
          {ROLE_ACCESS_GUIDE.map((role) => (
            <Card key={role.slug} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2 mb-3">
                <h3 className="text-base font-semibold text-text-primary">{role.name}</h3>
                <span className="text-[11px] font-mono text-text-muted">
                  {role.slug} · scope {role.dataScope}
                </span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">Shows</dt>
                  <dd className="text-text-secondary mt-0.5">{role.sees}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">Hides</dt>
                  <dd className="text-text-secondary mt-0.5">{role.hides}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">Buttons</dt>
                  <dd className="text-text-secondary mt-0.5">{role.buttons}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">Notes</dt>
                  <dd className="text-text-secondary mt-0.5">{role.notes}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      </div>
    </ModulePageCard>
  );
}
