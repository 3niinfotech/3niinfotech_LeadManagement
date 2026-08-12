import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../../components/ui/Button';
import { ROUTES } from '../../../../config/routes';
import { WALKIN_PROFILE_TABS } from '../../config/walkin.constants';
import {
  useGetWalkInQuery,
} from '../../redux/walkinApiSlice';
import { useStartSessionMutation } from '../../../assignment/redux/assignmentApiSlice';
import { useWalkInDrawer } from '../../hooks/useWalkInDrawer';
import toastService from '../../../../services/toast/toast.service';
import WalkInProfileModal from './WalkInProfileModal';
import OverviewTab from './OverviewTab';
import CounsellorDecisionPanel from './CounsellorDecisionPanel';
import TimelineTab from './TimelineTab';
import NotesTab from './NotesTab';
import PlaceholderTab, { ActivityTab, CommunicationTab, TasksTab } from './ProfilePlaceholderTab';
import { FiFileText, FiCalendar, FiShield, FiRotateCcw } from 'react-icons/fi';

export default function WalkInDrawer() {
  const navigate = useNavigate();
  const { drawerOpen, drawerTab, selectedLeadId, isEditMode, closeDrawer, setTab } = useWalkInDrawer();
  const { data: lead, refetch } = useGetWalkInQuery(selectedLeadId, { skip: !selectedLeadId });
  const [startSession, { isLoading: updatingStatus }] = useStartSessionMutation();

  const visibleTabs = useMemo(
    () => WALKIN_PROFILE_TABS.filter((t) => !t.editOnly || isEditMode),
    [isEditMode],
  );

  const name = lead ? `${lead.firstName} ${lead.lastName || ''}`.trim() : '';
  const title = isEditMode ? 'Lead Profile' : '';
  const subtitle = isEditMode
    ? `${lead?.leadCode || ''} · Token ${lead?.tokenNumber || ''} · ${name}`.trim()
    : '';

  const startCounselling = async () => {
    if (!selectedLeadId) return;
    try {
      await startSession(selectedLeadId).unwrap();
      toastService.success('Counselling started — record your decision below');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not start counselling session');
    }
  };

  const handleDecisionComplete = (result) => {
    refetch();
    const enquiryId = result?.enquiry?.id;
    if (enquiryId) {
      closeDrawer();
      navigate(ROUTES.ENQUIRY_DETAIL(enquiryId));
    }
  };

  const openEnquiryWorkspace = () => {
    if (!lead?.enquiry?.id) return;
    closeDrawer();
    navigate(ROUTES.ENQUIRY_DETAIL(lead.enquiry.id));
  };

  if (!isEditMode) return null;

  return (
    <WalkInProfileModal
      open={drawerOpen}
      onClose={closeDrawer}
      title={title}
      subtitle={subtitle}
      lead={lead}
      tabs={visibleTabs}
      activeTab={drawerTab}
      onTabChange={setTab}
      footer={(
        <>
          <Button variant="outline" onClick={closeDrawer}>Close</Button>
          {lead?.enquiry?.id && (
            <Button onClick={openEnquiryWorkspace}>Open Enquiry Workspace</Button>
          )}
          {lead?.status === 'WAITING' && lead?.assignedToId && !lead?.enquiry?.id && (
            <Button onClick={startCounselling} loading={updatingStatus}>
              Start Counselling
            </Button>
          )}
        </>
      )}
    >
      {drawerTab === 'overview' && (
        <>
          <CounsellorDecisionPanel
            leadId={selectedLeadId}
            lead={lead}
            onDecisionComplete={handleDecisionComplete}
          />
          <OverviewTab lead={lead} />
        </>
      )}
      {drawerTab === 'timeline' && <TimelineTab lead={lead} />}
      {drawerTab === 'notes' && (
        <NotesTab leadId={selectedLeadId} notes={lead?.leadNotes} onRefresh={refetch} />
      )}
      {drawerTab === 'activity' && <ActivityTab lead={lead} />}
      {drawerTab === 'communication' && <CommunicationTab />}
      {drawerTab === 'documents' && (
        <PlaceholderTab icon={FiFileText} title="Documents" description="Visitor documents and ID proofs will be collected here after counselling begins." />
      )}
      {drawerTab === 'appointments' && (
        <PlaceholderTab icon={FiCalendar} title="Appointments" description="Schedule and manage counsellor appointments for this visitor." />
      )}
      {drawerTab === 'history' && (
        <PlaceholderTab icon={FiRotateCcw} title="History" description="Full change history for this lead profile across the student journey." />
      )}
      {drawerTab === 'audit' && (
        <PlaceholderTab icon={FiShield} title="Audit Logs" description="Enterprise audit trail — who changed what and when." />
      )}
      {drawerTab === 'tasks' && <TasksTab />}
    </WalkInProfileModal>
  );
}
