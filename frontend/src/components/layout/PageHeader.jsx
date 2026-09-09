import ModulePageHeader from './ModulePageHeader';

/** Standalone page header (Dashboard, placeholders) — same UI as ModulePageCard header */
function PageHeader(props) {
  return (
    <ModulePageHeader
      {...props}
      embedded={false}
      className={`mb-1 ${props.className || ''}`.trim()}
    />
  );
}

PageHeader.displayName = 'PageHeader';

export default PageHeader;
