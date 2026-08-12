import ModulePageHeader from './ModulePageHeader';

/** Standalone page header (Dashboard, placeholders) — same UI as ModulePageCard header */
export default function PageHeader(props) {
  return <ModulePageHeader {...props} embedded={false} className="mb-1" />;
}
