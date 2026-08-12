import {
  FiUser, FiBookOpen, FiUsers, FiClock, FiMessageSquare,
} from 'react-icons/fi';

function InfoSection({ icon: Icon, title, children }) {
  return (
    <section className="crm-walkin-info-section">
      <header className="crm-walkin-info-section__head">
        <span className="crm-walkin-info-section__icon" aria-hidden>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <h3 className="crm-walkin-info-section__title">{title}</h3>
      </header>
      <div className="crm-walkin-info-section__body">
        {children}
      </div>
    </section>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="crm-walkin-info-field">
      <span className="crm-walkin-info-field__label">{label}</span>
      <span className="crm-walkin-info-field__value">{value || '—'}</span>
    </div>
  );
}

export default function OverviewTab({ lead }) {
  if (!lead) return null;

  const name = `${lead.firstName} ${lead.lastName || ''}`.trim();
  const counsellor = lead.assignedTo
    ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName || ''}`.trim()
    : '—';
  const reception = lead.receptionUser
    ? `${lead.receptionUser.firstName} ${lead.receptionUser.lastName || ''}`.trim()
    : '—';

  return (
    <div className="crm-walkin-overview space-y-4">
      <InfoSection icon={FiUser} title="Contact">
        <div className="crm-walkin-info-grid">
          <InfoField label="Full Name" value={name} />
          <InfoField label="Mobile" value={lead.phone} />
          <InfoField label="Email" value={lead.email} />
        </div>
      </InfoSection>

      <InfoSection icon={FiBookOpen} title="Study Interest">
        <div className="crm-walkin-info-grid">
          <InfoField label="Interested Country" value={lead.country} />
          <InfoField label="Interested Course" value={lead.interestedCourse} />
          <InfoField label="Lead Source" value={lead.source} />
        </div>
      </InfoSection>

      <InfoSection icon={FiUsers} title="Assignment">
        <div className="crm-walkin-info-grid">
          <InfoField label="Branch" value={lead.branch?.name} />
          <InfoField label="Counsellor" value={counsellor} />
          <InfoField label="Reception" value={reception} />
        </div>
      </InfoSection>

      <InfoSection icon={FiClock} title="Visit">
        <div className="crm-walkin-info-grid">
          <InfoField
            label="Walk-in Time"
            value={lead.walkInAt ? new Date(lead.walkInAt).toLocaleString('en-IN') : '—'}
          />
          <InfoField label="Remarks" value={lead.notes} />
        </div>
      </InfoSection>

      {lead.enquiry && (
        <div className="crm-walkin-linked-banner">
          <FiMessageSquare className="w-4 h-4 shrink-0 text-[var(--brand)]" aria-hidden />
          <span>
            Linked enquiry <strong>{lead.enquiry.enquiryCode}</strong> — same lifecycle record
          </span>
        </div>
      )}
    </div>
  );
}
