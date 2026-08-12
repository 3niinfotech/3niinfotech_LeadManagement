import { useState } from 'react';
import { FiMapPin, FiSearch } from 'react-icons/fi';
import Input from '../../ui/Input';
import { COURSE_FINDER_RECENTS } from '../../../config/headerMock.data';

export default function CourseFinderPanel() {
  const [query, setQuery] = useState('');

  const filtered = COURSE_FINDER_RECENTS.filter(
    (c) =>
      !query.trim()
      || c.name.toLowerCase().includes(query.toLowerCase())
      || c.country.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search course, country, university..."
        icon={FiSearch}
        size="sm"
      />

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">
          Recent searches
        </p>
        <ul className="space-y-2">
          {filtered.map((course) => (
            <li
              key={course.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-brand/30 hover:bg-brand-soft/30 cursor-pointer transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-soft text-brand shrink-0">
                <FiMapPin className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text truncate">{course.name}</p>
                <p className="text-[12px] text-text-muted">{course.country}</p>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-text-muted text-center py-6">No courses found</p>
          )}
        </ul>
      </div>
    </div>
  );
}
