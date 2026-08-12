import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import RouteProgress from '../ui/RouteProgress';

/** Lazy routes: no page spinner — only a delayed thin bar if chunk is slow. */
export default function PageTransition() {
  const location = useLocation();

  useEffect(() => {
    const scrollEl = document.querySelector('[data-page-scroll]');
    if (scrollEl) {
      scrollEl.scrollTop = 0;
      return;
    }
    document.querySelector('main')?.scrollTo?.({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col">
      <Suspense fallback={<RouteProgress />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
