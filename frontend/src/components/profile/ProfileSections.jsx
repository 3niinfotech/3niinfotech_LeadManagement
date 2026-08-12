import { FiBriefcase, FiMail, FiMapPin, FiPhone, FiUser } from 'react-icons/fi';

export function WorkloadStats({ workload }) {
  if (!workload) return null;

  const items = [
    { label: 'Enquiries', value: workload.enquiries, color: 'text-brand bg-brand-soft' },
    { label: 'Leads', value: workload.leads, color: 'text-info bg-info-soft' },
    { label: 'Students', value: workload.students, color: 'text-success bg-success-soft' },
    { label: 'Total assigned', value: workload.total, color: 'text-text bg-row-hover' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className={`rounded-xl border border-border p-3 ${item.color.split(' ').slice(1).join(' ')}`}>
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide">{item.label}</p>
          <p className={`text-2xl font-bold mt-1 tabular-nums ${item.color.split(' ')[0]}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

export function ProfileInfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-soft text-brand shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-text mt-0.5 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

export { FiBriefcase, FiMail, FiMapPin, FiPhone, FiUser };
