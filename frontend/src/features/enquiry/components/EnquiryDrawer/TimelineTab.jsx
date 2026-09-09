import { useMemo } from 'react';
import { FiActivity, FiClock } from 'react-icons/fi';
import { useGetTimelineQuery } from '../../redux/enquiryApiSlice';
import EnquiryTimelineItem from './EnquiryTimelineItem';
import {
  groupTimelineByDate,
  mergeTimelineEvents,
} from '../../utils/enquiryTimeline.utils';

export default function TimelineTab({ enquiryId, enquiry }) {
  const { data: auditLogs = [], isLoading } = useGetTimelineQuery(enquiryId, { skip: !enquiryId });

  const events = useMemo(
    () => mergeTimelineEvents(auditLogs, enquiry),
    [auditLogs, enquiry],
  );

  const grouped = useMemo(() => groupTimelineByDate(events), [events]);

  if (isLoading) {
    return (
      <div className="crm-timeline-loading">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-row-hover animate-pulse" />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="crm-timeline crm-timeline--empty">
        <div className="crm-timeline__empty">
          <span className="crm-timeline__empty-icon" aria-hidden>
            <FiActivity className="w-5 h-5" />
          </span>
          <h3 className="crm-timeline__empty-title">No activity yet</h3>
          <p className="crm-timeline__empty-desc">
            Status changes, follow-ups, notes, and documents show up here as they happen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-timeline crm-timeline--advanced">
      <header className="crm-timeline__header">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="crm-timeline__header-icon" aria-hidden>
            <FiClock className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <h3 className="crm-timeline__heading">Activity timeline</h3>
            <p className="crm-timeline__subheading">
              Chronological audit of this enquiry
            </p>
          </div>
        </div>
        <span className="crm-timeline__count">{events.length}</span>
      </header>

      <div className="crm-timeline__groups">
        {grouped.map(([dateLabel, items]) => (
          <section key={dateLabel} className="crm-timeline__group">
            <div className="crm-timeline__date-row">
              <h4 className="crm-timeline__date">{dateLabel}</h4>
              <span className="crm-timeline__date-count">{items.length}</span>
            </div>
            <div className="crm-timeline__list">
              {items.map((entry) => (
                <EnquiryTimelineItem key={entry.id} entry={entry} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
