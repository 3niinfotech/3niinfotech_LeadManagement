import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck, FiLock, FiRefreshCw, FiUserPlus, FiUsers } from 'react-icons/fi';
import { pageEase } from '../../../theme/pageMotion';
import { ROUTES } from '../../../config/routes';

function ProductPreview() {
  return (
    <div className="landing-product-shell" aria-hidden>
      <div className="landing-product-shell__chrome">
        <span className="landing-product-shell__dot" />
        <span className="landing-product-shell__dot" />
        <span className="landing-product-shell__dot" />
        <span className="landing-product-shell__url">app / enquiries / pipeline</span>
      </div>
      <div className="landing-product-grid">
        <div className="landing-mock-card">
          <p className="landing-mock-card__label">Enquiry pipeline</p>
          <div className="landing-mock-pipeline">
            <div className="landing-mock-row">
              <strong>Mehul Trivedi</strong>
              <span className="landing-mock-badge landing-mock-badge--blue">Follow-up</span>
            </div>
            <div className="landing-mock-row">
              <strong>Priya Sharma</strong>
              <span className="landing-mock-badge landing-mock-badge--green">Demo booked</span>
            </div>
            <div className="landing-mock-row">
              <strong>Aarav Patel</strong>
              <span className="landing-mock-badge landing-mock-badge--amber">Documents</span>
            </div>
          </div>
        </div>
        <div className="landing-mock-card">
          <p className="landing-mock-card__label">Visa progress</p>
          <div className="landing-mock-pipeline">
            <div className="landing-mock-row">
              <strong>UK — Tier 4</strong>
              <span className="landing-mock-badge landing-mock-badge--slate">Biometrics</span>
            </div>
            <div className="landing-mock-row">
              <strong>Canada — Study</strong>
              <span className="landing-mock-badge landing-mock-badge--green">Approved</span>
            </div>
          </div>
        </div>
        <div className="landing-mock-card">
          <p className="landing-mock-card__label">Analytics snapshot</p>
          <div className="landing-mock-chart">
            <span style={{ height: '35%' }} />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="landing-mock-card">
          <p className="landing-mock-card__label">Follow-up reminder</p>
          <div className="landing-mock-reminder">
            <FiRefreshCw size={12} />
            <span>Counselling call due today · Assigned to branch team</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-container landing-hero__grid">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: pageEase }}
        >
          <span className="landing-eyebrow">Built for modern education &amp; immigration teams</span>
          <h1 id="landing-hero-title" className="landing-hero__title">
            One Platform to Manage Every Student Journey.
          </h1>
          <p className="landing-lead">
            Manage enquiries, counselling, admissions, applications, academics, fees and visa journeys from one connected platform.
          </p>
          <div className="landing-hero__actions">
            <Link to={ROUTES.LOGIN_STUDENT} className="landing-btn landing-btn--primary">
              Student Login
              <FiArrowRight size={15} />
            </Link>
            <Link to={ROUTES.REGISTER_STUDENT} className="landing-btn landing-btn--student">
              <FiUserPlus size={15} />
              Create Account
            </Link>
            <a href="#workspaces" className="landing-btn landing-btn--secondary">Staff &amp; Agent Portals</a>
          </div>
          <div className="landing-trust-row">
            <span className="landing-trust-item"><FiLock size={13} /> Secure</span>
            <span className="landing-trust-item"><FiUsers size={13} /> Role-based access</span>
            <span className="landing-trust-item"><FiCheck size={13} /> Multi-branch</span>
            <span className="landing-trust-item"><FiRefreshCw size={13} /> Real-time data</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: pageEase, delay: 0.08 }}
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}

export function LandingTrustStrip() {
  return (
    <section className="landing-section" style={{ paddingBlock: '2rem' }}>
      <div className="landing-container">
        <p className="landing-lead" style={{ margin: 0, maxWidth: 'none', textAlign: 'center' }}>
          Built for growing education and immigration teams who need one connected workspace — not scattered spreadsheets and tools.
        </p>
      </div>
    </section>
  );
}
