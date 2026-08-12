import { FiPhone, FiMail } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

/** Minimal outreach actions on enquiry profile */
export const ENQUIRY_QUICK_ACTIONS = [
  { id: 'call', label: 'Call', icon: FiPhone, tone: 'primary', kind: 'communication', channel: 'CALL' },
  { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, tone: 'success', kind: 'communication', channel: 'WHATSAPP' },
  { id: 'email', label: 'Email', icon: FiMail, tone: 'info', kind: 'communication', channel: 'EMAIL' },
];
