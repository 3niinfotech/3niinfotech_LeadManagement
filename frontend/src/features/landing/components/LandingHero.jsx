import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck, FiLock, FiRefreshCw, FiSend, FiUsers } from 'react-icons/fi';
import { pageEase } from '../../../theme/pageMotion';
import { ROUTES } from '../../../config/routes';

function ProductPreview() {
  return (
    <div className="landing-product-shell" aria-hidden>
      <div className="landing-product-shell__chrome">
        <span className="landing-product-shell__dot" />
        <span className="landing-product-shell__dot" />
        <span className="landing-product-shell__dot" />
        <span className="landing-product-shell__url">app / education-crm / live-overview</span>
      </div>
      <div className="landing-product-grid">
        <div className="landing-mock-card">
          <p className="landing-mock-card__label">Active Student Pipeline</p>
          <div className="landing-mock-pipeline">
            <div className="landing-mock-row">
              <div>
                <strong>Aarav Patel</strong>
                <span className="block text-[10px] text-slate-500">Univ. of Toronto · Canada</span>
              </div>
              <span className="landing-mock-badge landing-mock-badge--green">Offer Letter</span>
            </div>
            <div className="landing-mock-row">
              <div>
                <strong>Priya Sharma</strong>
                <span className="block text-[10px] text-slate-500">Imperial College · UK</span>
              </div>
              <span className="landing-mock-badge landing-mock-badge--blue">CAS Issued</span>
            </div>
            <div className="landing-mock-row">
              <div>
                <strong>Rohan Mehta</strong>
                <span className="block text-[10px] text-slate-500">Univ. of Melbourne · Australia</span>
              </div>
              <span className="landing-mock-badge landing-mock-badge--amber">Visa In Review</span>
            </div>
          </div>
        </div>
        <div className="landing-mock-card">
          <p className="landing-mock-card__label">Visa Success &amp; Compliance</p>
          <div className="landing-mock-pipeline">
            <div className="landing-mock-row">
              <div>
                <strong>Canada — SDS Stream</strong>
                <span className="block text-[10px] text-slate-500">Biometrics &amp; Medical</span>
              </div>
              <span className="landing-mock-badge landing-mock-badge--green">Granted 100%</span>
            </div>
            <div className="landing-mock-row">
              <div>
                <strong>United Kingdom — Tier 4</strong>
                <span className="block text-[10px] text-slate-500">Priority Processing</span>
              </div>
              <span className="landing-mock-badge landing-mock-badge--blue">Approved</span>
            </div>
            <div className="landing-mock-row">
              <div>
                <strong>Australia — Subclass 500</strong>
                <span className="block text-[10px] text-slate-500">GTE Assessment</span>
              </div>
              <span className="landing-mock-badge landing-mock-badge--slate">Verified</span>
            </div>
          </div>
        </div>
        <div className="landing-mock-card">
          <div className="flex items-center justify-between">
            <p className="landing-mock-card__label">Admissions Growth</p>
            <span className="text-[10px] font-bold text-emerald-600">+34.8% YoY</span>
          </div>
          <div className="landing-mock-chart">
            <span style={{ height: '38%' }} title="Jan" />
            <span style={{ height: '52%' }} title="Feb" />
            <span style={{ height: '76%' }} title="Mar" />
            <span style={{ height: '64%' }} title="Apr" />
            <span style={{ height: '88%' }} title="May" />
            <span style={{ height: '96%', background: '#2563eb' }} title="Jun" />
          </div>
        </div>
        <div className="landing-mock-card">
          <p className="landing-mock-card__label">Real-time CRM Sync</p>
          <div className="landing-mock-reminder">
            <FiRefreshCw size={13} className="text-blue-600 shrink-0" />
            <span>Website inquiries automatically sync to Enquiry Pipeline in real time</span>
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
            <a href="#contact" className="landing-btn landing-btn--student">
              <FiSend size={15} />
              Enquire Now
            </a>
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
