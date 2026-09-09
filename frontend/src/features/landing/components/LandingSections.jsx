import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactCountryFlag from 'react-country-flag';
import {
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiClipboard,
  FiDollarSign,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiLayers,
  FiLock,
  FiMessageSquare,
  FiShield,
  FiTarget,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import {
  LANDING_ANALYTICS_METRICS,
  LANDING_BRAND,
  LANDING_CRM_WORKFLOW,
  LANDING_DESTINATIONS,
  LANDING_FOOTER_COLUMNS,
  LANDING_JOURNEY_STEPS,
  LANDING_LOGIN,
  LANDING_SECURITY_ITEMS,
  LANDING_VALUE_ITEMS,
  LANDING_WORKSPACES,
} from '../../../config/landing.config';
import { ROUTES } from '../../../config/routes';
import { pageEase } from '../../../theme/pageMotion';

const ICONS = {
  leads: FiTarget,
  counselling: FiMessageSquare,
  students: FiUsers,
  applications: FiFileText,
  visa: FiGlobe,
  academic: FiBookOpen,
  attendance: FiUserCheck,
  fees: FiDollarSign,
  documents: FiClipboard,
  followups: FiCalendar,
  reports: FiBarChart2,
  communication: FiMessageSquare,
};

const WORKSPACE_ICONS = {
  student: FiBookOpen,
  counsellor: FiBriefcase,
  faculty: FiUserCheck,
  institute: FiLayers,
  crm: FiShield,
};

function Reveal({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: pageEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function BrowserFrame({ title, children }) {
  return (
    <div className="landing-browser">
      <div className="landing-product-shell__chrome">
        <span className="landing-product-shell__dot" />
        <span className="landing-product-shell__dot" />
        <span className="landing-product-shell__dot" />
        <span className="landing-product-shell__url">{title}</span>
      </div>
      <div className="landing-browser__body">{children}</div>
    </div>
  );
}

export function LandingStudentPortal() {
  const benefits = [
    'Track university applications & visa status',
    'View class schedule, attendance & assignments',
    'Download documents, receipts & fee statements',
    'Book counselling and follow your journey',
  ];

  return (
    <section id="for-students" className="landing-section landing-student-portal" aria-labelledby="student-portal-title">
      <div className="landing-container">
        <Reveal>
          <div className="landing-student-portal__card">
            <div className="landing-student-portal__content">
              <span className="landing-eyebrow">Student portal</span>
              <h2 id="student-portal-title" className="landing-h2">Your Study Abroad Journey, One Login Away</h2>
              <p className="landing-lead">
                New student? Create your account in minutes. Already registered? Sign in to access applications, classes, fees and documents.
              </p>
              <ul className="landing-student-portal__list">
                {benefits.map((item) => (
                  <li key={item}><FiCheck size={14} aria-hidden />{item}</li>
                ))}
              </ul>
              <div className="landing-student-portal__actions">
                <Link to={ROUTES.LOGIN_STUDENT} className="landing-btn landing-btn--primary">
                  Student Login
                  <FiArrowRight size={15} />
                </Link>
                <Link to={ROUTES.REGISTER_STUDENT} className="landing-btn landing-btn--student">
                  <FiUserPlus size={15} />
                  Register as Student
                </Link>
              </div>
            </div>
            <div className="landing-student-portal__visual" aria-hidden>
              <div className="landing-student-portal__mock">
                <div className="landing-student-portal__mock-row">
                  <strong>Application</strong>
                  <span className="landing-mock-badge landing-mock-badge--amber">In review</span>
                </div>
                <div className="landing-student-portal__mock-row">
                  <strong>IELTS Batch · Morning</strong>
                  <span className="landing-mock-badge landing-mock-badge--green">Present</span>
                </div>
                <div className="landing-student-portal__mock-row">
                  <strong>Visa documents</strong>
                  <span className="landing-mock-badge landing-mock-badge--blue">3 uploaded</span>
                </div>
                <div className="landing-student-portal__mock-row">
                  <strong>Fee receipt</strong>
                  <span className="landing-mock-badge landing-mock-badge--slate">Paid</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingWorkspaces() {
  return (
    <section id="workspaces" className="landing-section landing-section--soft" aria-labelledby="workspaces-title">
      <div className="landing-container">
        <Reveal>
          <span className="landing-eyebrow">Portal access</span>
          <h2 id="workspaces-title" className="landing-h2">Sign In to Your Workspace</h2>
          <p className="landing-lead">Go directly to your portal — no extra steps. Staff, agents, faculty and students each have a dedicated login.</p>
        </Reveal>
        <div className="landing-workspace-grid" style={{ marginTop: '1.75rem' }}>
          {LANDING_WORKSPACES.map((card) => {
            const Icon = WORKSPACE_ICONS[card.id] || FiGrid;
            return (
              <article
                key={card.id}
                className={`landing-workspace-card landing-workspace-card--${card.accent} landing-workspace-card--static`}
              >
                <div className="landing-workspace-card__head">
                  <span className="landing-workspace-card__icon"><Icon size={18} /></span>
                </div>
                <h3 className="landing-workspace-card__title">{card.title}</h3>
                <p className="landing-workspace-card__desc">{card.description}</p>
                <div className="landing-workspace-card__actions">
                  <Link to={card.href} className="landing-workspace-card__cta">
                    {card.cta}
                    <FiArrowRight size={14} aria-hidden />
                  </Link>
                  {card.secondaryCta && card.secondaryHref && (
                    <Link to={card.secondaryHref} className="landing-workspace-card__cta landing-workspace-card__cta--secondary">
                      {card.secondaryCta}
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LandingValueGrid() {
  return (
    <section id="solutions" className="landing-section" aria-labelledby="value-title">
      <div className="landing-container">
        <Reveal>
          <span className="landing-eyebrow">Platform coverage</span>
          <h2 id="value-title" className="landing-h2">Everything Connected. Nothing Scattered.</h2>
          <p className="landing-lead">Lead management, counselling, academics, applications, visa, finance and communication — unified in one ERP.</p>
        </Reveal>
        <div className="landing-value-grid" style={{ marginTop: '1.75rem' }}>
          {LANDING_VALUE_ITEMS.map((item) => {
            const Icon = ICONS[item.id] || FiGrid;
            return (
              <article key={item.id} className="landing-value-item">
                <Icon size={16} className="landing-value-item__icon" aria-hidden />
                <h3>{item.label}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LandingJourney() {
  return (
    <section className="landing-section landing-section--soft" aria-labelledby="journey-title">
      <div className="landing-container">
        <Reveal>
          <span className="landing-eyebrow">Lifecycle</span>
          <h2 id="journey-title" className="landing-h2">From First Enquiry to Final Success</h2>
          <p className="landing-lead">Every stage updates the same master student record — history is never lost.</p>
        </Reveal>
        <div className="landing-timeline" style={{ marginTop: '1.75rem' }} role="list">
          {LANDING_JOURNEY_STEPS.map((step) => (
            <div key={step} className="landing-timeline__step" role="listitem">
              <div className="landing-timeline__box">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingWorkflow() {
  return (
    <section id="platform" className="landing-section" aria-labelledby="workflow-title">
      <div className="landing-container landing-split">
        <Reveal>
          <span className="landing-eyebrow">CRM workflow</span>
          <h2 id="workflow-title" className="landing-h2">How Your Team Works Inside the Platform</h2>
          <p className="landing-lead">From inbound enquiry to visa filing — assignments, follow-ups and conversions stay traceable.</p>
        </Reveal>
        <Reveal>
          <div className="landing-workflow">
            {LANDING_CRM_WORKFLOW.map((step, i) => (
              <div key={step} className="landing-workflow__row">
                <span className="landing-workflow__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="landing-workflow__label">{step}</span>
                <span className="landing-workflow__status">{i < 3 ? 'Active' : 'Track'}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingProductShowcase() {
  return (
    <section className="landing-section landing-section--soft" aria-labelledby="preview-title">
      <div className="landing-container">
        <Reveal>
          <span className="landing-eyebrow">Product preview</span>
          <h2 id="preview-title" className="landing-h2">Inside the Platform</h2>
          <p className="landing-lead">Real application surfaces — dashboards, pipelines and student profiles your team uses every day.</p>
        </Reveal>
        <div className="landing-showcase-grid" style={{ marginTop: '1.75rem' }}>
          <BrowserFrame title="app / admin / dashboard">
            <div className="landing-browser__sidebar">
              <div className="landing-browser__nav-rail">
                <div className="landing-browser__nav-item landing-browser__nav-item--active" />
                <div className="landing-browser__nav-item" />
                <div className="landing-browser__nav-item" />
                <div className="landing-browser__nav-item" />
              </div>
              <div className="landing-browser__main">
                <div className="landing-stat-row">
                  <div className="landing-stat-cell"><span>Enquiries</span><strong>—</strong></div>
                  <div className="landing-stat-cell"><span>Students</span><strong>—</strong></div>
                  <div className="landing-stat-cell"><span>Applications</span><strong>—</strong></div>
                </div>
                <div className="landing-mock-chart" style={{ height: '4.5rem' }}>
                  <span style={{ height: '40%' }} /><span /><span /><span /><span /><span />
                </div>
              </div>
            </div>
          </BrowserFrame>
          <BrowserFrame title="app / students / profile">
            <div className="landing-mock-pipeline">
              <div className="landing-mock-row"><strong>Student profile</strong><span className="landing-mock-badge landing-mock-badge--blue">Active</span></div>
              <div className="landing-mock-row"><strong>Application · University of Leeds</strong><span className="landing-mock-badge landing-mock-badge--amber">In review</span></div>
              <div className="landing-mock-row"><strong>Visa case</strong><span className="landing-mock-badge landing-mock-badge--green">Documents complete</span></div>
              <div className="landing-mock-row"><strong>Fee plan</strong><span className="landing-mock-badge landing-mock-badge--slate">Partial paid</span></div>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}

export function LandingAnalytics() {
  return (
    <section id="analytics" className="landing-section" aria-labelledby="analytics-title">
      <div className="landing-container landing-split">
        <Reveal>
          <span className="landing-eyebrow">Intelligence</span>
          <h2 id="analytics-title" className="landing-h2">Know What Is Happening Across Your Organization</h2>
          <p className="landing-lead">Operational dashboards for enquiries, conversion, demos, applications, visa and collections.</p>
          <p className="landing-analytics-note">Conceptual preview — connect your workspace to see live metrics.</p>
        </Reveal>
        <Reveal>
          <div className="landing-analytics-grid">
            {LANDING_ANALYTICS_METRICS.map((m) => (
              <div key={m.label} className="landing-metric-card">
                <div className="landing-metric-card__label">{m.label}</div>
                <div className="landing-metric-card__value">{m.value}</div>
                <div className="landing-metric-card__hint">{m.hint}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingMultiBranch() {
  return (
    <section className="landing-section landing-section--soft" aria-labelledby="org-title">
      <div className="landing-container landing-split">
        <Reveal>
          <span className="landing-eyebrow">Organization</span>
          <h2 id="org-title" className="landing-h2">One Organization. Multiple Branches. One Source of Truth.</h2>
          <p className="landing-lead">Centralize students, leads, staff, applications, fees and reports while each branch operates with controlled access.</p>
          <div className="landing-org-tags">
            {['Students', 'Leads', 'Staff', 'Applications', 'Fees', 'Reports'].map((t) => (
              <span key={t} className="landing-org-tag">{t}</span>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <div className="landing-org-tree">
            <div className="landing-org-root">{LANDING_BRAND.name}</div>
            <div className="landing-org-branches">
              {['Branch 01', 'Branch 02', 'Branch 03', 'Branch 04'].map((b) => (
                <div key={b} className="landing-org-branch">{b}</div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingSecurity() {
  return (
    <section id="security" className="landing-section" aria-labelledby="security-title">
      <div className="landing-container">
        <Reveal>
          <span className="landing-eyebrow">Trust</span>
          <h2 id="security-title" className="landing-h2">Built Around Controlled Access</h2>
          <p className="landing-lead">Enterprise CRM expectations — permissions, branch scope and tenant isolation by design.</p>
        </Reveal>
        <div className="landing-security-grid" style={{ marginTop: '1.5rem' }}>
          {LANDING_SECURITY_ITEMS.map((item) => (
            <div key={item} className="landing-security-item">
              <FiLock size={14} aria-hidden />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ROLE_PANELS = [
  {
    id: 'students-role',
    title: 'For Students',
    items: ['Track applications', 'View documents', 'Check fees & receipts', 'Attend classes', 'Check attendance', 'Access assignments', 'View tests & performance', 'Track visa journey', 'Request counselling'],
    cta: 'Student Login',
    href: LANDING_LOGIN.student,
    secondaryCta: 'Register',
    secondaryHref: ROUTES.REGISTER_STUDENT,
  },
  {
    id: 'for-counsellors',
    title: 'For Counsellors',
    items: ['Enquiries & assignments', 'Follow-ups & demos', 'Student conversion', 'Applications & documents', 'Visa coordination', 'Targets & reports'],
    cta: 'Counsellor Workspace',
    href: LANDING_WORKSPACES[1].href,
  },
  {
    id: 'for-faculty',
    title: 'For Faculty',
    items: ['Classes & batches', 'Student roster', 'Attendance marking', 'Assignments & tests', 'Study materials', 'Performance overview'],
    cta: 'Faculty Workspace',
    href: LANDING_WORKSPACES[2].href,
  },
  {
    id: 'for-admin',
    title: 'For Admin & Management',
    items: ['Dashboard & KPIs', 'Masters & setup', 'Users & roles', 'Branches & access', 'Reports & finance', 'Applications & visa', 'Settings & configuration'],
    cta: 'CRM Login',
    href: LANDING_WORKSPACES[4].href,
  },
];

export function LandingRolePanels() {
  return (
    <section className="landing-section landing-section--soft" aria-label="Role-specific benefits">
      <div className="landing-container">
        <Reveal>
          <span className="landing-eyebrow">By role</span>
          <h2 className="landing-h2">Built for Every Team Member</h2>
        </Reveal>
        <div className="landing-role-grid" style={{ marginTop: '1.5rem' }}>
          {ROLE_PANELS.map((panel) => (
            <article key={panel.id} id={panel.id} className="landing-role-panel">
              <h3>{panel.title}</h3>
              <ul className="landing-role-list">
                {panel.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <div className="landing-role-panel__actions">
                <Link to={panel.href} className="landing-btn landing-btn--secondary">{panel.cta}</Link>
                {panel.secondaryCta && panel.secondaryHref && (
                  <Link to={panel.secondaryHref} className="landing-btn landing-btn--student">{panel.secondaryCta}</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingDestinations() {
  return (
    <section className="landing-section" aria-labelledby="dest-title">
      <div className="landing-container">
        <Reveal>
          <span className="landing-eyebrow">Study destinations</span>
          <h2 id="dest-title" className="landing-h2">Popular Destinations</h2>
          <p className="landing-lead">Support students across major study-abroad markets — integrated into application and visa workflows.</p>
        </Reveal>
        <div className="landing-dest-grid" style={{ marginTop: '1.25rem' }}>
          {LANDING_DESTINATIONS.map((d) => (
            <div key={d.code} className="landing-dest-tile">
              <ReactCountryFlag countryCode={d.code} svg style={{ width: '1.1rem', height: '0.85rem', borderRadius: '2px' }} aria-hidden />
              <span>{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFinalCta() {
  return (
    <section id="cta" className="landing-cta" aria-labelledby="cta-title">
      <div className="landing-container">
        <h2 id="cta-title" className="landing-h2">Ready to Bring Your Entire Student Journey Into One Platform?</h2>
        <p className="landing-lead">
          Connect enquiries, students, academics, applications, finance and visa operations in one organized workspace.
        </p>
        <div className="landing-hero__actions">
          <a href="#workspaces" className="landing-btn landing-btn--primary">Get Started</a>
          <a href={`mailto:${LANDING_BRAND.supportEmail}`} className="landing-btn landing-btn--secondary">Talk to an Expert</a>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter({ companyName }) {
  const name = companyName || LANDING_BRAND.name;
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer__grid">
          {LANDING_FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="landing-footer__col">
              <h4>{col.title}</h4>
              {col.links.map((link) => {
                if (link.href.startsWith('mailto:') || link.href.startsWith('#')) {
                  return <a key={link.label} href={link.href}>{link.label}</a>;
                }
                return <Link key={link.label} to={link.href}>{link.label}</Link>;
              })}
            </div>
          ))}
        </div>
        <div className="landing-footer__bottom">
          <span>© {year} {name}</span>
          <a href="#security">Security</a>
          <a href="#cta">Privacy</a>
          <a href="#cta">Terms</a>
        </div>
      </div>
    </footer>
  );
}
