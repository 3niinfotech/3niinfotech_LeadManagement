import { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiCommand, FiMic, FiSearch } from 'react-icons/fi';
import {
  openCommandPalette,
  selectCommandPaletteOpen,
  selectCommandPaletteQuery,
  setCommandPaletteQuery,
} from '../../redux/slices/uiSlice';
import { navbarConfig } from '../../config/navbar.config';

export default function NavbarGlobalSearch() {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const open = useSelector(selectCommandPaletteOpen);
  const query = useSelector(selectCommandPaletteQuery);

  const handleFocus = () => {
    dispatch(openCommandPalette(query));
  };

  const handleChange = (e) => {
    const value = e.target.value;
    dispatch(setCommandPaletteQuery(value));
    if (!open) dispatch(openCommandPalette(value));
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        dispatch(openCommandPalette(query));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, query]);

  return (
    <div className="flex items-center min-w-0 flex-1 max-w-xl lg:max-w-2xl">
      <div
        className="group w-full flex items-center gap-2 h-9 px-3 rounded-lg
          border border-border/80 bg-page/50
          hover:border-border-hover hover:bg-card-bg
          focus-within:border-brand focus-within:bg-card-bg
          focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--brand)_10%,transparent)]
          transition-[border-color,box-shadow,background-color] duration-200"
      >
        <FiSearch className="w-3.5 h-3.5 text-text-muted shrink-0 group-focus-within:text-brand transition-colors" />

        <input
          ref={inputRef}
          type="text"
          value={open ? query : ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onClick={() => dispatch(openCommandPalette(query))}
          placeholder={navbarConfig.search.placeholder}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[13px] text-text placeholder:text-text-muted"
          autoComplete="off"
          spellCheck={false}
          aria-label="Global search"
        />

        <span className="hidden sm:flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => dispatch(openCommandPalette(query))}
            title="Voice search"
            className="flex items-center justify-center w-6 h-6 rounded-md text-text-muted
              hover:text-brand hover:bg-brand-soft/60 transition-colors"
          >
            <FiMic className="w-3 h-3" />
          </button>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded
            border border-border/80 bg-card-bg text-[10px] font-medium font-mono text-text-muted leading-none">
            <FiCommand className="w-2.5 h-2.5" />K
          </kbd>
        </span>
      </div>
    </div>
  );
}
