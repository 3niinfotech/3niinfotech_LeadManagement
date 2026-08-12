import { useParams, Navigate } from 'react-router-dom';
import { ENQUIRY_PROFILE_TABS } from '../../../config/constants';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionRoute from '../../../components/common/PermissionRoute';
import EnquiryWorkspace from '../components/EnquiryWorkspace';
import { useEnquiryNav } from '../hooks/useEnquiryNav';
import { ROUTES } from '../../../config/routes';

const VALID_TABS = new Set(ENQUIRY_PROFILE_TABS.map((t) => t.id));

export default function EnquiryDetailPage() {
  const { id, tab } = useParams();
  const { setTab } = useEnquiryNav();
  const activeTab = tab && VALID_TABS.has(tab) ? tab : 'overview';

  if (tab && !VALID_TABS.has(tab)) {
    return <Navigate to={ROUTES.ENQUIRY_DETAIL(id)} replace />;
  }

  return (
    <PermissionRoute permission={PERMISSIONS.ENQUIRIES_VIEW}>
      <EnquiryWorkspace
        enquiryId={id}
        mode="view"
        activeTab={activeTab}
        onTabChange={(nextTab) => setTab(id, nextTab)}
      />
    </PermissionRoute>
  );
}
