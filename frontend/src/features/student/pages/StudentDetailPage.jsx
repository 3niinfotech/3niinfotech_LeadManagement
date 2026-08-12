import { useParams, Navigate } from 'react-router-dom';
import { STUDENT_PROFILE_TABS } from '../../../config/constants';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionRoute from '../../../components/common/PermissionRoute';
import StudentWorkspace from '../components/StudentWorkspace';
import { useStudentNav } from '../hooks/useStudentNav';
import { ROUTES } from '../../../config/routes';

const VALID_TABS = new Set(STUDENT_PROFILE_TABS.map((t) => t.id));

export default function StudentDetailPage() {
  const { id, tab } = useParams();
  const { setTab } = useStudentNav();
  const activeTab = tab && VALID_TABS.has(tab) ? tab : 'overview';

  if (tab && !VALID_TABS.has(tab)) {
    return <Navigate to={ROUTES.STUDENT_DETAIL(id)} replace />;
  }

  return (
    <PermissionRoute permission={PERMISSIONS.STUDENTS_VIEW}>
      <StudentWorkspace
        studentId={id}
        activeTab={activeTab}
        onTabChange={(nextTab) => setTab(id, nextTab)}
      />
    </PermissionRoute>
  );
}
