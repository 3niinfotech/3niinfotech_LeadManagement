/** Standard module toolbar shell — search, segments, actions row */
export default function ModuleToolbar({ children, className = '' }) {
  return (
    <div className={`shrink-0 px-4 py-3 border-b border-border bg-card-bg ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-3">
        {children}
      </div>
    </div>
  );
}

export function ModuleToolbarSearch({ children, className = '' }) {
  return (
    <div className={`relative flex-1 min-w-[220px] max-w-sm ${className}`}>
      {children}
    </div>
  );
}

export function ModuleToolbarSegments({ children, className = '' }) {
  return <div className={`shrink-0 ${className}`}>{children}</div>;
}

export function ModuleToolbarActions({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ml-auto shrink-0 ${className}`}>
      {children}
    </div>
  );
}
