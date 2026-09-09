import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import ContentLoader from '../../../components/ui/ContentLoader';
import { useGetBatchesQuery } from '../redux/attendanceApiSlice';
import { ROUTES } from '../../../config/routes';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';

export default function TeacherClassesPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data, isLoading } = useGetBatchesQuery();
  const batches = data?.data || [];
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || isLoading) return <ContentLoader />;

  return (
    <ModulePageCard
      title="My Classes"
      subtitle="Batches assigned to you"
      icon={FiUsers}
      actions={(
        <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}>
          Dashboard
        </Button>
      )}
    >
      {!batches.length ? (
        <EmptyState
          title="No classes assigned"
          description="Ask your admin to assign you as instructor on a batch."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {batches.map((batch) => (
            <Card key={batch.id} className="!p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{batch.code}</p>
              <h3 className="mt-1 text-base font-semibold text-text">{batch.name}</h3>
              <p className="mt-0.5 text-sm text-text-secondary">{batch.courseName}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted">
                <span>{batch._count?.enrollments ?? 0} students</span>
                <span>{batch.room || 'Room TBA'}</span>
                <span>{batch.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate(ROUTES.BATCH_DETAIL(batch.id))}>
                  Open
                </Button>
                {can(PERMISSIONS.ATTENDANCE_MARK) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(ROUTES.BATCH_DETAIL(batch.id))}
                  >
                    Attendance
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </ModulePageCard>
  );
}
