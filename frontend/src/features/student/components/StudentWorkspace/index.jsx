import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { FiSave, FiUsers, FiDollarSign } from 'react-icons/fi';
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
import ProfilePlaceholderTab from '../../../enquiry/components/EnquiryDrawer/ProfilePlaceholderTab';
import StudentSummaryStrip from './StudentSummaryStrip';
import StudentOverviewTab from './tabs/StudentOverviewTab';
import StudentPersonalTab from './tabs/StudentPersonalTab';
import StudentAcademicTab from './tabs/StudentAcademicTab';
import StudentRecordListTab, { formatDate } from './tabs/StudentRecordListTab';
import { useStudentNav } from '../../hooks/useStudentNav';
import { ROUTES } from '../../../../config/routes';
import '../../../enquiry/styles/enquiry-workspace.css';

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
  status: 'REGISTERED',
  intake: '',
  course: '',
  university: '',
  country: '',
};

const EDIT_TABS = new Set(['personal', 'academic']);

export default function StudentWorkspace({
  studentId,
  activeTab: activeTabProp = 'overview',
  onTabChange,
}) {
  const dispatch = useDispatch();
  const student = useSelector(selectCurrentStudent);
  const { backToList } = useStudentNav();
  const [loading, setLoading] = useState(true);
  const activeTab = STUDENT_PROFILE_TABS.some((t) => t.id === activeTabProp)
    ? activeTabProp
    : 'overview';

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
      reset({
        ...defaultValues,
        ...student,
        email: student.email || '',
        dateOfBirth: student.dateOfBirth?.slice?.(0, 10) || '',
      });
    }
  }, [student, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        email: data.email?.trim() || null,
      };
      await dispatch(updateStudent({ id: studentId, data: payload })).unwrap();
      toastService.action.saved('Student updated');
      dispatch(fetchStudent(studentId));
    } catch (err) {
      toastService.error(err?.message || 'Failed to save student');
    }
  };

  const title = 'Student Profile';
  const subtitle = student
    ? `${student.studentCode} · ${student.firstName} ${student.lastName}`.trim()
    : 'Loading student…';

  const breadcrumbs = [
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'Students', path: ROUTES.STUDENTS },
    { label: student?.studentCode || 'Detail' },
  ];

  const showFooter = EDIT_TABS.has(activeTab);
  const handleTabChange = (tab) => onTabChange?.(tab);

  const notesRows = (student?.notes || []).map((n) => ({
    id: n.id,
    content: n.content?.slice(0, 80) || n.content,
    author: n.user ? `${n.user.firstName} ${n.user.lastName}`.trim() : '—',
    createdAt: n.createdAt,
  }));

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
      title={title}
      subtitle={subtitle}
      icon={FiUsers}
      breadcrumbs={breadcrumbs}
      tabs={STUDENT_PROFILE_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onBack={backToList}
      summary={<StudentSummaryStrip student={student} />}
      footer={showFooter ? (
        <>
          <Button variant="outline" onClick={backToList}>Cancel</Button>
          <Button icon={FiSave} onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
            Save Changes
          </Button>
        </>
      ) : null}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="min-h-[200px]">
        {activeTab === 'overview' && <StudentOverviewTab student={student} />}
        {activeTab === 'personal' && (
          <StudentPersonalTab register={register} control={control} errors={errors} />
        )}
        {activeTab === 'academic' && (
          <StudentAcademicTab register={register} control={control} errors={errors} />
        )}
        {activeTab === 'documents' && (
          <StudentRecordListTab
            title="Documents"
            description="Uploaded documents for this student."
            emptyMessage="No documents uploaded yet."
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'type', label: 'Type' },
              { key: 'createdAt', label: 'Uploaded', format: formatDate },
            ]}
            rows={student?.documents || []}
          />
        )}
        {activeTab === 'applications' && (
          <StudentRecordListTab
            title="Applications"
            description="University applications in progress."
            emptyMessage="No applications yet — add one from the Applications module."
            columns={[
              { key: 'university', label: 'University' },
              { key: 'course', label: 'Course' },
              { key: 'status', label: 'Status' },
              { key: 'submittedAt', label: 'Submitted', format: formatDate },
            ]}
            rows={student?.applications || []}
          />
        )}
        {activeTab === 'visa' && (
          <StudentRecordListTab
            title="Visa"
            description="Visa filing status and embassy updates."
            emptyMessage="No visa cases yet."
            columns={[
              { key: 'country', label: 'Country' },
              { key: 'visaType', label: 'Type' },
              { key: 'status', label: 'Status' },
              { key: 'submittedAt', label: 'Submitted', format: formatDate },
            ]}
            rows={student?.visas || []}
          />
        )}
        {activeTab === 'finance' && (
          <ProfilePlaceholderTab
            icon={FiDollarSign}
            title="Finance"
            description="Fee quotations, payments, and instalment tracking."
          />
        )}
        {activeTab === 'notes' && (
          <StudentRecordListTab
            title="Notes"
            description="Counsellor notes on this student."
            emptyMessage="No notes yet."
            columns={[
              { key: 'content', label: 'Note' },
              { key: 'author', label: 'By' },
              { key: 'createdAt', label: 'Date', format: formatDate },
            ]}
            rows={notesRows}
          />
        )}
        {activeTab === 'timeline' && (
          <StudentRecordListTab
            title="Timeline"
            description="Activity history for this student."
            emptyMessage="No activity recorded yet."
            columns={[
              { key: 'action', label: 'Action' },
              { key: 'description', label: 'Description' },
              { key: 'createdAt', label: 'When', format: formatDate },
            ]}
            rows={student?.activities || []}
          />
        )}
      </form>
    </EnquiryWorkspaceLayout>
  );
}
