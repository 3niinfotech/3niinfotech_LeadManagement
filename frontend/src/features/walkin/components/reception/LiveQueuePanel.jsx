import {
  FiPhone, FiUser, FiGlobe, FiClock, FiPlay, FiPause, FiSkipForward,
  FiCheck, FiPrinter, FiMoreHorizontal,
} from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import IconButton from '../../../../components/ui/IconButton';
import WalkInPriorityBadge from '../WalkInPriorityBadge';
import WalkInStatusBadge from '../WalkInStatusBadge';
import { getVisitorName, formatWaitDuration } from '../../utils/reception.utils';
import { QUEUE_STATUS_COLORS } from '../../config/reception.constants';
import QueueTimeline from './QueueTimeline';
import { buildQueueTimelineEvents } from '../../utils/reception.utils';

export default function LiveQueuePanel({
  queue = [],
  selectedId,
  onSelect,
  onStatusChange,
  onCallNext,
  loading = false,
}) {
  const selected = queue.find((r) => r.id === selectedId) || queue[0];
  const timelineEvents = buildQueueTimelineEvents(selected);

  if (loading && !queue.length) {
    return (
      <div className="crm-reception-queue crm-reception-queue--loading">
        <div className="crm-reception-queue__skeleton" />
      </div>
    );
  }

  return (
    <div className="crm-reception-queue">
      <div className="crm-reception-queue__head">
        <div>
          <h3 className="crm-reception-queue__title">Live Queue</h3>
          <p className="crm-reception-queue__sub">
            {queue.length}
            {' '}
            visitor
            {queue.length === 1 ? '' : 's'}
            {' '}
            in queue · updates live
          </p>
        </div>
        <Button size="sm" icon={FiPlay} onClick={onCallNext} disabled={!queue.length}>
          Call Next
        </Button>
      </div>

      <div className="crm-reception-queue__list">
        {queue.length === 0 ? (
          <div className="crm-reception-queue__empty">
            <FiUser className="w-8 h-8 text-text-muted mb-2" />
            <p className="text-sm font-medium text-text">No visitors waiting</p>
            <p className="text-xs text-text-muted mt-1">New registrations appear here instantly</p>
          </div>
        ) : (
          queue.map((row) => {
            const active = row.id === (selectedId || queue[0]?.id);
            const tone = QUEUE_STATUS_COLORS[row.status] || 'waiting';
            const counsellor = row.assignedTo
              ? `${row.assignedTo.firstName} ${row.assignedTo.lastName || ''}`.trim()
              : 'Unassigned';

            return (
              <article
                key={row.id}
                className={`crm-reception-queue-card crm-reception-queue-card--${tone} ${active ? 'crm-reception-queue-card--active' : ''}`}
                onClick={() => onSelect?.(row.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect?.(row.id)}
                role="button"
                tabIndex={0}
              >
                <div className="crm-reception-queue-card__top">
                  <span className="crm-reception-queue-card__token">{row.tokenNumber}</span>
                  <WalkInPriorityBadge priority={row.priority} />
                </div>
                <p className="crm-reception-queue-card__name">{getVisitorName(row)}</p>
                <div className="crm-reception-queue-card__meta">
                  <span><FiPhone className="inline w-3 h-3" /> {row.phone}</span>
                  <span><FiGlobe className="inline w-3 h-3" /> {row.country || '—'}</span>
                  <span><FiClock className="inline w-3 h-3" /> {formatWaitDuration(row.walkInAt)}</span>
                </div>
                <p className="crm-reception-queue-card__counsellor">{counsellor}</p>
                <div className="crm-reception-queue-card__status">
                  <WalkInStatusBadge
                    status={row.status}
                    onChange={(status) => onStatusChange(row.id, status)}
                    compact
                  />
                </div>
                <div className="crm-reception-queue-card__actions">
                  <IconButton icon={FiPlay} label="Start" size="sm" onClick={(e) => { e.stopPropagation(); onStatusChange(row.id, 'IN_COUNSELLING'); }} />
                  <IconButton icon={FiPause} label="Hold" size="sm" onClick={(e) => { e.stopPropagation(); onStatusChange(row.id, 'APPOINTMENT'); }} />
                  <IconButton icon={FiSkipForward} label="Skip" size="sm" onClick={(e) => { e.stopPropagation(); onStatusChange(row.id, 'CANCELLED'); }} />
                  <IconButton icon={FiCheck} label="Complete" size="sm" onClick={(e) => { e.stopPropagation(); onStatusChange(row.id, 'COMPLETED'); }} />
                  <IconButton icon={FiPrinter} label="Print" size="sm" onClick={(e) => e.stopPropagation()} />
                  <IconButton icon={FiMoreHorizontal} label="More" size="sm" onClick={(e) => e.stopPropagation()} />
                </div>
              </article>
            );
          })
        )}
      </div>

      <QueueTimeline events={timelineEvents} title={selected ? `${getVisitorName(selected)} — Timeline` : 'Queue Timeline'} />
    </div>
  );
}
