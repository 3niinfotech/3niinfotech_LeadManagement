import { useMemo } from 'react';
import { FiActivity } from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';
import { buildEnquiryHistory } from '../../utils/enquiryHistory.utils';
import HistoryChangeList from './HistoryChangeList';

/** Full change history — old value, new value, actor, time, IP */
export default function HistoryTab({ enquiry }) {
  const entries = useMemo(() => buildEnquiryHistory(enquiry), [enquiry]);

  if (!enquiry) {
    return <p className="text-sm text-text-muted text-center py-8">No history available.</p>;
  }

  return (
    <div className="crm-history-page">
      <div className="crm-history-page__head">
        <span className="crm-history-page__icon" aria-hidden>
          <FiActivity className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="crm-history-page__title">Everything</p>
          <p className="crm-history-page__desc">
            Complete audit trail for this enquiry — every change with actor and IP.
          </p>
        </div>
        <Badge color="brand" className="shrink-0">{entries.length}</Badge>
      </div>

      <HistoryChangeList entries={entries} />
    </div>
  );
}
