export default function TimelineTab({ lead }) {
  const items = lead?.activities || [];

  if (!items.length) {
    return <p className="text-sm text-text-secondary py-6 text-center">No timeline activity yet.</p>;
  }

  return (
    <ul className="crm-walkin-timeline space-y-3">
      {items.map((item) => (
        <li key={item.id} className="crm-walkin-timeline__item">
          <div className="crm-walkin-timeline__dot" />
          <div>
            <p className="text-sm font-medium text-text">{item.description || item.action}</p>
            <p className="text-xs text-text-muted mt-0.5">
              {item.user ? `${item.user.firstName} ${item.user.lastName || ''}`.trim() : 'System'}
              {' · '}
              {new Date(item.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
