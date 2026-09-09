import { FiUsers, FiUser, FiBriefcase } from 'react-icons/fi';
import { PORTALS } from './portal.config';
import { LANDING_BRAND } from './landing.config';

export { PORTALS };

export const AUTH_BRAND = {
  productName: LANDING_BRAND.productName || 'VisaERP',
  companyName: LANDING_BRAND.name || '3ni Infotech',
  tagline: 'Education ERP · Student Lifecycle · Visa Processing',
};

export const AUTH_PORTAL_THEME = {
  [PORTALS.ADMIN]: {
    icon: FiUsers,
    accent: '#2563eb',
    accentSoft: '#eff6ff',
    gradient: 'linear-gradient(145deg, #1e3a8a 0%, #2563eb 48%, #3b82f6 100%)',
    glow: 'rgba(37, 99, 235, 0.35)',
    features: [
      'Leads, enquiries & student pipeline',
      'Role-based access for counsellors & admin',
      'Branch-wise dashboards & reports',
    ],
  },
  [PORTALS.STUDENT]: {
    icon: FiUser,
    accent: '#059669',
    accentSoft: '#ecfdf5',
    gradient: 'linear-gradient(145deg, #065f46 0%, #059669 48%, #10b981 100%)',
    glow: 'rgba(5, 150, 105, 0.35)',
    features: [
      'Track applications & visa status',
      'Classes, attendance & documents',
      'Fees, reminders & journey updates',
    ],
  },
  [PORTALS.AGENT]: {
    icon: FiBriefcase,
    accent: '#7c3aed',
    accentSoft: '#f5f3ff',
    gradient: 'linear-gradient(145deg, #5b21b6 0%, #7c3aed 48%, #8b5cf6 100%)',
    glow: 'rgba(124, 58, 237, 0.35)',
    features: [
      'Manage referred students',
      'Commission & application tracking',
      'Partner workspace & notifications',
    ],
  },
};

export const AUTH_PORTAL_CARDS = [
  { portal: PORTALS.ADMIN },
  { portal: PORTALS.STUDENT },
  { portal: PORTALS.AGENT },
];
