import { useMemo } from 'react';
import { FiPhone, FiMessageSquare, FiMail, FiUsers, FiActivity } from 'react-icons/fi';
import FormSection from '../../../../components/ui/FormSection';
import { buildActivityHeatmap } from '../../utils/enquiryActivityHeatmap.utils';

const STAT_ITEMS = [
  { key: 'calls', label: 'Calls', icon: FiPhone, tone: 'primary' },
  { key: 'whatsapp', label: 'WhatsApp', icon: FiMessageSquare, tone: 'success' },
  { key: 'emails', label: 'Emails', icon: FiMail, tone: 'info' },
  { key: 'meetings', label: 'Meetings', icon: FiUsers, tone: 'warning' },
];

function formatCellTitle(cell) {
  const label = cell.date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  if (!cell.inRange) return `${label} — outside range`;
  if (cell.count === 0) return `${label} — no activity`;
  if (cell.count === 1) return `${label} — 1 activity`;
  return `${label} — ${cell.count} activities`;
}

export default function ActivityHeatmapPanel({ enquiry }) {
  const heatmap = useMemo(() => buildActivityHeatmap(enquiry), [enquiry]);

  if (!enquiry?.id) {
    return (
      <FormSection
        title="Activity Heatmap"
        description="Engagement breakdown across calls, messages, email, and meetings."
      >
        <p className="text-sm text-text-muted text-center py-6 border border-dashed border-border rounded-lg">
          Activity heatmap will appear once the enquiry is saved.
        </p>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Activity Heatmap"
      description="Engagement breakdown across calls, messages, email, and meetings."
    >
      <div className="crm-activity-heatmap">
        <div className="crm-activity-heatmap__stats">
          {STAT_ITEMS.map(({ key, label, icon: Icon, tone }) => (
            <div key={key} className="crm-activity-heatmap__stat" data-tone={tone}>
              <span className="crm-activity-heatmap__stat-icon" aria-hidden>
                <Icon className="w-4 h-4" />
              </span>
              <div>
                <p className="crm-activity-heatmap__stat-label">{label}</p>
                <p className="crm-activity-heatmap__stat-value">{heatmap.counts[key]}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="crm-activity-heatmap__grid-wrap">
          <div className="crm-activity-heatmap__grid-head">
            <span className="crm-activity-heatmap__range">
              <FiActivity className="w-3.5 h-3.5" />
              Last 12 weeks
              <span className="crm-activity-heatmap__range-dates">{heatmap.rangeLabel}</span>
            </span>
            <span className="crm-activity-heatmap__total">
              {heatmap.total}
              {' '}
              total
            </span>
          </div>

          <div className="crm-activity-heatmap__grid">
            <div className="crm-activity-heatmap__day-labels" aria-hidden>
              {heatmap.dayLabels.map((label) => (
                <span key={label} className="crm-activity-heatmap__day-label">{label}</span>
              ))}
            </div>

            <div className="crm-activity-heatmap__cells" role="img" aria-label="Activity heatmap for the last 12 weeks">
              {heatmap.columns.map((week) => (
                <div key={week[0]?.dateKey} className="crm-activity-heatmap__week">
                  {week.map((cell) => (
                    <span
                      key={cell.dateKey}
                      className="crm-activity-heatmap__cell"
                      data-level={cell.level}
                      data-in-range={cell.inRange ? 'true' : 'false'}
                      title={formatCellTitle(cell)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="crm-activity-heatmap__legend" aria-hidden>
            <span>Less</span>
            <span className="crm-activity-heatmap__cell" data-level="0" />
            <span className="crm-activity-heatmap__cell" data-level="1" />
            <span className="crm-activity-heatmap__cell" data-level="2" />
            <span className="crm-activity-heatmap__cell" data-level="3" />
            <span className="crm-activity-heatmap__cell" data-level="4" />
            <span>More</span>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
