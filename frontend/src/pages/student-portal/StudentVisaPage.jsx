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

function visaTone(status) {
  const s = String(status || '').toUpperCase();
  if (['APPROVED', 'GRANTED', 'VISA_GRANTED'].includes(s)) return 'success';
  if (['REJECTED', 'REFUSED'].includes(s)) return 'danger';
  if (['NOT_STARTED', 'DRAFT'].includes(s)) return 'neutral';
  return 'warning';
}

export default function StudentVisaPage() {
  const [rows, setRows] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_VISAS)
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
          title="No visa records yet"
          description="Visa progress will appear here once your case starts."
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
                    <p className="crm-student-expand-title">{row.country || 'Visa application'}</p>
                    <p className="crm-student-expand-meta">
                      {[row.visaType, row.applicationNo].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <PortalBadge tone={visaTone(row.status)}>
                    {String(row.status || 'NOT_STARTED').replace(/_/g, ' ')}
                  </PortalBadge>
                </button>
                {expanded && (
                  <div className="crm-student-expand-body">
                    <div className="crm-student-expand-facts">
                      <p><span>Application #:</span> {row.applicationNo || '—'}</p>
                      <p><span>Submitted:</span> {formatDate(row.submittedAt)}</p>
                      <p><span>Decision:</span> {formatDate(row.decisionAt)}</p>
                      <p><span>Expiry:</span> {formatDate(row.expiryDate)}</p>
                      {row.studentSafeRemark && (
                        <p className="text-text-secondary italic">{row.studentSafeRemark}</p>
                      )}
                    </div>
                    <div>
                      <p className="crm-portal-pick-card__title" style={{ marginBottom: '0.35rem' }}>Visa journey</p>
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
