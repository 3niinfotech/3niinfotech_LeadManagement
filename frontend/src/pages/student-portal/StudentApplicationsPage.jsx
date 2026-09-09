import { useEffect, useState } from 'react';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import JourneyTimeline from './components/JourneyTimeline';
import { formatDate } from './components/portalFormat';
import {
  PortalPage,
  PortalPanel,
  PortalEmpty,
  PortalSkeletonPage,
  PortalBadge,
} from '../../components/portal/PortalUi';

function appTone(status) {
  const s = String(status || '').toUpperCase();
  if (['OFFER_RECEIVED', 'ACCEPTED', 'APPROVED'].includes(s)) return 'success';
  if (['REJECTED', 'WITHDRAWN'].includes(s)) return 'danger';
  if (['SUBMITTED', 'UNDER_REVIEW'].includes(s)) return 'warning';
  return 'info';
}

export default function StudentApplicationsPage() {
  const [rows, setRows] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_APPLICATIONS)
      .then((res) => {
        if (!cancelled) {
          const data = res.data || [];
          setRows(data);
          if (data[0]?.id) setExpandedId(data[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <PortalSkeletonPage />;

  return (
    <PortalPage>
      {!rows.length ? (
        <PortalEmpty
          title="No applications yet"
          description="Your counsellor will add applications as you progress."
        />
      ) : (
        <div className="crm-student-dashboard__grid" style={{ gridTemplateColumns: '1fr' }}>
          {rows.map((row) => {
            const expanded = expandedId === row.id;
            return (
              <PortalPanel key={row.id}>
                <button
                  type="button"
                  className="crm-student-expand-head"
                  onClick={() => setExpandedId(expanded ? null : row.id)}
                >
                  <div className="min-w-0">
                    <p className="crm-student-expand-title">
                      {row.university || row.course || row.applicationNo || 'Application'}
                    </p>
                    <p className="crm-student-expand-meta">
                      {[row.course, row.country, row.intake].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <PortalBadge tone={appTone(row.status)}>{String(row.status || '').replace(/_/g, ' ')}</PortalBadge>
                </button>
                {expanded && (
                  <div className="crm-student-expand-body">
                    <div className="crm-student-expand-facts">
                      <p><span>Application #:</span> {row.applicationNo || '—'}</p>
                      <p><span>Submitted:</span> {formatDate(row.submittedAt)}</p>
                      <p><span>Offer date:</span> {formatDate(row.offerDate)}</p>
                      {row.offerStatus && (
                        <p><span>Offer status:</span> {row.offerStatus}</p>
                      )}
                    </div>
                    <div>
                      <p className="crm-portal-pick-card__title" style={{ marginBottom: '0.35rem' }}>Journey</p>
                      <JourneyTimeline steps={row.timeline || []} />
                    </div>
                  </div>
                )}
              </PortalPanel>
            );
          })}
        </div>
      )}
    </PortalPage>
  );
}
