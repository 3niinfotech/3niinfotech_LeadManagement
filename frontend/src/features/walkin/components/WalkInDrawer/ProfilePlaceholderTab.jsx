import { FiMessageSquare, FiCheckSquare } from 'react-icons/fi';

export default function PlaceholderTab({ icon: Icon, title, description }) {
  return (
    <div className="crm-placeholder-tab">
      <Icon className="w-8 h-8 text-text-muted mb-2" />
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="text-sm text-text-secondary mt-1 max-w-md">{description}</p>
    </div>
  );
}

export function CommunicationTab() {
  return (
    <PlaceholderTab
      icon={FiMessageSquare}
      title="Communication"
      description="Calls and WhatsApp will appear here as the lead profile grows through counselling."
    />
  );
}

export function TasksTab() {
  return (
    <PlaceholderTab
      icon={FiCheckSquare}
      title="Tasks"
      description="Counsellor tasks for this lead will be tracked here in the next release."
    />
  );
}

export function ActivityTab({ lead }) {
  const items = lead?.activities || [];
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.id} className="text-sm border border-border rounded-lg px-3 py-2">
          <span className="font-medium text-text">{a.action}</span>
          {a.description && <span className="text-text-secondary"> — {a.description}</span>}
        </div>
      ))}
      {!items.length && <p className="text-sm text-text-secondary">No activity records.</p>}
    </div>
  );
}
