import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import GlobalLoader from '../../components/ui/GlobalLoader';

export default function StudentDashboardPage() {
  const user = useSelector(selectUser);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.STUDENTS, { limit: 1 })
      .then((res) => {
        if (!cancelled) setStudent(res.data?.[0] || null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <GlobalLoader />;

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-semibold text-text mb-2">Welcome, {user?.firstName}</h2>
      <p className="text-text-secondary mb-8">
        Branch: {user?.branch?.name || '—'} · {user?.company?.name}
      </p>
      {student ? (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 shadow-card">
          <p className="text-sm text-text-secondary mb-1">Student ID</p>
          <p className="text-lg font-semibold text-text mb-4">{student.studentCode}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">Status</p>
              <p className="font-medium text-text">{student.status}</p>
            </div>
            <div>
              <p className="text-text-secondary">Course</p>
              <p className="font-medium text-text">{student.course || '—'}</p>
            </div>
            <div>
              <p className="text-text-secondary">Country</p>
              <p className="font-medium text-text">{student.country || '—'}</p>
            </div>
            <div>
              <p className="text-text-secondary">University</p>
              <p className="font-medium text-text">{student.university || '—'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 text-text-secondary">
          Your student profile is being set up. Contact your branch counsellor if this persists.
        </div>
      )}
    </div>
  );
}
