import {
  FiBriefcase,
  FiInbox,
  FiLayers,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';

export function WorkloadStats({ workload }) {
  if (!workload) return null;

  const items = [
    {
      label: 'Enquiries',
      value: workload.enquiries,
      icon: FiInbox,
      tone: 'border-brand/15 bg-brand-soft/60 text-brand',
    },
    {
      label: 'Leads',
      value: workload.leads,
      icon: FiUserPlus,
      tone: 'border-info/15 bg-info-soft/60 text-info',
    },
    {
      label: 'Students',
      value: workload.students,
      icon: FiUsers,
      tone: 'border-success/15 bg-success-soft/60 text-success',
    },
    {
      label: 'Total assigned',
      value: workload.total,
      icon: FiLayers,
      tone: 'border-border bg-page text-text',
    },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-2.5">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className={`min-w-0 rounded-xl border p-3 transition-transform duration-200 hover:-translate-y-0.5 ${tone}`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card-bg/80 shadow-sm">
              <Icon className="h-4 w-4" />
            </span>
            <strong className="text-xl font-bold leading-none tabular-nums">{value ?? 0}</strong>
          </div>
          <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-wide text-text-muted" title={label}>
            {label}
          </p>
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
