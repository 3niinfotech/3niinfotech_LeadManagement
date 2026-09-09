import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiExternalLink, FiSearch } from 'react-icons/fi';
import { ROUTES } from '../../../config/routes';
import { readCourseFinderRecents } from '../../../utils/courseFinderRecents';
import CountryFlagLabel from '../../ui/CountryFlagLabel';

export default function CourseFinderPanel({ onClose }) {
  const [query, setQuery] = useState('');
  const recents = useMemo(() => readCourseFinderRecents(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recents;
    return recents.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q),
    );
  }, [query, recents]);

  const finderHref = query.trim()
    ? `${ROUTES.COURSE_FINDER}?q=${encodeURIComponent(query.trim())}`
    : ROUTES.COURSE_FINDER;

  return (
    <div>
      <div className="px-4 pt-3 pb-3 border-b border-border bg-page/40 space-y-2.5">
        <p className="text-[12px] text-text-secondary">
          Search courses & learning resources
        </p>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Country, course, university…"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card-bg text-[13px] text-text
              placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
      </div>

      <div className="px-2 py-2">
        <h3 className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {query.trim() ? 'Matches' : 'Recent searches'}
        </h3>
        {filtered.length === 0 ? (
          <div className="py-8 text-center px-4">
            <FiBookOpen className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-45" />
            <p className="text-[12px] text-text-muted">
              {recents.length === 0
                ? 'No recent searches — open Course Finder to start.'
                : 'No matches — open full finder.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5 max-h-[280px] overflow-y-auto no-scrollbar">
            {filtered.map((course) => (
              <li key={course.id}>
                <Link
                  to={`${ROUTES.COURSE_FINDER}?q=${encodeURIComponent(course.name)}`}
                  onClick={() => onClose?.()}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-row-hover transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-success-soft text-success shrink-0">
                    <FiBookOpen className="w-3.5 h-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-text truncate">{course.name}</span>
                    {course.country ? (
                      <span className="block text-[11px] text-text-muted">
                        <CountryFlagLabel country={course.country} size="xs" />
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-3 py-2.5 border-t border-border bg-page/30">
        <Link
          to={finderHref}
          onClick={() => onClose?.()}
          className="h-9 w-full rounded-lg border border-brand/25 bg-brand-soft text-brand text-[12px] font-semibold
            inline-flex items-center justify-center gap-1.5 hover:bg-brand-soft/80 transition-colors"
        >
          <FiExternalLink className="w-3.5 h-3.5" />
          Open Course Finder
        </Link>
      </div>
    </div>
  );
}
