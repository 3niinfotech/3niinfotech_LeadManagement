import { useEffect, useState } from 'react';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import GlobalLoader from '../../components/ui/GlobalLoader';

function rangeIso(daysAhead) {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + daysAhead);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function StudentAttendancePage() {
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = rangeIso(14);
    Promise.all([
      apiGet(API.ACADEMIC_ME).catch(() => ({ data: null })),
      apiGet(API.ACADEMIC_SESSIONS, { from, to }).catch(() => ({ data: [] })),
    ])
      .then(([meRes, sessionRes]) => {
        if (cancelled) return;
        setData(meRes.data);
        setSessions(Array.isArray(sessionRes.data) ? sessionRes.data : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <GlobalLoader />;

  const totals = data?.totals || {};
  const history = data?.history || [];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text">My Attendance</h2>
        <p className="text-text-secondary mt-1">Your class schedule and attendance only — other students are never shown.</p>
      </div>
      <div className="bg-card-bg border border-card-border rounded-lg p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-text-secondary">Percentage</p>
          <p className="text-2xl font-semibold">{totals.percent ?? 0}%</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Present</p>
          <p className="text-2xl font-semibold">{totals.present || 0}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Absent</p>
          <p className="text-2xl font-semibold">{totals.absent || 0}</p>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Late</p>
          <p className="text-2xl font-semibold">{totals.late || 0}</p>
        </div>
      </div>
      <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-text">Upcoming classes</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-left">
            <tr>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Batch</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr><td className="px-4 py-6 text-text-secondary" colSpan={3}>No upcoming classes in the next 14 days.</td></tr>
            )}
            {sessions.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-2">{row.startAt ? new Date(row.startAt).toLocaleString('en-IN') : '—'}</td>
                <td className="px-4 py-2">{row.batch?.name || row.batch?.courseName || '—'}</td>
                <td className="px-4 py-2">{row.window?.state || row.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-text">Attendance history</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-left">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Batch</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td className="px-4 py-6 text-text-secondary" colSpan={3}>No attendance records yet.</td></tr>
            )}
            {history.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-2">{row.startAt ? new Date(row.startAt).toLocaleString('en-IN') : '—'}</td>
                <td className="px-4 py-2">{row.batch || row.course || '—'}</td>
                <td className="px-4 py-2">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
