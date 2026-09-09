import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { pageEase } from '../../theme/pageMotion';
import { PORTAL_META, PORTALS } from '../../config/portal.config';
import { AUTH_BRAND, AUTH_PORTAL_THEME } from '../../config/auth.config';
import { IconArrowLeft } from './AuthIcons';
import './auth.theme.css';

const LOGIN_BG = '/assets/auth/login-bg.png';

export default function AuthShell({
  portal,
  title,
  subtitle,
  backTo = null,
  footerLinks = [],
  children,
  wide = false,
  variant = 'split',
  minimal = false,
}) {
  const meta = PORTAL_META[portal];
  const theme = AUTH_PORTAL_THEME[portal] || AUTH_PORTAL_THEME[PORTALS.ADMIN];
  const Icon = theme.icon;
  const style = {
    '--auth-accent': theme.accent,
    '--auth-accent-soft': theme.accentSoft,
    '--auth-glow': theme.glow,
    '--auth-gradient': theme.gradient,
  };

  if (variant === 'hero') {
    return (
      <div className="auth-shell auth-shell--hero" style={style}>
        <div
          className="auth-shell__hero-bg"
          style={{ backgroundImage: `url('${LOGIN_BG}')` }}
          aria-hidden="true"
        />
        <div className="auth-shell__hero-overlay" aria-hidden="true" />
        <div className="auth-shell__hero-glow" aria-hidden="true" />

        {backTo && (
          <Link to={backTo.href} className="auth-shell__hero-back-fab" aria-label={backTo.label}>
            <IconArrowLeft className="auth-icon auth-icon--sm" />
          </Link>
        )}

        <div className="auth-shell__hero-content">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: pageEase }}
            className="auth-shell__hero-card-wrap"
            style={wide ? { maxWidth: '32rem' } : undefined}
          >
            <div className={`auth-shell__card auth-shell__card--hero${minimal ? ' auth-shell__card--minimal' : ''}`}>
              <header className={`auth-shell__card-head auth-shell__card-head--hero${minimal ? ' auth-shell__card-head--minimal' : ''}`}>
                {minimal ? (
                  <span className="auth-shell__hero-mark auth-shell__hero-mark--solo">3ni</span>
                ) : (
                  <>
                    <div className="auth-shell__hero-identity">
                      <span className="auth-shell__hero-mark">3ni</span>
                      <span className="auth-shell__hero-brand-name">{AUTH_BRAND.productName}</span>
                      <span className="auth-shell__portal-badge">
                        <Icon size={13} strokeWidth={2.25} aria-hidden />
                        <span>{meta?.label}</span>
                      </span>
                    </div>
                    <div className="auth-shell__hero-divider" aria-hidden />
                    {title && <h2 className="auth-shell__card-title">{title}</h2>}
                  </>
                )}
              </header>

              <div className="auth-shell__card-body">
                {children}
              </div>

              {footerLinks.length > 0 && (
                <footer className="auth-shell__links auth-shell__links--hero">
                  {footerLinks.map((row) => (
                    <p key={row.key || row.text} className="auth-shell__link-row">
                      {row.href ? (
                        <Link to={row.href}>{row.linkLabel}</Link>
                      ) : (
                        row.text
                      )}
                    </p>
                  ))}
                </footer>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell" style={style}>
      <aside className="auth-shell__brand" aria-hidden="true">
        <div className="auth-shell__brand-grid" />
        <div className="auth-shell__brand-glow" />
        <div className="auth-shell__brand-glow auth-shell__brand-glow--2" />

        <div className="auth-shell__brand-top">
          <div className="auth-shell__product">
            <span className="auth-shell__product-mark">3ni</span>
            <span>{AUTH_BRAND.productName}</span>
          </div>
        </div>

        <div className="auth-shell__brand-body">
          <div className="auth-shell__portal-icon">
            <Icon size={22} strokeWidth={2} />
          </div>
          <h1 className="auth-shell__brand-title">{meta?.label}</h1>
          <p className="auth-shell__brand-desc">{meta?.description}</p>
          {theme.features?.length > 0 && (
            <ul className="auth-shell__features">
              {theme.features.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <p className="auth-shell__brand-foot">
          © {new Date().getFullYear()} {AUTH_BRAND.companyName} · {AUTH_BRAND.tagline}
        </p>
      </aside>

      <div className="auth-shell__main">
        {(backTo || meta?.label) && (
          <div className="auth-shell__topbar">
            {backTo ? (
              <Link to={backTo.href} className="auth-shell__back">
                <IconArrowLeft className="auth-icon auth-icon--sm" />
                {backTo.label}
              </Link>
            ) : (
              <span />
            )}
            <span className="auth-shell__mobile-badge">{meta?.label}</span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: pageEase }}
          className="auth-shell__main-inner"
          style={wide ? { maxWidth: '32rem' } : undefined}
        >
          <div className="auth-shell__card">
            <div className="auth-shell__card-head">
              <h2 className="auth-shell__card-title">{title}</h2>
              {subtitle && <p className="auth-shell__card-sub">{subtitle}</p>}
            </div>

            {children}

            {footerLinks.length > 0 && (
              <div className="auth-shell__links">
                {footerLinks.map((row) => (
                  <p key={row.key || row.text} className="auth-shell__link-row">
                    {row.text}{' '}
                    {row.href && (
                      <Link to={row.href}>{row.linkLabel}</Link>
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>

          <p className="auth-shell__foot">
            Secure sign-in · {AUTH_BRAND.productName} by {AUTH_BRAND.companyName}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
