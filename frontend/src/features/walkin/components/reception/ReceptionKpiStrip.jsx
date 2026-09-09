import SummaryStatBar from '../../../../components/ui/SummaryStatBar';

/**
 * Reception KPIs — shared SummaryStatBar theme (same as Enquiry / Demo / Applications).
 */
export default function ReceptionKpiStrip({
  items = [],
  activeFilter,
  onSelect,
  loading = false,
}) {
  return (
    <div className="crm-reception-kpi-bar shrink-0 overflow-hidden rounded-xl border border-border bg-card-bg">
      <SummaryStatBar
        items={items}
        activeFilter={activeFilter}
        onSelect={onSelect}
        loading={loading}
        ariaLabel="Reception visitor filters"
        layout="grid"
      />
    </div>
  );
}
