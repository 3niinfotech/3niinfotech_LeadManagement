import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import { FiSave, FiInbox } from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import ContentLoader from '../../../../components/ui/ContentLoader';
import { ENQUIRY_PROFILE_TABS, ENQUIRY_CREATE_FORM_TABS } from '../../../../config/constants';
import { buildEnquiryFormSchema } from '../../schemas/enquirySchema';
import {
  useGetEnquiryQuery,
  useCreateEnquiryMutation,
  useUpdateEnquiryMutation,
  useAddFollowupMutation,
  useAddAppointmentMutation,
  useConvertEnquiryMutation,
} from '../../redux/enquiryApiSlice';
import { selectUser } from '../../../../redux/slices/authSlice';
import { useCompanyRuntime } from '../../../organization/CompanyRuntime';
import { suggestedFollowupFromSettings } from '../../../../config/company-settings.config';
import toastService from '../../../../services/toast/toast.service';
import EnquiryWorkspaceLayout from './EnquiryWorkspaceLayout';
import OverviewTab from '../EnquiryDrawer/OverviewTab';
import PersonalDetailsTab from '../EnquiryDrawer/PersonalDetailsTab';
import OtherDetailsTab from '../EnquiryDrawer/OtherDetailsTab';
import FollowUpActionsPanel from '../EnquiryDrawer/FollowUpActionsPanel';
import AppointmentFormTab from '../EnquiryDrawer/AppointmentFormTab';
import FollowUpTab from '../EnquiryDrawer/FollowUpTab';
import ConversionTab from '../EnquiryDrawer/ConversionTab';
import DemoTab from '../EnquiryDrawer/DemoTab';
import DocumentsTab from '../EnquiryDrawer/DocumentsTab';
import CommunicationTab from '../EnquiryDrawer/CommunicationTab';
import TimelineTab from '../EnquiryDrawer/TimelineTab';
import NotesTab from '../EnquiryDrawer/NotesTab';
import DuplicateFoundModal from '../EnquiryDrawer/DuplicateFoundModal';
import EnquiryQuickActionsBar from './EnquiryQuickActionsBar';
import { useDuplicateDetection } from '../../hooks/useDuplicateDetection';
import { useEnquiryNav } from '../../hooks/useEnquiryNav';
import { buildTabErrorMap, combineDateAndTime, mapEnquiryToFormValues } from '../../utils/enquiryForm.utils';
import { ROUTES } from '../../../../config/routes';
import '../../styles/enquiry-workspace.css';

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
  assignedToId: '',
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

const VALID_TABS = new Set([
  ...ENQUIRY_PROFILE_TABS.map((t) => t.id),
  ...ENQUIRY_CREATE_FORM_TABS.map((t) => t.id),
]);

export default function EnquiryWorkspace({
  enquiryId,
  mode = 'view',
  activeTab: activeTabProp = 'overview',
  onTabChange,
}) {
  const user = useSelector(selectUser);
  const { settings } = useCompanyRuntime();
  const enquirySchema = useMemo(
    () => buildEnquiryFormSchema(settings?.mandatoryFields),
    [settings?.mandatoryFields],
  );
  const formDefaults = useMemo(() => ({
    ...defaultValues,
    mobileCountry: settings?.defaultMobileCode || defaultValues.mobileCountry,
    nationality: settings?.defaultNationality || '',
    ...suggestedFollowupFromSettings(settings),
  }), [settings]);
  const { openEnquiry, backToList, openStudent } = useEnquiryNav();
  const isEditMode = mode !== 'create';
  const activeTab = VALID_TABS.has(activeTabProp) ? activeTabProp : 'overview';

  const { data: enquiry, refetch, isLoading } = useGetEnquiryQuery(enquiryId, {
    skip: !enquiryId || mode === 'create',
  });
  const [createEnquiry, { isLoading: creating }] = useCreateEnquiryMutation();
  const [updateEnquiry, { isLoading: updating }] = useUpdateEnquiryMutation();
  const [addFollowup] = useAddFollowupMutation();
  const [addAppointment] = useAddAppointmentMutation();
  const [convertEnquiry, { isLoading: converting }] = useConvertEnquiryMutation();

  const isConverted = enquiry?.status === 'CONVERTED' || Boolean(enquiry?.studentId);
  const readOnly = isEditMode && isConverted;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(enquirySchema),
    defaultValues: formDefaults,
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
    duplicateAcknowledged,
  } = useDuplicateDetection({
    email: watchedEmail,
    mobile: watchedMobile,
    alternateNo: watchedAlternate,
    passportNo: watchedPassport,
    excludeId: isEditMode ? enquiryId : undefined,
    enabled: !readOnly,
  });

  useEffect(() => {
    if (enquiry && isEditMode) {
      reset(mapEnquiryToFormValues(enquiry, formDefaults));
    } else if (!isEditMode) {
      reset({ ...formDefaults, branchId: user?.branchId });
      if (settings?.followupPopup && onTabChange) onTabChange('followup');
    }
  }, [enquiry, isEditMode, reset, user?.branchId, formDefaults, settings?.followupPopup, onTabChange]);

  const visibleTabs = useMemo(
    () => {
      const tabs = isEditMode
        ? ENQUIRY_PROFILE_TABS.filter((t) => !t.editOnly || isEditMode)
        : ENQUIRY_CREATE_FORM_TABS;
      if (isConverted) {
        return tabs.filter((t) => t.id !== 'conversion');
      }
      return tabs;
    },
    [isEditMode, isConverted],
  );

  useEffect(() => {
    if (isConverted && activeTab === 'conversion') {
      onTabChange?.('overview');
    }
  }, [isConverted, activeTab, onTabChange]);

  const tabErrors = useMemo(() => buildTabErrorMap(errors), [errors]);

  const saveFollowUpOnCreate = async (newId, followUp) => {
    if (followUp.followUpRemarks?.trim()) {
      await addFollowup({
        id: newId,
        remark: followUp.followUpRemarks.trim(),
        stage: 'CALL',
        nextDate: combineDateAndTime(followUp.followUpDate, followUp.followUpTime),
      }).unwrap();
    }
  };

  const saveAppointmentOnCreate = async (newId, appointment) => {
    const startAt = combineDateAndTime(appointment.appointmentDate, appointment.appointmentTime);
    if (!startAt) return;
    await addAppointment({
      id: newId,
      startAt,
      remark: appointment.appointmentRemarks?.trim() || undefined,
      title: 'Counselling',
      mode: 'OFFLINE',
      room: 'Main Office',
    }).unwrap();
  };

  const handleConvert = async () => {
    if (!enquiryId) return;
    try {
      const payload = await convertEnquiry(enquiryId).unwrap();
      const body = payload?.data ?? payload;
      const studentId = body?.student?.id ?? body?.enquiry?.studentId;
      const linked = body?.linkedExisting;
      const already = body?.alreadyConverted;
      toastService.success(
        already
          ? `Already converted · ${body?.student?.studentCode || ''}`
          : linked
            ? 'Linked to existing student — history preserved'
            : `Student created · ${body?.student?.studentCode || ''}. Enquiry, demo & documents linked.`,
      );
      refetch();
      if (studentId) openStudent(studentId);
    } catch (err) {
      toastService.error(err?.data?.message || 'Conversion failed');
    }
  };

  const onInvalid = () => {
    toastService.error('Please fix the highlighted fields before saving.');
  };

  const onSubmit = async (data) => {
    if (readOnly) return;
    try {
      const { payload, followUp, appointment } = stripFormExtras(data);
      const body = {
        ...payload,
        branchId: payload.branchId || user?.branchId,
        testsGiven: (payload.testsGiven || []).filter((t) => t?.name?.trim()),
        allowDuplicate: duplicateAcknowledged,
      };
      const hasFollowUp = Boolean(followUp.followUpRemarks?.trim());
      const hasAppointment = Boolean(appointment.appointmentDate);

      if (isEditMode) {
        await updateEnquiry({ id: enquiryId, ...body }).unwrap();
        toastService.action.saved('Enquiry updated');
        refetch();
      } else {
        const created = await createEnquiry(body).unwrap();
        const newId = created?.data?.id ?? created?.id;
        if (newId && hasFollowUp) await saveFollowUpOnCreate(newId, followUp);
        if (newId && hasAppointment) await saveAppointmentOnCreate(newId, appointment);
        toastService.action.saved('Enquiry created');
        if (newId) openEnquiry(newId);
        else backToList();
      }
    } catch (err) {
      toastService.error(err?.data?.message || 'Failed to save enquiry');
    }
  };

  if (isEditMode && isLoading && !enquiry) {
    return <ContentLoader variant="module" />;
  }

  const title = isEditMode ? undefined : 'Add Enquiry';
  const subtitle = isEditMode ? undefined : 'Capture lead details and schedule follow-ups';

  const saving = creating || updating;
  const showFormFooter = !isEditMode && CREATE_FORM_TAB_IDS.has(activeTab) && !readOnly;
  const handleTabChange = (tab) => onTabChange?.(tab);
  const handleSave = () => handleSubmit(onSubmit, onInvalid)();

  const breadcrumbs = isEditMode
    ? [
      { label: 'Dashboard', path: ROUTES.DASHBOARD },
      { label: 'Manage Enquiry', path: ROUTES.ENQUIRIES },
      { label: enquiry?.enquiryCode || 'Detail' },
    ]
    : [
      { label: 'Dashboard', path: ROUTES.DASHBOARD },
      { label: 'Manage Enquiry', path: ROUTES.ENQUIRIES },
      { label: 'Add Enquiry' },
    ];

  return (
    <>
      <EnquiryWorkspaceLayout
        enquiry={isEditMode ? enquiry : null}
        title={title}
        subtitle={subtitle}
        icon={FiInbox}
        breadcrumbs={breadcrumbs}
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabErrors={tabErrors}
        useFormTabs={!isEditMode}
        onBack={backToList}
        quickActions={isEditMode && !readOnly ? (
          <>
            <EnquiryQuickActionsBar
              enquiry={enquiry}
              enquiryId={enquiryId}
              onTabChange={handleTabChange}
              onLogged={refetch}
            />
            <Button icon={FiSave} onClick={handleSave} loading={saving}>
              Save Changes
            </Button>
          </>
        ) : null}
        footer={showFormFooter ? (
          <>
            <Button variant="outline" onClick={backToList}>Cancel</Button>
            <Button icon={FiSave} onClick={handleSubmit(onSubmit, onInvalid)} loading={saving}>
              Create Enquiry
            </Button>
          </>
        ) : null}
      >
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="min-h-[200px]">
          {isEditMode && activeTab === 'overview' && (
            <OverviewTab
              register={register}
              control={control}
              errors={errors}
              readOnly={readOnly}
            />
          )}
          {!isEditMode && activeTab === 'personal' && (
            <PersonalDetailsTab register={register} control={control} errors={errors} />
          )}
          {!isEditMode && activeTab === 'other' && (
            <OtherDetailsTab
              register={register}
              control={control}
              errors={errors}
              setValue={setValue}
              variant="enquiry"
              assignmentMeta={enquiry?.metadata?.counsellorAssignment}
            />
          )}
          {!isEditMode && activeTab === 'followup' && (
            <FollowUpActionsPanel
              enquiryId={enquiryId}
              enquiry={enquiry}
              isEditMode={false}
              register={register}
              control={control}
              errors={errors}
              onLogged={refetch}
            />
          )}
          {!isEditMode && activeTab === 'appointment' && (
            <AppointmentFormTab
              register={register}
              control={control}
              errors={errors}
              enquiry={enquiry}
              isEditMode={false}
            />
          )}
          {activeTab === 'followup' && isEditMode && (
            <FollowUpTab
              register={register}
              control={control}
              errors={errors}
              enquiryId={enquiryId}
              enquiry={enquiry}
              isEditMode={isEditMode}
              onFollowUpLogged={refetch}
              onAppointmentBooked={refetch}
            />
          )}
          {activeTab === 'demo' && isEditMode && (
            <DemoTab
              enquiryId={enquiryId}
              enquiry={enquiry}
              isEditMode={!readOnly}
              onRecorded={refetch}
              onConvertToStudent={handleConvert}
              converting={converting}
            />
          )}
          {activeTab === 'conversion' && isEditMode && !isConverted && (
            <ConversionTab enquiry={enquiry} onConvert={handleConvert} converting={converting} />
          )}
          {activeTab === 'timeline' && isEditMode && (
            <TimelineTab enquiryId={enquiryId} enquiry={enquiry} />
          )}
          {activeTab === 'notes' && isEditMode && (
            <NotesTab enquiryId={enquiryId} notes={enquiry?.notes} onRefresh={refetch} />
          )}
          {activeTab === 'documents' && isEditMode && (
            <DocumentsTab enquiryId={enquiryId} documents={enquiry?.documents} onRefresh={refetch} />
          )}
          {activeTab === 'communication' && isEditMode && (
            <CommunicationTab
              enquiryId={enquiryId}
              enquiry={enquiry}
              isEditMode={isEditMode}
              onLogged={refetch}
            />
          )}
        </form>
      </EnquiryWorkspaceLayout>

      <DuplicateFoundModal
        open={duplicateModalOpen}
        matches={duplicateMatches}
        onClose={dismissDuplicateModal}
        onViewRecord={(match) => {
          dismissDuplicateModal();
          openEnquiry(match.id);
        }}
      />
    </>
  );
}
