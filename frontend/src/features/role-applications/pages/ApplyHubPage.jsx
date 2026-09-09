import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiBookOpen, FiBriefcase, FiUsers } from 'react-icons/fi';
import { pageEase } from '../../../theme/pageMotion';
import { ROUTES } from '../../../config/routes';
import { AUTH_BRAND } from '../../../config/auth.config';
import { APPLY_FEATURED_ROLES, APPLY_OTHER_ROLES, ROLE_APPLY_PATH } from '../../../config/role-application.config';
import '../../../components/auth/auth.theme.css';
import '../styles/role-applications.theme.css';

const ICONS = {
  counsellor: FiUsers,
  teacher: FiBookOpen,
  receptionist: FiBriefcase,
};

export default function ApplyHubPage() {
  return (
    <div className="auth-portal-page role-apply-page">
      <div className="auth-portal-page__top">
        <Link to={ROUTES.LANDING} className="auth-portal-page__brand">
          <span className="auth-portal-page__brand-mark">3ni</span>
          <span className="auth-portal-page__brand-name">{AUTH_BRAND.productName}</span>
        </Link>
        <Link to={ROUTES.LOGIN_ADMIN} className="auth-portal-page__home">Staff sign in</Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: pageEase }}
        className="auth-portal-page__hero"
      >
        <h1>Join our team</h1>
        <p>Apply for counsellor, teacher, reception & other staff roles. Students — visit branch for enquiry.</p>
      </motion.div>

      <div className="role-apply-student-note">
        <div>
          <strong>Student?</strong>
          <span>Student interest is handled via enquiry at your branch — not staff apply.</span>
        </div>
        <Link to={ROUTES.REGISTER_STUDENT}>Register</Link>
        <Link to={ROUTES.LOGIN_STUDENT}>Student login</Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: pageEase, delay: 0.05 }}
        className="auth-portal-page__grid role-apply-grid"
      >
        {APPLY_FEATURED_ROLES.map(({ slug, label, description }) => {
          const Icon = ICONS[slug] || FiBriefcase;
          return (
            <Link key={slug} to={ROLE_APPLY_PATH(slug)} className="auth-portal-card role-apply-card">
              <div className="auth-portal-card__icon role-apply-card__icon">
                <Icon size={20} />
              </div>
              <h2 className="auth-portal-card__title">{label}</h2>
              <p className="auth-portal-card__desc">{description}</p>
              <span className="auth-portal-card__cta">
                Apply now <FiArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </motion.div>

      <div className="role-apply-other">
        <h3>Other roles</h3>
        <div className="role-apply-other__links">
          {APPLY_OTHER_ROLES.map((r) => (
            <Link key={r.slug} to={ROLE_APPLY_PATH(r.slug)}>{r.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
