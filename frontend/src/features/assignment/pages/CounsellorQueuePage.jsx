import { useEffect, useMemo, useState, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { FiUsers, FiClock, FiCheckCircle, FiUserCheck } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import TableLoader from '../../../components/ui/TableLoader';
import { ROUTES } from '../../../config/routes';
import toastService from '../../../services/toast/toast.service';
import { lazyImport } from '../../../utils/lazyImport';
import { openWalkInDrawer } from '../../walkin/redux/walkinUiSlice';
import { openEnquiryDrawer } from '../../enquiry/redux/enquiryUiSlice';
import {
  useGetMyQueueQuery,
  useUpdatePresenceMutation,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useStartSessionMutation,
} from '../redux/assignmentApiSlice';
import { PRESENCE_STATUS_OPTIONS, OFFER_REJECT_REASONS } from '../config/assignment.constants';
import '../styles/assignment.css';

const WalkInDrawer = lazyImport(() => import('../../walkin/components/WalkInDrawer'));

function OfferCountdown({ expiresAt }) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return <span className="crm-assignment-offer__timer">Accept within {left}s</span>;
}

function VisitorRow({ lead, actions }) {
  const name = `${lead.firstName} ${lead.lastName || ''}`.trim();
  const purpose = lead.metadata?.visitPurpose || '—';
  return (
    <div className="crm-assignment-visitor-row">
      <div className="min-w-0">
        <p className="crm-assignment-visitor-row__name">{name}</p>
        <p className="crm-assignment-visitor-row__meta">
          Token {lead.tokenNumber} · {lead.leadCode} · {purpose}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">{actions}</div>
    </div>
  );
}

export default function CounsellorQueuePage() {
  const dispatch = useDispatch();
  const { data, isLoading, refetch } = useGetMyQueueQuery(undefined, {
    pollingInterval: 15000,
  });
  const [updatePresence] = useUpdatePresenceMutation();
  const [acceptOffer, { isLoading: accepting }] = useAcceptOfferMutation();
  const [rejectOffer] = useRejectOfferMutation();
  const [startSession, { isLoading: starting }] = useStartSessionMutation();
  const [rejectReason, setRejectReason] = useState(OFFER_REJECT_REASONS[0]);

  const presence = data?.presence?.status || 'OFFLINE';
  const offers = data?.offers || [];
  const assigned = data?.assigned || [];
  const activeSession = data?.activeSession;
  const stats = data?.stats || {};

  const waiting = useMemo(
    () => assigned.filter((l) => l.status === 'WAITING' || l.status === 'APPOINTMENT'),
    [assigned],
  );

  const handlePresence = async (status) => {
    try {
      await updatePresence({ status }).unwrap();
      toastService.success('Status updated');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Status update failed');
    }
  };

  const handleAccept = async (offerId) => {
    try {
      await acceptOffer(offerId).unwrap();
      toastService.success('Assignment accepted');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Accept failed');
    }
  };

  const handleReject = async (offerId) => {
    try {
      await rejectOffer({ id: offerId, reason: rejectReason }).unwrap();
      toastService.info('Offer rejected — re-routing visitor');
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Reject failed');
    }
  };

  const handleStart = async (leadId) => {
    try {
      await startSession(leadId).unwrap();
      dispatch(openWalkInDrawer({ id: leadId }));
      refetch();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not start session');
    }
  };

  return (
    <>
      <div className="h-full min-h-0 flex flex-col">
        <ModulePageCard
          title="My Queue"
          subtitle="Auto-assigned visitors · accept, counsel, and convert"
          icon={FiUsers}
          iconColor="primary"
          breadcrumbs={[
            { label: 'Dashboard', path: ROUTES.DASHBOARD },
            { label: 'My Queue' },
          ]}
        >
          <div className="crm-assignment-presence">
            {PRESENCE_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`crm-assignment-presence__btn ${presence === opt.value ? 'crm-assignment-presence__btn--active' : ''}`}
                onClick={() => handlePresence(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="crm-assignment-stats">
            <div className="crm-assignment-stat">
              <div className="crm-assignment-stat__value">{stats.pendingOffers || 0}</div>
              <div className="crm-assignment-stat__label">Pending Offers</div>
            </div>
            <div className="crm-assignment-stat">
              <div className="crm-assignment-stat__value">{stats.waitingCount || 0}</div>
              <div className="crm-assignment-stat__label">My Waiting</div>
            </div>
            <div className="crm-assignment-stat">
              <div className="crm-assignment-stat__value">{stats.completedToday || 0}</div>
              <div className="crm-assignment-stat__label">Completed Today</div>
            </div>
            <div className="crm-assignment-stat">
              <div className="crm-assignment-stat__value">
                {stats.avgCounsellingMinutes != null ? `${stats.avgCounsellingMinutes}m` : '—'}
              </div>
              <div className="crm-assignment-stat__label">Avg Time</div>
            </div>
          </div>

          {isLoading && (
            <div className="relative min-h-[180px] rounded-xl border border-border overflow-hidden mb-3">
              <TableLoader rows={4} columns={4} showCheckbox={false} showPagination={false} />
            </div>
          )}

          {offers.map((offer) => (
            <div key={offer.id} className="crm-assignment-offer">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-text">New visitor assignment</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {offer.lead?.firstName} {offer.lead?.lastName || ''} · Token {offer.lead?.tokenNumber}
                  </p>
                </div>
                <OfferCountdown expiresAt={offer.expiresAt} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  options={OFFER_REJECT_REASONS.map((r) => ({ value: r, label: r }))}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  allowClear={false}
                  className="min-w-[160px]"
                />
                <Button size="sm" variant="outline" onClick={() => handleReject(offer.id)}>
                  Reject
                </Button>
                <Button size="sm" icon={FiUserCheck} loading={accepting} onClick={() => handleAccept(offer.id)}>
                  Accept
                </Button>
              </div>
            </div>
          ))}

          {activeSession?.lead && (
            <div className="crm-assignment-active-session">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-text flex items-center gap-1.5">
                    <FiClock className="text-success" />
                    Active counselling
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {activeSession.lead.firstName} · Token {activeSession.lead.tokenNumber}
                  </p>
                </div>
                <Button size="sm" onClick={() => dispatch(openWalkInDrawer({ id: activeSession.lead.id }))}>
                  Open Workspace
                </Button>
              </div>
            </div>
          )}

          <section className="crm-assignment-section">
            <h3 className="crm-assignment-section__title">My Waiting Visitors</h3>
            {!waiting.length && (
              <p className="text-xs text-text-muted py-4 text-center">No visitors waiting — new assignments appear automatically</p>
            )}
            {waiting.map((lead) => (
              <VisitorRow
                key={lead.id}
                lead={lead}
                actions={(
                  <>
                    <Button size="sm" variant="outline" onClick={() => dispatch(openWalkInDrawer({ id: lead.id }))}>
                      View
                    </Button>
                    <Button size="sm" icon={FiCheckCircle} loading={starting} onClick={() => handleStart(lead.id)}>
                      Start Counselling
                    </Button>
                  </>
                )}
              />
            ))}
          </section>

          <section className="crm-assignment-section">
            <h3 className="crm-assignment-section__title">In Counselling</h3>
            {assigned.filter((l) => l.status === 'IN_COUNSELLING').map((lead) => (
              <VisitorRow
                key={lead.id}
                lead={lead}
                actions={(
                  <Button size="sm" onClick={() => dispatch(openWalkInDrawer({ id: lead.id }))}>
                    Continue
                  </Button>
                )}
              />
            ))}
            {!assigned.filter((l) => l.status === 'IN_COUNSELLING').length && (
              <p className="text-xs text-text-muted">None</p>
            )}
          </section>
        </ModulePageCard>
      </div>

      <Suspense fallback={null}>
        <WalkInDrawer />
      </Suspense>
    </>
  );
}
