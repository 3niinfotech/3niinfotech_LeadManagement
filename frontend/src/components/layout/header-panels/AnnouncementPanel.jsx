import { useState } from 'react';
import { FiExternalLink, FiVolume2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Button from '../../ui/Button';
import { ANNOUNCEMENTS } from '../../../config/headerMock.data';
import { ROUTES } from '../../../config/routes';

export default function AnnouncementPanel() {
  const [activeId, setActiveId] = useState(ANNOUNCEMENTS[0]?.id);
  const active = ANNOUNCEMENTS.find((a) => a.id === activeId) || ANNOUNCEMENTS[0];

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[360px]">
      <aside className="lg:w-[200px] shrink-0 border border-border rounded-lg overflow-hidden">
        <div className="px-3 py-2.5 bg-brand text-white text-[11px] font-semibold tracking-wide uppercase">
          All Announcements
        </div>
        <ul className="divide-y divide-border max-h-[280px] overflow-y-auto no-scrollbar">
          {ANNOUNCEMENTS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`w-full text-left px-3 py-2.5 transition-colors ${
                  activeId === item.id
                    ? 'bg-brand-soft border-l-2 border-brand'
                    : 'hover:bg-row-hover'
                }`}
              >
                <p className="text-[13px] font-medium text-text truncate">{item.title}</p>
                <p className="text-[11px] text-text-muted mt-0.5">{item.date}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex-1 min-w-0 border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-page">
          <div className="flex items-center gap-2 min-w-0">
            <FiVolume2 className="w-4 h-4 text-brand shrink-0" />
            <h3 className="text-sm font-semibold text-brand truncate">{active?.title}</h3>
          </div>
          <span className="text-[11px] text-text-muted bg-card border border-border px-2 py-0.5 rounded-md shrink-0">
            {active?.date}
          </span>
        </div>

        <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
          {active?.image && (
            <img
              src={active.image}
              alt={active.title}
              className="w-full rounded-lg border border-border object-cover max-h-[180px]"
            />
          )}
          <p className="text-[13px] text-text-secondary leading-relaxed">{active?.excerpt}</p>
        </div>
      </div>

      <div className="lg:hidden">
        <Link to={ROUTES.ANNOUNCEMENTS} className="block">
          <Button variant="outline" className="w-full" icon={FiExternalLink}>
            View all announcements
          </Button>
        </Link>
      </div>
    </div>
  );
}
