import { useState } from 'react';
import { navbar as navbarTheme } from '../../theme';
import NavbarGlobalSearch from './NavbarGlobalSearch';
import NavbarQuickActions from './NavbarQuickActions';
import NavbarUtilities from './NavbarUtilities';
import NavbarBranchSwitcher from './NavbarBranchSwitcher';

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header
      className="relative shrink-0 z-[1100] overflow-visible"
      style={{ height: navbarTheme.height }}
    >
      {/* Blur lives on a sibling layer so dropdowns/tooltips are not clipped by backdrop-filter */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 border-b border-border/80 bg-navbar-bg/90 backdrop-blur-xl supports-[backdrop-filter]:bg-navbar-bg/75"
      />
      <div className="relative h-full flex items-center gap-3 lg:gap-4 px-3 sm:px-4 lg:px-5 overflow-visible">
        <NavbarGlobalSearch />

        <div className="flex-1 hidden lg:block min-w-2" aria-hidden />

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 overflow-visible">
          <NavbarBranchSwitcher />
          <NavbarQuickActions />
          <NavbarUtilities
            profileOpen={profileOpen}
            onProfileToggle={() => setProfileOpen((v) => !v)}
            onProfileClose={() => setProfileOpen(false)}
          />
        </div>
      </div>
    </header>
  );
}
