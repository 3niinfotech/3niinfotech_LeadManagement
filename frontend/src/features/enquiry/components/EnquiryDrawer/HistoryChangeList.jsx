import { FiArrowDown, FiGlobe, FiUser, FiClock } from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';

function HistoryStep({ label, value, icon: Icon, mono = false }) {
  return (
    <div className="crm-history-change__step">
      <div className="crm-history-change__step-label">
        {Icon && <Icon className="w-3 h-3" aria-hidden />}
        <span>{label}</span>
      </div>
      <p className={`crm-history-change__step-value${mono ? ' crm-history-change__step-value--mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

export function HistoryChangeCard({ entry }) {
  return (
    <article className="crm-history-change">
      <div className="crm-history-change__head">
        <p className="crm-history-change__title">{entry.title}</p>
        <Badge color="secondary">{entry.action}</Badge>
      </div>

      <div className="crm-history-change__flow" aria-label="Change details">
        <HistoryStep label="Old Value" value={entry.oldValue} />
        <div className="crm-history-change__arrow" aria-hidden>
          <FiArrowDown className="w-4 h-4" />
        </div>
        <HistoryStep label="New Value" value={entry.newValue} />
        <div className="crm-history-change__arrow" aria-hidden>
          <FiArrowDown className="w-4 h-4" />
        </div>
        <HistoryStep label="Who Changed" value={entry.who} icon={FiUser} />
        <div className="crm-history-change__arrow" aria-hidden>
          <FiArrowDown className="w-4 h-4" />
        </div>
        <HistoryStep label="When" value={entry.whenLabel} icon={FiClock} />
        <div className="crm-history-change__arrow" aria-hidden>
          <FiArrowDown className="w-4 h-4" />
        </div>
        <HistoryStep label="IP" value={entry.ip} icon={FiGlobe} mono />
      </div>

      {entry.description && entry.description !== entry.newValue && (
        <p className="crm-history-change__note">{entry.description}</p>
      )}
    </article>
  );
}

export default function HistoryChangeList({ entries }) {
  if (!entries.length) {
    return (
      <p className="text-sm text-text-muted text-center py-8 border border-dashed border-border rounded-lg">
        No history recorded yet.
      </p>
    );
  }

  return (
    <div className="crm-history-change-list">
      {entries.map((entry) => (
        <HistoryChangeCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
