import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiUser, FiBriefcase } from 'react-icons/fi';
import { pageEase } from '../../theme/pageMotion';
import { PORTALS, PORTAL_META } from '../../config/portal.config';

const PORTAL_CARDS = [
  { portal: PORTALS.ADMIN, icon: FiUsers, color: 'bg-primary-600' },
  { portal: PORTALS.STUDENT, icon: FiUser, color: 'bg-emerald-600' },
  { portal: PORTALS.AGENT, icon: FiBriefcase, color: 'bg-violet-600' },
];

export default function PortalSelectorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: pageEase }}
        className="w-full max-w-3xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-text mb-2">Welcome to VisaERP</h1>
          <p className="text-text-secondary">Choose your portal to continue</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {PORTAL_CARDS.map(({ portal, icon: Icon, color }) => {
            const meta = PORTAL_META[portal];
            return (
              <Link
                key={portal}
                to={meta.loginPath}
                className="group bg-card-bg border border-card-border rounded-xl p-6 shadow-card hover:border-primary-400 hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-lg ${color} text-white flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h2 className="text-lg font-semibold text-text group-hover:text-primary-600 mb-1">{meta.label}</h2>
                <p className="text-sm text-text-secondary">{meta.description}</p>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
