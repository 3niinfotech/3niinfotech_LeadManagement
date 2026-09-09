import { FiActivity, FiClock } from 'react-icons/fi';
import EnquiryTimelineItem from '../../../../enquiry/components/EnquiryDrawer/EnquiryTimelineItem';
import { groupTimelineByDate } from '../../../../enquiry/utils/enquiryTimeline.utils';

export default function StudentTimelineTab({ rows = [] }) {
  const grouped = groupTimelineByDate(rows);

  if (!rows.length) {
    return (
      <div className="crm-timeline crm-timeline--empty">
        <div className="crm-timeline__empty">
          <span className="crm-timeline__empty-icon" aria-hidden>
            <FiActivity className="w-5 h-5" />
          </span>
          <h3 className="crm-timeline__empty-title">No activity yet</h3>
          <p className="crm-timeline__empty-desc">
            Enquiry events, follow-ups, demos, documents and student updates will appear here.
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
            <p className="crm-timeline__subheading">Chronological audit of this student journey</p>
          </div>
        </div>
        <span className="crm-timeline__count">{rows.length}</span>
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
