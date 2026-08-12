import { useMemo } from 'react';
import { FiActivity } from 'react-icons/fi';
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
          <div key={i} className="h-16 rounded-lg bg-row-hover animate-pulse" />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="crm-profile-placeholder">
        <div className="crm-profile-placeholder__icon">
          <FiActivity className="w-6 h-6" />
        </div>
        <h3 className="crm-profile-placeholder__title">No activity yet</h3>
        <p className="crm-profile-placeholder__desc">
          Every action on this enquiry — updates, follow-ups, notes, documents — will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="crm-timeline">
      <header className="crm-timeline__header">
        <h3 className="crm-timeline__heading">Timeline</h3>
        <p className="crm-timeline__subheading">Every action · {events.length} event{events.length === 1 ? '' : 's'}</p>
      </header>

      <div className="crm-timeline__groups">
        {grouped.map(([dateLabel, items]) => (
          <section key={dateLabel} className="crm-timeline__group">
            <h4 className="crm-timeline__date">{dateLabel}</h4>
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
