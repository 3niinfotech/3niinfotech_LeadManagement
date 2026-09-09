import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiInfo, FiX } from 'react-icons/fi';
import { TEAM_TAB_GUIDE, ROLES_TAB_GUIDE } from '../config/teamAccessHelp.config';

const GUIDES = {
  team: TEAM_TAB_GUIDE,
  roles: ROLES_TAB_GUIDE,
};

/** Single info icon — opens help panel on click */
export default function TeamAccessHelpMenu({ activeTab = 'team' }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 380 });

  const guide = GUIDES[activeTab] || GUIDES.team;

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.min(400, window.innerWidth - 24);
      let left = rect.right - width;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      setPos({ top: rect.bottom + 8, left, width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`crm-access-help-icon ${open ? 'crm-access-help-icon--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="How it works"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="How it works"
      >
        <FiInfo size={17} strokeWidth={2} />
      </button>

      {open && createPortal(
        <>
          <button
            type="button"
            className="crm-access-help-backdrop"
            aria-label="Close guide"
            onClick={() => setOpen(false)}
          />
          <div
            className="crm-access-help-panel"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            role="dialog"
            aria-label={guide.title}
          >
            <div className="crm-access-help-panel__head">
              <div>
                <p className="crm-access-help-panel__title">{guide.title}</p>
                <p className="crm-access-help-panel__subtitle">{guide.subtitle}</p>
              </div>
              <button type="button" className="crm-access-help-panel__close" onClick={() => setOpen(false)} aria-label="Close">
                <FiX size={16} />
              </button>
            </div>

            <ol className="crm-access-help-panel__steps">
              {guide.steps.map((step, index) => (
                <li key={step.title} className="crm-access-help-panel__step">
                  <span className="crm-access-help-panel__step-num">{index + 1}</span>
                  <div className="crm-access-help-panel__step-body">
                    <strong>{step.title.replace(/^\d+\.\s*/, '')}</strong>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            {guide.tips?.length > 0 && (
              <div className="crm-access-help-panel__tips">
                <p className="crm-access-help-panel__tips-title">Quick tips</p>
                <ul>
                  {guide.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
