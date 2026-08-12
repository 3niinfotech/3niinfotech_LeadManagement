import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiPlus, FiZap } from 'react-icons/fi';
import { ENQUIRY_QUICK_ACTIONS } from '../../config/enquiryQuickActions.config';
import {
  buildTelUrl, buildWhatsAppUrl, buildMailtoUrl,
} from '../../utils/followupCalendar.utils';
import { useAddCommunicationMutation } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';

function buildCommBody(enquiry, channel) {
  const name = [enquiry?.firstName, enquiry?.lastName].filter(Boolean).join(' ');
  if (channel === 'WHATSAPP') return `Hi ${name || 'there'},`;
  if (channel === 'EMAIL') return `Hi ${name || 'there'},\n\n`;
  return '';
}

export default function QuickActionsFab({
  enquiry,
  enquiryId,
  onTabChange,
  onLogged,
  onConvert,
  hasFooter = false,
}) {
  const [open, setOpen] = useState(false);
  const [addCommunication] = useAddCommunicationMutation();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const logCommunication = async (channel, summary) => {
    if (!enquiryId) return;
    try {
      await addCommunication({
        id: enquiryId,
        channel,
        direction: 'OUTBOUND',
        status: 'SENT',
        body: summary,
        sentAt: new Date().toISOString(),
      }).unwrap();
      onLogged?.();
    } catch {
      toastService.error('Could not log activity');
    }
  };

  const runCommunication = async (action) => {
    const { channel } = action;
    const name = [enquiry?.firstName, enquiry?.lastName].filter(Boolean).join(' ');

    if (channel === 'CALL') {
      const url = buildTelUrl(enquiry?.mobile);
      if (!url) {
        toastService.info('Mobile number required');
        return;
      }
      window.location.href = url;
      await logCommunication('CALL', `Quick call to ${name || enquiry?.mobile}`);
      return;
    }

    if (channel === 'WHATSAPP') {
      const text = buildCommBody(enquiry, 'WHATSAPP');
      const url = buildWhatsAppUrl(enquiry?.mobile, text);
      if (!url) {
        toastService.info('Mobile number required');
        return;
      }
      window.open(url, '_blank', 'noopener');
      await logCommunication('WHATSAPP', text.trim());
      return;
    }

    if (channel === 'EMAIL') {
      const subject = 'Enquiry follow-up';
      const body = buildCommBody(enquiry, 'EMAIL');
      const url = buildMailtoUrl(enquiry?.email, subject, body);
      if (!url) {
        toastService.info('Email address required');
        return;
      }
      window.location.href = url;
      await logCommunication('EMAIL', subject);
    }
  };

  const handleAction = async (action) => {
    close();

    if (action.kind === 'communication') {
      await runCommunication(action);
      return;
    }

    if (action.kind === 'tab') {
      onTabChange?.(action.tab);
      return;
    }

    if (action.kind === 'convert') {
      onConvert?.();
    }
  };

  if (!enquiryId) return null;

  return (
    <div
      className="crm-quick-actions-fab"
      data-footer={hasFooter ? 'true' : 'false'}
    >
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            className="crm-quick-actions-fab__backdrop"
            aria-label="Close quick actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="crm-quick-actions-fab__menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="menu"
            aria-label="Quick actions"
          >
            {ENQUIRY_QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.li
                  key={action.id}
                  role="none"
                  initial={{ opacity: 0, y: 12, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ delay: index * 0.04, type: 'spring', stiffness: 420, damping: 28 }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="crm-quick-actions-fab__item"
                    data-tone={action.tone}
                    onClick={() => handleAction(action)}
                  >
                    <span className="crm-quick-actions-fab__item-icon" aria-hidden>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="crm-quick-actions-fab__item-label">{action.label}</span>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="crm-quick-actions-fab__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={open ? 'Close quick actions' : 'Quick actions'}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="crm-quick-actions-fab__trigger-icon" data-open={open ? 'true' : 'false'}>
          {open ? <FiPlus className="w-5 h-5" /> : <FiZap className="w-5 h-5" />}
        </span>
        {!open && <span className="crm-quick-actions-fab__trigger-text">Quick Actions</span>}
      </button>
    </div>
  );
}
