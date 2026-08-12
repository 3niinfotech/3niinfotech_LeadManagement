import { Children } from 'react';
import { motion } from 'framer-motion';
import ScrollArea from '../ui/ScrollArea';
import { pageStagger, pageItem } from '../../theme/pageMotion';

/**
 * Scrollable page shell — dashboard, placeholder, settings, etc.
 * Module pages (enquiry/students) use ModulePageCard with internal table scroll instead.
 */
export default function PageShell({ children, className = '', scroll = true }) {
  const items = Children.toArray(children).filter(Boolean);

  const content = (
    <motion.div
      className={`space-y-6 h-full min-h-0 ${className}`.trim()}
      variants={pageStagger}
      initial={false}
      animate="show"
    >
      {items.map((child, index) => (
        <motion.div key={index} variants={pageItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );

  if (!scroll) return content;

  return (
    <ScrollArea
      axis="y"
      data-page-scroll
      className="h-full min-h-0 pr-0.5"
    >
      {content}
    </ScrollArea>
  );
}
