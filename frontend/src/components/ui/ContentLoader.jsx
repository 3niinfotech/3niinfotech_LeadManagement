import { motion } from 'framer-motion';
import Loader from './Loader';
import {
  SkeletonPageHeader,
  SkeletonStatBar,
  SkeletonToolbar,
} from './Skeleton';
import TableLoader, { TableFetchOverlay } from './TableLoader';

/**
 * Page-level loading states — prefer skeleton over big spinners.
 * variant="module" | "dashboard" | "center" | "spinner"
 */
export default function ContentLoader({
  variant = 'module',
  overlay = false,
  className = '',
}) {
  if (variant === 'spinner' || variant === 'center') {
    return (
      <div className={`flex items-center justify-center w-full h-full min-h-[240px] ${className}`}>
        <Loader size="md" variant="flow" />
      </div>
    );
  }

  const moduleSkeleton = (
    <motion.div
      className={`flex flex-col h-full min-h-[480px] bg-card-bg border border-card-border rounded-xl overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <SkeletonPageHeader />
      <SkeletonStatBar count={7} variant="strip" />
      <SkeletonToolbar />
      <div className="flex-1 min-h-0 relative">
        <TableLoader rows={12} height="100%" stagger />
      </div>
    </motion.div>
  );

  const dashboardSkeleton = (
    <motion.div
      className={`relative space-y-6 w-full min-h-[400px] ${className}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3.5">
          <div className="crm-shimmer w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <div className="crm-shimmer h-4 w-32 rounded-md" />
            <div className="crm-shimmer h-3 w-48 rounded-md" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="p-4 rounded-xl border border-border space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <div className="crm-shimmer h-3 w-20 rounded-md" />
            <div className="crm-shimmer h-7 w-14 rounded-md" />
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl border border-border crm-shimmer" />
        <div className="h-64 rounded-xl border border-border crm-shimmer" />
      </div>
    </motion.div>
  );

  if (overlay) {
    return (
      <div className={`relative w-full h-full min-h-[200px] ${className}`}>
        <TableFetchOverlay />
      </div>
    );
  }

  return variant === 'dashboard' ? dashboardSkeleton : moduleSkeleton;
}
