import { AnimatePresence, motion } from 'framer-motion';
import { pageEase } from '../../../../theme/pageMotion';

const panelVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: pageEase },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.18, ease: pageEase },
  },
};

/** Animated tab content panel for enquiry workspace */
export default function EnquiryTabPanel({ panelKey, children, className = '' }) {
  return (
    <div className={`crm-form-panel crm-enquiry-tab-panel ${className}`.trim()}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={panelKey}
          className="crm-form-panel__layer scroll-area crm-enquiry-tab-panel__layer"
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
