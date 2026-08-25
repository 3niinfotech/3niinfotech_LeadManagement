import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiPhone, FiMessageCircle, FiMail, FiCopy, FiLayout, FiClock, FiEdit3,
} from 'react-icons/fi';
import IconButton from '../../../../components/ui/IconButton';
import ScrollArea from '../../../../components/ui/ScrollArea';
import WalkInStatusBadge from '../WalkInStatusBadge';
import WalkInPriorityBadge from '../WalkInPriorityBadge';
import toastService from '../../../../services/toast/toast.service';
import { buildTelUrl, buildWhatsAppUrl, buildMailtoUrl } from '../../../enquiry/utils/followupCalendar.utils';

const TAB_ICONS = { layout: FiLayout, clock: FiClock, edit: FiEdit3 };

function getInitials(lead) {
  const first = lead?.firstName?.[0] || '';
  const last = lead?.lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function QuickAction({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      className="crm-walkin-quick-action"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={disabled ? `${label} not available` : label}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden />
    </button>
  );
}

export default function WalkInProfileModal({
  open,
  onClose,
  lead,
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
}) {
  if (typeof document === 'undefined') return null;

  const name = `${lead?.firstName || ''} ${lead?.lastName || ''}`.trim() || 'Visitor profile';
  const phone = lead?.phone?.trim();
  const email = lead?.email?.trim();

  const openUrl = (url, missing, sameTab = false) => {
    if (!url) {
      toastService.info(missing);
      return;
    }
    window.open(url, sameTab ? '_self' : '_blank', 'noopener');
  };

  const copy = async (value, label) => {
    if (!value) {
      toastService.info(`${label} not available`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toastService.success(`${label} copied`);
    } catch {
      toastService.error('Could not copy');
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="crm-walkin-profile-root" role="dialog" aria-modal="true" aria-labelledby="walkin-profile-title">
          <motion.button
            type="button"
            className="crm-walkin-profile-backdrop"
            aria-label="Close profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="crm-walkin-profile-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
          >
            <header className="crm-walkin-profile-head">
              <div className="crm-walkin-profile-head__row">
                <span className="crm-walkin-profile-head__avatar" aria-hidden>
                  {getInitials(lead)}
                </span>

                <div className="crm-walkin-profile-head__info min-w-0">
                  <div className="crm-walkin-profile-head__title-row">
                    <h2 id="walkin-profile-title" className="crm-walkin-profile-head__name">{name}</h2>
                    {lead?.leadCode && (
                      <span className="crm-walkin-profile-head__code">{lead.leadCode}</span>
                    )}
                  </div>
                  {lead && (
                    <div className="crm-walkin-profile-head__chips">
                      <WalkInStatusBadge status={lead.status} compact />
                      {lead.priority && lead.priority !== 'NORMAL' && (
                        <WalkInPriorityBadge priority={lead.priority} />
                      )}
                      <span className="crm-walkin-profile-head__time">
                        {formatDateTime(lead.walkInAt || lead.createdAt)}
                      </span>
                    </div>
                  )}
                </div>

                {lead && (
                  <div className="crm-walkin-profile-head__quick">
                    <QuickAction
                      icon={FiPhone}
                      label="Call"
                      disabled={!phone}
                      onClick={() => openUrl(buildTelUrl(phone), 'Mobile not available', true)}
                    />
                    <QuickAction
                      icon={FiMessageCircle}
                      label="WhatsApp"
                      disabled={!phone}
                      onClick={() => openUrl(buildWhatsAppUrl(phone, `Hi ${lead.firstName || ''},`), 'Mobile not available')}
                    />
                    <QuickAction
                      icon={FiMail}
                      label="Email"
                      disabled={!email}
                      onClick={() => openUrl(buildMailtoUrl(email, `Regarding your visit (${lead.leadCode || ''})`), 'Email not available', true)}
                    />
                    <QuickAction
                      icon={FiCopy}
                      label="Copy number"
                      disabled={!phone}
                      onClick={() => copy(phone, 'Mobile')}
                    />
                  </div>
                )}

                <IconButton icon={FiX} onClick={onClose} label="Close" className="shrink-0" />
              </div>

              <nav className="crm-walkin-tabs" role="tablist" aria-label="Profile sections">
                {tabs.map((tab) => {
                  const Icon = TAB_ICONS[tab.icon] || FiLayout;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => onTabChange(tab.id)}
                      className={`crm-walkin-tab${active ? ' is-active' : ''}`}
                    >
                      <Icon className="w-3.5 h-3.5" aria-hidden />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </header>

            <ScrollArea axis="y" className="crm-walkin-profile-body">
              <div key={activeTab} className="crm-walkin-profile-body__panel">
                {children}
              </div>
            </ScrollArea>

            {footer && <div className="crm-walkin-profile-footer">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
