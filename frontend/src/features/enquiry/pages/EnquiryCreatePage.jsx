import { useParams, Navigate } from 'react-router-dom';
import { ENQUIRY_CREATE_FORM_TABS } from '../../../config/constants';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionRoute from '../../../components/common/PermissionRoute';
import EnquiryWorkspace from '../components/EnquiryWorkspace';
import { useEnquiryNav } from '../hooks/useEnquiryNav';
import { ROUTES } from '../../../config/routes';

const VALID_TABS = new Set(ENQUIRY_CREATE_FORM_TABS.map((t) => t.id));

export default function EnquiryCreatePage() {
  const { tab } = useParams();
  const { setCreateTab } = useEnquiryNav();
  const activeTab = tab && VALID_TABS.has(tab) ? tab : 'personal';

  if (tab && !VALID_TABS.has(tab)) {
    return <Navigate to={ROUTES.ENQUIRY_CREATE} replace />;
  }

  return (
    <PermissionRoute permission={PERMISSIONS.ENQUIRIES_CREATE}>
      <EnquiryWorkspace
        mode="create"
        activeTab={activeTab}
        onTabChange={setCreateTab}
      />
    </PermissionRoute>
  );
}
