import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import {
  LANDING_BRAND,
  LANDING_HEADER_LOGINS,
  LANDING_NAV,
} from '../../../config/landing.config';
import { resolvePublicAssetUrl } from '../../../config/company-settings.config';

export default function LandingHeader({ companyName, logoUrl }) {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const name = companyName || LANDING_BRAND.name;
  const logo = resolvePublicAssetUrl(logoUrl);

  return (
    <header className={`landing-header ${solid ? 'landing-header--solid' : ''}`}>
      <div className="landing-container landing-header__inner">
        <Link to="/" className="landing-brand" aria-label={`${name} home`}>
          {logo ? (
            <img src={logo} alt="" className="landing-brand__logo" />
          ) : (
            <span className="landing-brand__mark" aria-hidden>3i</span>
          )}
          <span className="landing-brand__name">{name}</span>
        </Link>

        <nav className="landing-nav" aria-label="Primary">
          {LANDING_NAV.map((item) => (
            <a key={item.id} href={item.href}>{item.label}</a>
          ))}
        </nav>

        <div className="landing-header__actions">
          {LANDING_HEADER_LOGINS.map((item) => (
            item.variant === 'register' ? (
              <Link key={item.id} to={item.href} className="landing-btn landing-btn--student landing-header__register">
                {item.label}
              </Link>
            ) : (
              <Link key={item.id} to={item.href} className="landing-header__link">{item.label}</Link>
            )
          ))}
        </div>

        <button
          type="button"
          className="landing-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
        </button>
      </div>

      <div
        id="landing-mobile-menu"
        className={`landing-mobile-nav ${menuOpen ? 'landing-mobile-nav--open' : ''}`}
      >
        {LANDING_NAV.map((item) => (
          <a key={item.id} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
        ))}
        <hr style={{ border: 0, borderTop: '1px solid var(--lp-line)', margin: '0.5rem 0' }} />
        {LANDING_HEADER_LOGINS.map((item) => (
          item.variant === 'register' ? (
            <Link key={item.id} to={item.href} className="landing-btn landing-btn--student" onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ) : (
            <Link key={item.id} to={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
          )
        ))}
      </div>
    </header>
  );
}
