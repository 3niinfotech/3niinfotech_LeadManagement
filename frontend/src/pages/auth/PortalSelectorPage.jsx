import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { pageEase } from '../../theme/pageMotion';
import { ROUTES } from '../../config/routes';
import { PORTAL_META } from '../../config/portal.config';
import { AUTH_BRAND, AUTH_PORTAL_CARDS, AUTH_PORTAL_THEME } from '../../config/auth.config';
import '../../components/auth/auth.theme.css';

export default function PortalSelectorPage() {
  return (
    <div className="auth-portal-page">
      <div className="auth-portal-page__top">
        <Link to={ROUTES.LANDING || '/'} className="auth-portal-page__brand">
          <span className="auth-portal-page__brand-mark">3ni</span>
          <span className="auth-portal-page__brand-name">{AUTH_BRAND.productName}</span>
        </Link>
        <Link to={ROUTES.LANDING || '/'} className="auth-portal-page__home">
          Back to home
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: pageEase }}
        className="auth-portal-page__hero"
      >
        <h1>Choose your portal</h1>
        <p>
          Sign in to {AUTH_BRAND.productName} — pick the workspace that matches your role.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: pageEase, delay: 0.06 }}
        className="auth-portal-page__grid"
      >
        {AUTH_PORTAL_CARDS.map(({ portal }) => {
          const meta = PORTAL_META[portal];
          const theme = AUTH_PORTAL_THEME[portal];
          const Icon = theme.icon;
          return (
            <Link
              key={portal}
              to={meta.loginPath}
              className="auth-portal-card"
              style={{
                '--auth-accent': theme.accent,
                borderColor: 'transparent',
              }}
            >
              <div
                className="auth-portal-card__icon"
                style={{ background: theme.gradient }}
              >
                <Icon size={20} />
              </div>
              <h2 className="auth-portal-card__title">{meta.label}</h2>
              <p className="auth-portal-card__desc">{meta.description}</p>
              <span className="auth-portal-card__cta" style={{ color: theme.accent }}>
                Continue
                <FiArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </motion.div>

      <p className="auth-portal-page__foot">
        © {new Date().getFullYear()} {AUTH_BRAND.companyName} ·{' '}
        <Link to={ROUTES.APPLY} style={{ color: 'var(--brand, #2563eb)', fontWeight: 600 }}>Apply to join our team</Link>
      </p>
    </div>
  );
}
