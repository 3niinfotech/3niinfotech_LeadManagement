import { ROUTES } from './routes';

export const footerConfig = {
  brand: {
    product: 'Lead Management CRM',
  },
  links: [
    { id: 'terms', label: 'Terms of Use', path: ROUTES.TERMS },
    { id: 'privacy', label: 'Privacy Policy', path: ROUTES.PRIVACY },
    { id: 'blog', label: 'Blog', path: ROUTES.BLOG },
    { id: 'help', label: 'Help & Support', path: ROUTES.HELP },
    { id: 'docs', label: 'Documentation', path: ROUTES.DOCUMENTATION },
  ],
};
