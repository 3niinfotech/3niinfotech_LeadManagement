import { Children } from 'react';
import { motion } from 'framer-motion';
import ScrollArea from '../ui/ScrollArea';
import { pageStagger, pageItem } from '../../theme/pageMotion';

/**
 * Scrollable page shell — dashboard, placeholder, settings, etc.
 * Module pages (enquiry/students) use ModulePageCard with internal table scroll instead.
 * Pass `header` to pin it above the scroll area so only the body scrolls.
 */
export default function PageShell({
  children,
  header = null,
  className = '',
  scroll = true,
}) {
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

  if (!scroll) {
    return header ? (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0">{header}</div>
        {content}
      </div>
    ) : content;
  }

  if (header) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0">{header}</div>
        <ScrollArea axis="y" data-page-scroll className="min-h-0 flex-1 pr-0.5">
          {content}
        </ScrollArea>
      </div>
    );
  }

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
