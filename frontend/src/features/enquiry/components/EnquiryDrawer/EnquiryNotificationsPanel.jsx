import { useMemo } from 'react';
import { FiBell, FiCheckCircle, FiChevronRight } from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';
import FormSection from '../../../../components/ui/FormSection';
import {
  buildEnquiryNotifications,
  groupNotificationsByType,
} from '../../utils/enquiryNotifications.utils';

const TONE_MAP = {
  danger: 'danger',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  info: 'info',
};

export default function EnquiryNotificationsPanel({ enquiry, onNavigateTab }) {
  const notifications = useMemo(() => buildEnquiryNotifications(enquiry), [enquiry]);
  const groups = useMemo(() => groupNotificationsByType(notifications), [notifications]);

  if (!enquiry?.id) {
    return (
      <FormSection
        title="Notifications"
        description="Follow-ups, appointments, demos, documents, and payments."
      >
        <p className="text-sm text-text-muted text-center py-6 border border-dashed border-border rounded-lg">
          Notifications will appear once the enquiry is saved.
        </p>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Notifications"
      description="Follow-ups, appointments, demos, documents, and payments."
    >
      <div className="crm-enquiry-notifications">
        <div className="crm-enquiry-notifications__head">
          <span className="crm-enquiry-notifications__head-icon" aria-hidden>
            <FiBell className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="crm-enquiry-notifications__head-title">
              {notifications.length === 0 ? 'All clear' : `${notifications.length} active alert${notifications.length > 1 ? 's' : ''}`}
            </p>
            <p className="crm-enquiry-notifications__head-desc">
              {notifications.length === 0
                ? 'No pending follow-ups, appointments, or actions.'
                : 'Tap an alert to jump to the relevant section.'}
            </p>
          </div>
          {notifications.length > 0 && (
            <Badge color="danger" className="shrink-0">{notifications.length}</Badge>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="crm-enquiry-notifications__empty">
            <FiCheckCircle className="w-8 h-8 text-success" />
            <p>No pending notifications</p>
          </div>
        ) : (
          <div className="crm-enquiry-notifications__groups">
            {groups.map(({ type, items }) => {
              const Icon = type.icon;
              return (
                <div key={type.id} className="crm-enquiry-notifications__group">
                  <div className="crm-enquiry-notifications__group-head">
                    <span className="crm-enquiry-notifications__group-icon" data-tone={type.tone}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="crm-enquiry-notifications__group-label">{type.label}</span>
                    <Badge color={TONE_MAP[type.tone] || 'secondary'} className="ml-auto">
                      {items.length}
                    </Badge>
                  </div>

                  <ul className="crm-enquiry-notifications__list">
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="crm-enquiry-notifications__item"
                          data-tone={type.tone}
                          onClick={() => onNavigateTab?.(type.tab)}
                        >
                          <div className="min-w-0 flex-1 text-left">
                            <p className="crm-enquiry-notifications__item-title">{item.title}</p>
                            <p className="crm-enquiry-notifications__item-message">{item.message}</p>
                          </div>
                          <div className="crm-enquiry-notifications__item-meta">
                            {item.meta && (
                              <span className="crm-enquiry-notifications__item-time">{item.meta}</span>
                            )}
                            <FiChevronRight className="w-4 h-4 shrink-0 opacity-60" />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FormSection>
  );
}
