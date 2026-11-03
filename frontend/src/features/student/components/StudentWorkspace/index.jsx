import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { FiSave } from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import ContentLoader from '../../../../components/ui/ContentLoader';
import { STUDENT_PROFILE_TABS } from '../../../../config/constants';
import { studentFormSchema } from '../../schemas/studentSchema';
import {
  fetchStudent, updateStudent, clearCurrentStudent,
} from '../../../../modules/student/redux/studentSlice';
import { selectCurrentStudent } from '../../../../modules/student/redux/studentSlice';
import toastService from '../../../../services/toast/toast.service';
import EnquiryWorkspaceLayout from '../../../enquiry/components/EnquiryWorkspace/EnquiryWorkspaceLayout';
import StudentOverviewTab from './tabs/StudentOverviewTab';
import StudentProfileTab from './tabs/StudentProfileTab';
import StudentAttendanceTab from './tabs/StudentAttendanceTab';
import StudentFinanceTab from './tabs/StudentFinanceTab';
import StudentDocumentsTab from './tabs/StudentDocumentsTab';
import StudentTimelineTab from './tabs/StudentTimelineTab';
import StudentEnquiryHistoryTab from './tabs/StudentEnquiryHistoryTab';
import StudentDemoHistoryTab from './tabs/StudentDemoHistoryTab';
import StudentRecordListTab, { formatDate } from './tabs/StudentRecordListTab';
import {
  mergeStudentDocuments,
  mergeStudentNotes,
  resolveStudentLead,
} from '../../utils/studentJourney.utils';
import { buildStudentTimelineEvents } from '../../utils/studentTimeline.utils';
import { useStudentNav } from '../../hooks/useStudentNav';
import { ROUTES } from '../../../../config/routes';
import { PERMISSIONS } from '../../../../config/permissions';
import { usePermissions } from '../../../../hooks/usePermissions';
import '../../../../components/ui/modal.theme.css';
import '../../../enquiry/styles/enquiry-workspace.css';
import '../../styles/student-workspace.css';

const defaultValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  passportNo: '',
  address: '',
  emergencyContact: '',
  status: 'REGISTERED',
  intake: '',
  course: '',
  university: '',
  country: '',
};

const EDIT_TABS = new Set(['profile']);

const TAB_PERMISSIONS = {
  documents: [PERMISSIONS.DOCUMENTS_VIEW],
  applications: [PERMISSIONS.APPLICATIONS_VIEW],
  visa: [PERMISSIONS.VISAS_VIEW],
  finance: [PERMISSIONS.INVOICES_VIEW],
  attendance: [PERMISSIONS.ATTENDANCE_VIEW],
};

const TEACHER_HIDDEN_TABS = new Set(['applications', 'visa', 'finance', 'documents', 'notes']);

function visibleStudentTabs(canAny, roleSlug) {
  return STUDENT_PROFILE_TABS.filter((tab) => {
    if (roleSlug === 'teacher' && TEACHER_HIDDEN_TABS.has(tab.id)) return false;
    const required = TAB_PERMISSIONS[tab.id];
    if (!required) return true;
    return canAny(required);
  });
}

export default function StudentWorkspace({
  studentId,
  activeTab: activeTabProp = 'overview',
  onTabChange,
}) {
  const dispatch = useDispatch();
  const student = useSelector(selectCurrentStudent);
  const { backToList } = useStudentNav();
  const { can, canAny, roleSlug } = usePermissions();
  const tabs = visibleStudentTabs(canAny, roleSlug);
  const [loading, setLoading] = useState(true);
  const activeTab = tabs.some((t) => t.id === activeTabProp) ? activeTabProp : 'overview';

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    if (!studentId) return undefined;
    setLoading(true);
    dispatch(fetchStudent(studentId)).finally(() => setLoading(false));
    return () => { dispatch(clearCurrentStudent()); };
  }, [dispatch, studentId]);

  useEffect(() => {
    if (student) {
      const meta = student.metadata && typeof student.metadata === 'object' ? student.metadata : {};
      reset({
        ...defaultValues,
        ...student,
        email: student.email || '',
        dateOfBirth: student.dateOfBirth?.slice?.(0, 10) || '',
        emergencyContact: meta.emergencyContact || meta.alternateNo || student.enquiry?.alternateNo || '',
      });
    }
  }, [student, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        email: data.email?.trim() || null,
        emergencyContact: data.emergencyContact?.trim() || null,
      };
      await dispatch(updateStudent({ id: studentId, data: payload })).unwrap();
      toastService.action.saved('Student updated');
      dispatch(fetchStudent(studentId));
    } catch (err) {
      toastService.error(err?.message || 'Failed to save student');
    }
  };

  const breadcrumbs = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Students', path: ROUTES.STUDENTS },
    { label: student?.studentCode || 'Detail' },
  ];

  const showFooter = EDIT_TABS.has(activeTab);
  const handleTabChange = (tab) => onTabChange?.(tab);
  const canEditDocs = can(PERMISSIONS.DOCUMENTS_UPLOAD) || can(PERMISSIONS.STUDENTS_UPDATE);
  const refreshStudent = () => dispatch(fetchStudent(studentId));

  const mergedDocuments = useMemo(() => mergeStudentDocuments(student), [student]);
  const mergedNotes = useMemo(() => mergeStudentNotes(student), [student]);
  const lead = resolveStudentLead(student);

  const notesRows = mergedNotes.map((n) => ({
    id: n.id,
    content: n.content?.slice(0, 120) || n.content,
    author: n.author,
    createdAt: n.createdAt,
    source: n.source === 'enquiry' ? 'Enquiry' : 'Student',
  }));

  const timelineRows = useMemo(() => buildStudentTimelineEvents(student), [student]);

  if (loading) {
    return <ContentLoader variant="module" />;
  }

  if (!student) {
    return (
      <div className="p-8 text-center text-text-muted">
        Student not found.
        <Button variant="outline" className="mt-4" onClick={backToList}>Back to list</Button>
      </div>
    );
  }

  return (
    <EnquiryWorkspaceLayout
      student={student}
      breadcrumbs={breadcrumbs}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onBack={backToList}
      footer={showFooter && can(PERMISSIONS.STUDENTS_UPDATE) ? (
        <>
          <Button variant="outline" onClick={backToList}>Cancel</Button>
          <Button icon={FiSave} onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Save Changes
          </Button>
        </>
      ) : null}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="min-h-[200px]">
        {activeTab === 'overview' && (
          <StudentOverviewTab
            student={student}
            onTabChange={handleTabChange}
            timelineRows={timelineRows}
          />
        )}
        {activeTab === 'profile' && (
          <StudentProfileTab register={register} control={control} errors={errors} />
        )}
        {activeTab === 'enquiry-history' && (
          <StudentEnquiryHistoryTab
            enquiry={student?.enquiry}
            lead={lead}
            onTabChange={handleTabChange}
          />
        )}
        {activeTab === 'demo-history' && (
          <StudentDemoHistoryTab
            demos={student?.enquiry?.demos || []}
            enquiryCode={student?.enquiry?.enquiryCode}
            onTabChange={handleTabChange}
          />
        )}
        {activeTab === 'documents' && (
          <StudentDocumentsTab
            studentId={studentId}
            enquiryId={student?.enquiry?.id}
            documents={mergedDocuments}
            canEdit={canEditDocs}
            onRefresh={refreshStudent}
          />
        )}
        {activeTab === 'applications' && (
          <StudentRecordListTab
            title="Applications"
            description="University applications on this student journey."
            emptyMessage="No applications yet — add one from the Applications module."
            columns={[
              { key: 'university', label: 'University' },
              { key: 'course', label: 'Program / Course' },
              { key: 'intake', label: 'Target Intake' },
              { key: 'applicationNo', label: 'App Reference #' },
              { key: 'status', label: 'Admission Status' },
              { key: 'submittedAt', label: 'Submitted Date', format: formatDate },
            ]}
            rows={student?.applications || []}
          />
        )}
        {activeTab === 'visa' && (
          <StudentRecordListTab
            title="Visa"
            description="Visa filing status, SDS stream, and embassy tracking."
            emptyMessage="No visa cases yet."
            columns={[
              { key: 'country', label: 'Destination Country' },
              { key: 'visaType', label: 'Permit Stream' },
              { key: 'applicationNo', label: 'File / IRCC #' },
              { key: 'status', label: 'Embassy Status' },
              { key: 'submittedAt', label: 'Filing Date', format: formatDate },
            ]}
            rows={student?.visas || []}
          />
        )}
        {activeTab === 'finance' && (
          <StudentFinanceTab student={student} />
        )}
        {activeTab === 'attendance' && (
          <StudentAttendanceTab studentId={studentId} />
        )}
        {activeTab === 'notes' && (
          <StudentRecordListTab
            title="Notes"
            description="Counsellor and staff notes on this student."
            emptyMessage="No notes yet — rich note editor will match Manage Enquiry next."
            columns={[
              { key: 'content', label: 'Note' },
              { key: 'author', label: 'By' },
              { key: 'source', label: 'Source' },
              { key: 'createdAt', label: 'Date', format: formatDate },
            ]}
            rows={notesRows}
          />
        )}
        {activeTab === 'timeline' && (
          <StudentTimelineTab rows={timelineRows} />
        )}
      </form>
    </EnquiryWorkspaceLayout>
  );
}
