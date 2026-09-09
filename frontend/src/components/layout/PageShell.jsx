import { Children } from 'react';
import { motion } from 'framer-motion';
import ScrollArea from '../ui/ScrollArea';
import { pageStagger, pageItem } from '../../theme/pageMotion';
import './page-shell.theme.css';

const PAGE_HEADER_NAMES = new Set(['PageHeader', 'ModulePageHeader']);

function isPageHeaderNode(node) {
  if (!node || typeof node !== 'object') return false;
  const type = node.type;
  const name = type?.displayName || type?.name;
  if (PAGE_HEADER_NAMES.has(name)) return true;
  if (node.props?.['data-page-header'] != null) return true;
  return false;
}

function splitPageHeader(items, explicitHeader = null) {
  if (explicitHeader) {
    return { header: explicitHeader, body: items };
  }
  if (!items.length || !isPageHeaderNode(items[0])) {
    return { header: null, body: items };
  }
  return { header: items[0], body: items.slice(1) };
}

function renderBodyItems(items) {
  return items.map((child, index) => (
    <motion.div key={index} variants={pageItem} className="crm-page-shell__section">
      {child}
    </motion.div>
  ));
}

/**
 * Scrollable page shell — dashboard, placeholder, settings, etc.
 * Module pages (enquiry/students) use ModulePageCard with internal table scroll instead.
 * Page headers (PageHeader / ModulePageHeader) are pinned above the scroll area automatically.
 */
export default function PageShell({
  children,
  header = null,
  className = '',
  scroll = true,
}) {
  const items = Children.toArray(children).filter(Boolean);
  const { header: pinnedHeader, body: bodyItems } = splitPageHeader(items, header);

  const bodyContent = (
    <motion.div
      className={[
        'crm-page-shell__content',
        scroll ? 'crm-page-shell__content--scroll' : 'crm-page-shell__content--fixed',
        bodyItems.length > 1 ? 'space-y-6' : '',
        className,
      ].filter(Boolean).join(' ')}
      variants={pageStagger}
      initial={false}
      animate="show"
    >
      {renderBodyItems(bodyItems)}
    </motion.div>
  );

  const headerSlot = pinnedHeader ? (
    <div className="crm-page-header-slot">
      <motion.div variants={pageItem}>{pinnedHeader}</motion.div>
    </div>
  ) : null;

  if (!scroll) {
    return (
      <div className="crm-page-shell crm-page-shell--fixed flex h-full min-h-0 flex-col">
        {headerSlot}
        <div className="crm-page-shell__body crm-page-shell__body--fixed flex min-h-0 flex-1 flex-col overflow-hidden">
          {bodyContent}
        </div>
      </div>
    );
  }

  return (
    <div className="crm-page-shell crm-page-shell--scroll flex h-full min-h-0 flex-col">
      {headerSlot}
      <ScrollArea
        axis="y"
        data-page-scroll
        className="crm-page-shell__body crm-page-shell__body--scroll min-h-0 flex-1 pr-0.5"
      >
        {bodyContent}
      </ScrollArea>
    </div>
  );
}
