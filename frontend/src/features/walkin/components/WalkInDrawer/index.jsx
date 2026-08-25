import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';
import { ROUTES } from '../../../../config/routes';
import { PERMISSIONS } from '../../../../config/permissions';
import { usePermissions } from '../../../../hooks/usePermissions';
import { WALKIN_PROFILE_TABS } from '../../config/walkin.constants';
import { useGetWalkInQuery } from '../../redux/walkinApiSlice';
import { useWalkInDrawer } from '../../hooks/useWalkInDrawer';
import WalkInProfileModal from './WalkInProfileModal';
import OverviewTab from './OverviewTab';
import TimelineTab from './TimelineTab';
import NotesTab from './NotesTab';

/**
 * Reception visitor profile — strictly read-only.
 * Editing, status change, counselling and delete never happen here:
 * assignment is done from the list, counselling from the enquiry workspace.
 */
export default function WalkInDrawer() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { drawerOpen, drawerTab, selectedLeadId, closeDrawer, setTab } = useWalkInDrawer();

  const canView = can(PERMISSIONS.WALKIN_VIEW);
  const canOpenEnquiry = can(PERMISSIONS.ENQUIRIES_VIEW);

  const { data: lead, isLoading } = useGetWalkInQuery(selectedLeadId, {
    skip: !selectedLeadId || !canView,
  });

  if (!canView || !selectedLeadId) return null;

  const openEnquiryWorkspace = lead?.enquiry?.id && canOpenEnquiry
    ? () => {
      closeDrawer();
      navigate(ROUTES.ENQUIRY_DETAIL(lead.enquiry.id));
    }
    : undefined;

  return (
    <WalkInProfileModal
      open={drawerOpen}
      onClose={closeDrawer}
      lead={lead}
      tabs={WALKIN_PROFILE_TABS}
      activeTab={drawerTab}
      onTabChange={setTab}
      footer={<Button variant="outline" onClick={closeDrawer}>Close</Button>}
    >
      {isLoading && (
        <div className="crm-walkin-empty-panel">
          <p className="crm-walkin-empty-panel__title">Loading visitor profile…</p>
        </div>
      )}
      {!isLoading && drawerTab === 'overview' && (
        <OverviewTab lead={lead} onOpenEnquiry={openEnquiryWorkspace} />
      )}
      {!isLoading && drawerTab === 'timeline' && <TimelineTab lead={lead} />}
      {!isLoading && drawerTab === 'notes' && <NotesTab notes={lead?.leadNotes} />}
    </WalkInProfileModal>
  );
}
