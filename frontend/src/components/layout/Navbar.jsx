import { useState } from 'react';
import { navbar as navbarTheme } from '../../theme';
import NavbarGlobalSearch from './NavbarGlobalSearch';
import NavbarQuickActions from './NavbarQuickActions';
import NavbarUtilities from './NavbarUtilities';

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header
      className="shrink-0 z-[1010] border-b border-border/80 bg-navbar-bg/90 backdrop-blur-xl supports-[backdrop-filter]:bg-navbar-bg/75 overflow-visible"
      style={{ height: navbarTheme.height }}
    >
      <div className="h-full flex items-center gap-3 lg:gap-4 px-3 sm:px-4 lg:px-5">
        {/* Search — grows on left */}
        <NavbarGlobalSearch />

        {/* Spacer pushes actions right on wide screens */}
        <div className="flex-1 hidden lg:block min-w-2" aria-hidden />

        {/* Quick actions + utilities — aligned right */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
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
