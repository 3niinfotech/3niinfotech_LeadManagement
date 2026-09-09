import { useParams } from 'react-router-dom';
import { FiHome, FiSettings } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import { resolveMasterPage, buildMasterBreadcrumbs } from '../../../config/master-registry.config';
import CompanySettingsWorkspace from '../../../features/settings/components/CompanySettingsWorkspace';

export default function OrganizationCompanyPage() {
  const { slug } = useParams();
  const resolvedSlug = slug || 'company';
  const hubItem = resolveMasterPage(resolvedSlug)?.hubItem;
  const title = hubItem?.label || 'Company Configuration';
  const Icon = resolvedSlug === 'company' ? FiHome : FiSettings;
  const initialTab = resolvedSlug === 'invoice-config' ? 'invoice' : 'overview';

  return (
    <ModulePageCard
      title={title}
      subtitle={hubItem?.description || 'Site configuration, branding, defaults, and enquiry rules'}
      icon={Icon}
      breadcrumbs={buildMasterBreadcrumbs(hubItem, title)}
    >
      <CompanySettingsWorkspace initialTab={initialTab} />
    </ModulePageCard>
  );
}
