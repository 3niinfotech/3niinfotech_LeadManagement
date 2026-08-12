import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import {
  FiSave, FiCheckSquare, FiDollarSign, FiBriefcase, FiGlobe,
} from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import { ENQUIRY_PROFILE_TABS, ENQUIRY_CREATE_FORM_TABS } from '../../../../config/constants';
import { enquiryFormSchema } from '../../schemas/enquirySchema';
import {
  useGetEnquiryQuery,
  useCreateEnquiryMutation,
  useUpdateEnquiryMutation,
  useAddFollowupMutation,
  useAddAppointmentMutation,
  useConvertEnquiryMutation,
} from '../../redux/enquiryApiSlice';
import { selectUser } from '../../../../redux/slices/authSlice';
import toastService from '../../../../services/toast/toast.service';
import EnquiryFormModal from './EnquiryFormModal';
import OverviewTab from './OverviewTab';
import PersonalDetailsTab from './PersonalDetailsTab';
import OtherDetailsTab from './OtherDetailsTab';
import FollowUpActionsPanel from './FollowUpActionsPanel';
import AppointmentFormTab from './AppointmentFormTab';
import FollowUpTab from './FollowUpTab';
import ConversionTab from './ConversionTab';
import DocumentsTab from './DocumentsTab';
import CommunicationTab from './CommunicationTab';
import TimelineTab from './TimelineTab';
import NotesTab from './NotesTab';
import HistoryTab from './HistoryTab';
import AuditLogsTab from './AuditLogsTab';
import DemoTab from './DemoTab';
import ProfilePlaceholderTab from './ProfilePlaceholderTab';
import DuplicateFoundModal from './DuplicateFoundModal';
import QuickActionsFab from './QuickActionsFab';
import EnquiryAnalyticsSidebar from './EnquiryAnalyticsSidebar';
import WorkspaceQuickNav from './WorkspaceQuickNav';
import { useEnquiryDrawer } from '../../hooks/useEnquiryDrawer';
import { useDuplicateDetection } from '../../hooks/useDuplicateDetection';
import { buildTabErrorMap, combineDateAndTime, mapEnquiryToFormValues } from '../../utils/enquiryForm.utils';

const defaultValues = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  mobileCountry: '+91',
  alternateNo: '',
  passportNo: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  maritalStatus: '',
  address: '',
  highestQual: '',
  interestedCourse: '',
  interestedCountry: '',
  intake: '',
  applyLevel: '',
  source: '',
  otherReference: '',
  remark: '',
  testsGiven: [],
  status: 'NEW',
  priority: 'MEDIUM',
  tags: [],
  followUpDate: '',
  followUpTime: '',
  followUpRemarks: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentRemarks: '',
};

const CREATE_FORM_TAB_IDS = new Set(['personal', 'other', 'followup', 'appointment']);
const EDIT_FORM_TAB_IDS = new Set(['overview']);

function stripFormExtras(data) {
  const {
    followUpDate,
    followUpTime,
    followUpRemarks,
    appointmentDate,
    appointmentTime,
    appointmentRemarks,
    ...payload
  } = data;
  return {
    payload,
    followUp: { followUpDate, followUpTime, followUpRemarks },
    appointment: { appointmentDate, appointmentTime, appointmentRemarks },
  };
}

export default function EnquiryDrawer() {
  const user = useSelector(selectUser);
  const { drawerOpen, drawerTab, selectedEnquiryId, isEditMode, closeDrawer, setTab, openDrawer } = useEnquiryDrawer();
  const { data: enquiry, refetch } = useGetEnquiryQuery(selectedEnquiryId, { skip: !selectedEnquiryId });
  const [createEnquiry, { isLoading: creating }] = useCreateEnquiryMutation();
  const [updateEnquiry, { isLoading: updating }] = useUpdateEnquiryMutation();
  const [addFollowup] = useAddFollowupMutation();
  const [addAppointment] = useAddAppointmentMutation();
  const [convertEnquiry, { isLoading: converting }] = useConvertEnquiryMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const watchedEmail = useWatch({ control, name: 'email' });
  const watchedMobile = useWatch({ control, name: 'mobile' });
  const watchedAlternate = useWatch({ control, name: 'alternateNo' });
  const watchedPassport = useWatch({ control, name: 'passportNo' });

  const {
    matches: duplicateMatches,
    modalOpen: duplicateModalOpen,
    dismissModal: dismissDuplicateModal,
  } = useDuplicateDetection({
    email: watchedEmail,
    mobile: watchedMobile,
    alternateNo: watchedAlternate,
    passportNo: watchedPassport,
    excludeId: isEditMode ? selectedEnquiryId : undefined,
    enabled: drawerOpen,
  });

  useEffect(() => {
    if (!drawerOpen) return;
    if (enquiry && isEditMode) {
      reset(mapEnquiryToFormValues(enquiry, defaultValues));
    } else if (!isEditMode) {
      reset({ ...defaultValues, branchId: user?.branchId });
    }
  }, [drawerOpen, enquiry, isEditMode, reset, user?.branchId]);

  const visibleTabs = useMemo(
    () => (isEditMode
      ? ENQUIRY_PROFILE_TABS.filter((t) => !t.editOnly || isEditMode)
      : ENQUIRY_CREATE_FORM_TABS),
    [isEditMode],
  );

  const tabErrors = useMemo(() => buildTabErrorMap(errors), [errors]);

  const saveFollowUpOnCreate = async (enquiryId, followUp) => {
    if (followUp.followUpRemarks?.trim()) {
      await addFollowup({
        id: enquiryId,
        remark: followUp.followUpRemarks.trim(),
        stage: 'CALL',
        nextDate: combineDateAndTime(followUp.followUpDate, followUp.followUpTime),
      }).unwrap();
    }
  };

  const saveAppointmentOnCreate = async (enquiryId, appointment) => {
    const startAt = combineDateAndTime(appointment.appointmentDate, appointment.appointmentTime);
    if (!startAt) return;
    await addAppointment({
      id: enquiryId,
      startAt,
      remark: appointment.appointmentRemarks?.trim() || undefined,
      title: 'Counselling',
      mode: 'OFFLINE',
      room: 'Main Office',
    }).unwrap();
  };

  const handleConvert = async () => {
    if (!selectedEnquiryId) return;
    try {
      const payload = await convertEnquiry(selectedEnquiryId).unwrap();
      const body = payload?.data ?? payload;
      const linked = body?.linkedExisting;
      toastService.action.saved(
        linked ? 'Linked to existing student — same record' : 'Converted to student — same record',
      );
      refetch();
    } catch (err) {
      toastService.error(err?.data?.message || 'Conversion failed');
    }
  };

  const onSubmit = async (data) => {
    try {
      const { payload, followUp, appointment } = stripFormExtras(data);
      const body = {
        ...payload,
        branchId: payload.branchId || user?.branchId,
        testsGiven: (payload.testsGiven || []).filter((t) => t?.name?.trim()),
      };
      const hasFollowUp = Boolean(followUp.followUpRemarks?.trim());
      const hasAppointment = Boolean(appointment.appointmentDate);

      if (isEditMode) {
        await updateEnquiry({ id: selectedEnquiryId, ...body }).unwrap();
        toastService.action.saved('Enquiry updated');
      } else {
        const created = await createEnquiry(body).unwrap();
        const newId = created?.data?.id ?? created?.id;
        if (newId && hasFollowUp) {
          await saveFollowUpOnCreate(newId, followUp);
        }
        if (newId && hasAppointment) {
          await saveAppointmentOnCreate(newId, appointment);
        }
        toastService.action.saved('Enquiry created');
      }
      closeDrawer();
    } catch (err) {
      toastService.error(err?.data?.message || 'Failed to save enquiry');
    }
  };

  const [analyticsHighlight, setAnalyticsHighlight] = useState(false);

  const handleWorkspaceNavigate = useCallback((area) => {
    if (area.action === 'analytics') {
      setAnalyticsHighlight(true);
      window.setTimeout(() => setAnalyticsHighlight(false), 1600);
      return;
    }
    if (area.tab) setTab(area.tab);
  }, [setTab]);

  const title = isEditMode ? 'Lead Workspace' : 'Add Enquiry';
  const subtitle = isEditMode
    ? (enquiry?.enquiryCode
      ? `${enquiry.enquiryCode} · ${enquiry.firstName} ${enquiry.lastName || ''}`.trim()
      : 'Everything for this lead — details, outreach, follow-up, conversion, and analytics.')
    : 'Capture lead details and schedule follow-ups in one place.';
  const saving = creating || updating;
  const formTabIds = isEditMode ? EDIT_FORM_TAB_IDS : CREATE_FORM_TAB_IDS;
  const showFormFooter = formTabIds.has(drawerTab);

  return (
    <>
    <EnquiryFormModal
      open={drawerOpen}
      onClose={closeDrawer}
      title={title}
      subtitle={subtitle}
      tabs={visibleTabs}
      activeTab={drawerTab}
      onTabChange={setTab}
      tabErrors={tabErrors}
      useFormTabs={!isEditMode}
      floatingActions={isEditMode ? (
        <QuickActionsFab
          enquiry={enquiry}
          enquiryId={selectedEnquiryId}
          onTabChange={setTab}
          onLogged={refetch}
          onConvert={handleConvert}
          hasFooter={showFormFooter}
        />
      ) : null}
      sidebar={isEditMode ? (
        <EnquiryAnalyticsSidebar enquiry={enquiry} highlighted={analyticsHighlight} />
      ) : null}
      workspaceNav={isEditMode ? (
        <WorkspaceQuickNav
          activeTab={drawerTab}
          analyticsActive={analyticsHighlight}
          onNavigate={handleWorkspaceNavigate}
        />
      ) : null}
      footer={showFormFooter ? (
        <>
          <Button variant="outline" onClick={closeDrawer}>Close</Button>
          <Button
            icon={FiSave}
            onClick={handleSubmit(onSubmit)}
            loading={saving}
          >
            Save Enquiry
          </Button>
        </>
      ) : null}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="h-full">
        {isEditMode && drawerTab === 'overview' && (
          <OverviewTab
            register={register}
            control={control}
            errors={errors}
            enquiryId={selectedEnquiryId}
            enquiry={enquiry}
            isEditMode={isEditMode}
            onFollowUpLogged={refetch}
            onNavigateTab={setTab}
          />
        )}
        {!isEditMode && drawerTab === 'personal' && (
          <PersonalDetailsTab register={register} control={control} errors={errors} />
        )}
        {!isEditMode && drawerTab === 'other' && (
          <OtherDetailsTab register={register} control={control} errors={errors} variant="enquiry" />
        )}
        {!isEditMode && drawerTab === 'followup' && (
          <FollowUpActionsPanel
            enquiryId={selectedEnquiryId}
            enquiry={enquiry}
            isEditMode={false}
            register={register}
            control={control}
            errors={errors}
            onLogged={refetch}
          />
        )}
        {!isEditMode && drawerTab === 'appointment' && (
          <AppointmentFormTab
            register={register}
            control={control}
            errors={errors}
            enquiry={enquiry}
            isEditMode={false}
          />
        )}
        {drawerTab === 'followup' && isEditMode && (
          <FollowUpTab
            register={register}
            control={control}
            errors={errors}
            enquiryId={selectedEnquiryId}
            enquiry={enquiry}
            isEditMode={isEditMode}
            onFollowUpLogged={refetch}
            onAppointmentBooked={refetch}
          />
        )}
        {drawerTab === 'conversion' && isEditMode && (
          <ConversionTab
            enquiry={enquiry}
            onConvert={handleConvert}
            converting={converting}
          />
        )}
        {drawerTab === 'timeline' && isEditMode && (
          <TimelineTab enquiryId={selectedEnquiryId} enquiry={enquiry} />
        )}
        {drawerTab === 'notes' && isEditMode && (
          <NotesTab enquiryId={selectedEnquiryId} notes={enquiry?.notes} onRefresh={refetch} />
        )}
        {drawerTab === 'tasks' && isEditMode && (
          <ProfilePlaceholderTab
            icon={FiCheckSquare}
            title="Tasks"
            description="Assign and track counsellor tasks for this enquiry. Task management will be available in the next release."
          />
        )}
        {drawerTab === 'documents' && isEditMode && (
          <DocumentsTab enquiryId={selectedEnquiryId} documents={enquiry?.documents} onRefresh={refetch} />
        )}
        {drawerTab === 'communication' && isEditMode && (
          <CommunicationTab
            enquiryId={selectedEnquiryId}
            enquiry={enquiry}
            isEditMode={isEditMode}
            onLogged={refetch}
          />
        )}
        {drawerTab === 'demo' && isEditMode && (
          <DemoTab
            enquiryId={selectedEnquiryId}
            enquiry={enquiry}
            isEditMode={isEditMode}
            onRecorded={refetch}
          />
        )}
        {drawerTab === 'fees' && isEditMode && (
          <ProfilePlaceholderTab
            icon={FiDollarSign}
            title="Fees"
            description="Fee quotations, payments, and instalment tracking will appear here once linked to the finance module."
          />
        )}
        {drawerTab === 'application' && isEditMode && (
          <ProfilePlaceholderTab
            icon={FiBriefcase}
            title="Application"
            description="University application stages and document checklist for this student journey."
          />
        )}
        {drawerTab === 'visa' && isEditMode && (
          <ProfilePlaceholderTab
            icon={FiGlobe}
            title="Visa"
            description="Visa filing status and embassy updates will be tracked here after conversion."
          />
        )}
        {drawerTab === 'history' && isEditMode && (
          <HistoryTab enquiry={enquiry} />
        )}
        {drawerTab === 'audit' && isEditMode && (
          <AuditLogsTab enquiry={enquiry} />
        )}
      </form>
    </EnquiryFormModal>
    <DuplicateFoundModal
      open={duplicateModalOpen}
      matches={duplicateMatches}
      onClose={dismissDuplicateModal}
      onViewRecord={(match) => {
        dismissDuplicateModal();
        openDrawer(match.id);
      }}
    />
    </>
  );
}
