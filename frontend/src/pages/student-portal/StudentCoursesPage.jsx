import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen } from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import Button from '../../components/ui/Button';
import {
  PortalPage,
  PortalPanel,
  PortalEmpty,
  PortalSkeletonPage,
  PortalClassCard,
} from '../../components/portal/PortalUi';

export default function StudentCoursesPage() {
  const [batches, setBatches] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 21);
    Promise.all([
      apiGet(API.ACADEMIC_BATCHES, { limit: 50 }).catch(() => ({ data: [] })),
      apiGet(API.ACADEMIC_SESSIONS, { from: from.toISOString(), to: to.toISOString() }).catch(() => ({ data: [] })),
    ])
      .then(([batchRes, sessionRes]) => {
        if (cancelled) return;
        setBatches(batchRes.data || []);
        setSessions(Array.isArray(sessionRes.data) ? sessionRes.data : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <PortalSkeletonPage />;

  return (
    <PortalPage>
      <div className="crm-portal-page-toolbar">
        <Link to={ROUTES.STUDENT_ATTENDANCE}>
          <Button size="sm" variant="outline">Attendance</Button>
        </Link>
      </div>

      {!batches.length ? (
        <PortalEmpty
          title="No courses yet"
          description="Ask your counsellor or teacher if you expect to be enrolled."
          icon={FiBookOpen}
          className="crm-portal-empty--inline"
        />
      ) : (
        <div className="crm-portal-course-grid">
          {batches.map((batch) => {
            const next = sessions.find((s) => s.batchId === batch.id || s.batch?.id === batch.id);
            const teacher = batch.instructor
              ? `${batch.instructor.firstName || ''} ${batch.instructor.lastName || ''}`.trim()
              : 'TBA';
            return (
              <PortalPanel key={batch.id} padded className="crm-portal-course-card">
                <div className="crm-student-counsellor-card">
                  <span className="crm-student-counsellor-card__avatar"><FiBookOpen /></span>
                  <div className="min-w-0">
                    <p className="crm-student-course-list__meta">{batch.code || 'Batch'}</p>
                    <p className="crm-student-counsellor-card__name">{batch.courseName || batch.name}</p>
                    <p className="crm-student-counsellor-card__role">{batch.name}</p>
                    <p className="crm-student-counsellor-card__session">
                      Teacher: {teacher || 'TBA'}
                      {batch.room ? ` · ${batch.room}` : ''}
                    </p>
                    {next?.startAt && (
                      <p className="crm-student-course-list__next">
                        Next class: {new Date(next.startAt).toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              </PortalPanel>
            );
          })}
        </div>
      )}

      <PortalPanel title="Upcoming classes">
        {!sessions.length ? (
          <PortalEmpty
            title="No upcoming classes"
            description="Nothing scheduled in the next 3 weeks."
            className="crm-portal-empty--panel"
          />
        ) : (
          sessions.slice(0, 10).map((row) => (
            <PortalClassCard
              key={row.id}
              time={row.startAt ? new Date(row.startAt).toLocaleString('en-IN') : '—'}
              name={row.batch?.courseName || row.batch?.name || 'Class'}
              sub={row.batch?.name}
            />
          ))
        )}
      </PortalPanel>
    </PortalPage>
  );
}
