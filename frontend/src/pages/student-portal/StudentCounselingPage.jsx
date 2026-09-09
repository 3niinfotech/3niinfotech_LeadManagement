import { useCallback, useEffect, useState } from 'react';
import { FiCalendar, FiMail, FiPhone, FiUser } from 'react-icons/fi';
import { apiGet, apiPost } from '../../api/apiClient';
import { API } from '../../config/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toastService from '../../services/toast/toast.service';
import { formatDate } from './components/portalFormat';
import { appointmentStatusLabel } from './components/studentPortal.utils';
import {
  PortalPage,
  PortalPanel,
  PortalEmpty,
  PortalSkeletonPage,
  PortalBadge,
} from '../../components/portal/PortalUi';

function toLocalDatetimeValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AppointmentRow({ row }) {
  const tone = row.status === 'COMPLETED' ? 'success'
    : row.status === 'REQUESTED' ? 'warning'
      : row.status === 'REJECTED' || row.status === 'CANCELLED' ? 'danger'
        : 'info';
  return (
    <li className="crm-student-appointment">
      <div className="crm-student-appointment__main">
        <div className="crm-student-appointment__head">
          <span className="crm-student-appointment__title">{row.title || 'Counseling session'}</span>
          <PortalBadge tone={tone}>{appointmentStatusLabel(row.status)}</PortalBadge>
        </div>
        <p className="crm-student-appointment__time">{formatDate(row.startAt, true)}</p>
        {row.location && <p className="crm-student-appointment__meta">{row.location}</p>}
        {row.requestNote && <p className="crm-student-appointment__note">{row.requestNote}</p>}
      </div>
    </li>
  );
}

export default function StudentCounselingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({
    startAt: toLocalDatetimeValue(new Date(Date.now() + 86400000)),
    endAt: '',
    title: 'Counseling appointment',
    note: '',
    location: 'Campus / Online',
  });

  const loadCounseling = useCallback(() => apiGet(API.PORTAL_STUDENT_COUNSELING).then((res) => {
    setData(res.data || null);
  }), []);

  useEffect(() => {
    let cancelled = false;
    loadCounseling()
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadCounseling]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost(API.PORTAL_STUDENT_COUNSELING_REQUEST, {
        startAt: new Date(form.startAt).toISOString(),
        endAt: form.endAt ? new Date(form.endAt).toISOString() : undefined,
        title: form.title.trim() || undefined,
        note: form.note.trim() || undefined,
        location: form.location.trim() || undefined,
      });
      toastService.success('Request sent — you will be notified when confirmed');
      setForm((prev) => ({ ...prev, note: '' }));
      setShowRequest(false);
      await loadCounseling();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PortalSkeletonPage />;

  const counselor = data?.counselor;
  const upcoming = data?.upcoming || [];
  const previous = data?.previous || [];
  const hasPendingRequest = upcoming.some((a) => a.status === 'REQUESTED');

  return (
    <PortalPage className="crm-stu-counsel">
      {counselor && !hasPendingRequest ? (
        <div className="crm-portal-page-toolbar">
          <Button size="sm" onClick={() => setShowRequest((v) => !v)}>
            {showRequest ? 'Close request' : 'Request appointment'}
          </Button>
        </div>
      ) : null}

      <div className="crm-stu-counsel__grid">
        <div className="crm-stu-counsel__main">
          <PortalPanel title="Your counsellor" padded>
            {counselor ? (
              <div className="crm-student-counsellor">
                <span className="crm-student-counsellor__avatar"><FiUser aria-hidden /></span>
                <div className="min-w-0">
                  <p className="crm-student-counsellor__name">{counselor.name}</p>
                  {counselor.email && (
                    <p className="crm-student-counsellor__meta"><FiMail aria-hidden /> {counselor.email}</p>
                  )}
                  {counselor.phone && (
                    <p className="crm-student-counsellor__meta"><FiPhone aria-hidden /> {counselor.phone}</p>
                  )}
                </div>
              </div>
            ) : (
              <PortalEmpty title="No counsellor assigned" description="Contact your branch office for assistance." className="crm-portal-empty--panel" />
            )}
          </PortalPanel>

          {showRequest && counselor && (
            <PortalPanel title="Request appointment" description="Your counsellor will review and confirm" padded>
              <form onSubmit={handleSubmit} className="crm-student-form">
                <div className="crm-student-form__grid">
                  <label className="crm-student-form__select-wrap">
                    <span className="crm-student-form__label">Preferred date & time</span>
                    <input
                      type="datetime-local"
                      className="crm-student-form__select"
                      value={form.startAt}
                      onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                      required
                    />
                  </label>
                  <Input
                    label="Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                  <div className="crm-student-form__full">
                    <label className="crm-student-form__label">What would you like to discuss?</label>
                    <textarea
                      className="crm-student-form__textarea"
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={2}
                      placeholder="Brief note for your counsellor"
                    />
                  </div>
                </div>
                <div className="crm-student-form__actions">
                  <Button type="submit" loading={submitting}>Send request</Button>
                </div>
              </form>
            </PortalPanel>
          )}

          <PortalPanel title="Upcoming appointments">
            {upcoming.length === 0 ? (
              <PortalEmpty
                title="No upcoming sessions"
                description="Request an appointment when you need counselling."
                icon={FiCalendar}
                className="crm-portal-empty--panel"
              />
            ) : (
              <ul className="crm-student-appointment-list">
                {upcoming.map((row) => <AppointmentRow key={row.id} row={row} />)}
              </ul>
            )}
          </PortalPanel>
        </div>

        <PortalPanel title="Previous sessions">
          {previous.length === 0 ? (
            <PortalEmpty title="No past sessions" description="Completed counselling sessions appear here." className="crm-portal-empty--panel" />
          ) : (
            <ul className="crm-student-appointment-list">
              {previous.slice(0, 12).map((row) => <AppointmentRow key={row.id} row={row} />)}
            </ul>
          )}
        </PortalPanel>
      </div>
    </PortalPage>
  );
}
