import NavbarProfileMenu from './NavbarProfileMenu';

export default function NavbarUtilities({ profileOpen, onProfileToggle, onProfileClose }) {
  return (
    <NavbarProfileMenu
      open={profileOpen}
      onToggle={onProfileToggle}
      onClose={onProfileClose}
    />
  );
}
