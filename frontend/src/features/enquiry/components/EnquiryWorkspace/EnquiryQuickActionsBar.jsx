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

export default function EnquiryQuickActionsBar({
  enquiry,
  enquiryId,
  onTabChange,
  onLogged,
  onConvert,
}) {
  const [addCommunication] = useAddCommunicationMutation();

  if (!enquiryId) return null;

  const logCommunication = async (channel, summary) => {
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

  return (
    <div className="crm-enquiry-quick-bar" role="toolbar" aria-label="Quick actions">
      {ENQUIRY_QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            className="crm-enquiry-quick-bar__btn"
            onClick={() => handleAction(action)}
          >
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
