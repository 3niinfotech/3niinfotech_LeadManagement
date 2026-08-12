import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHash, FiTag } from 'react-icons/fi';
import IconButton from '../../../../components/ui/IconButton';
import ProfileTabs from '../../../../components/ui/ProfileTabs';
import FormTabPanel from '../../../../components/ui/FormTabPanel';
import ScrollArea from '../../../../components/ui/ScrollArea';
import WalkInStatusBadge from '../WalkInStatusBadge';
import WalkInPriorityBadge from '../WalkInPriorityBadge';
import { navbar as navbarTheme } from '../../../../theme';

const NAVBAR_HEIGHT = navbarTheme.height || '64px';

function getInitials(lead) {
  const first = lead?.firstName?.[0] || '';
  const last = lead?.lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

export default function WalkInProfileModal({
  open,
  onClose,
  title,
  subtitle,
  lead,
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
}) {
  if (typeof document === 'undefined') return null;

  const name = lead
    ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
    : title;

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
            style={{ top: NAVBAR_HEIGHT, height: `calc(100% - ${NAVBAR_HEIGHT})` }}
          >
            {/* Hero header */}
            <div className="crm-walkin-profile-hero">
              <div className="crm-walkin-profile-hero__glow" aria-hidden />
              <div className="crm-walkin-profile-hero__main">
                <div className="crm-walkin-profile-hero__avatar" aria-hidden>
                  {getInitials(lead)}
                </div>
                <div className="crm-walkin-profile-hero__info min-w-0">
                  <p className="crm-walkin-profile-hero__eyebrow">Reception · Walk-in Lead</p>
                  <h2 id="walkin-profile-title" className="crm-walkin-profile-hero__name">
                    {name || 'Lead Profile'}
                  </h2>
                  {subtitle && (
                    <p className="crm-walkin-profile-hero__meta">{subtitle}</p>
                  )}
                  {lead && (
                    <div className="crm-walkin-profile-hero__chips">
                      <WalkInStatusBadge status={lead.status} compact />
                      <WalkInPriorityBadge priority={lead.priority} />
                    </div>
                  )}
                </div>
                <IconButton icon={FiX} onClick={onClose} label="Close" className="crm-walkin-profile-hero__close shrink-0" />
              </div>

              {lead && (
                <div className="crm-walkin-profile-hero__ids">
                  <div className="crm-walkin-profile-id-pill crm-walkin-profile-id-pill--token">
                    <FiTag className="crm-walkin-profile-id-pill__icon" aria-hidden />
                    <div>
                      <span className="crm-walkin-profile-id-pill__label">Token</span>
                      <span className="crm-walkin-profile-id-pill__value">{lead.tokenNumber || '—'}</span>
                    </div>
                  </div>
                  <div className="crm-walkin-profile-id-pill">
                    <FiHash className="crm-walkin-profile-id-pill__icon" aria-hidden />
                    <div>
                      <span className="crm-walkin-profile-id-pill__label">Lead ID</span>
                      <span className="crm-walkin-profile-id-pill__value">{lead.leadCode || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs — compact icons + horizontal scroll */}
            <div className="crm-walkin-profile-tabs-shell">
              <ProfileTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={onTabChange}
                layoutId="crm-walkin-profile-tab"
                compact
              />
            </div>

            <ScrollArea axis="y" className="crm-walkin-profile-body flex-1 min-h-0">
              <FormTabPanel panelKey={activeTab} className="crm-walkin-profile-body__panel">
                {children}
              </FormTabPanel>
            </ScrollArea>

            {footer && (
              <div className="crm-walkin-profile-footer">
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
