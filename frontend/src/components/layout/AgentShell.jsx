import { Outlet, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiCalendar, FiHome, FiUsers, FiLogOut, FiUser,
} from 'react-icons/fi';
import Button from '../ui/Button';
import { logoutUser, selectUser } from '../../redux/slices/authSlice';

const navItems = [
  { to: '/agent/dashboard', label: 'Dashboard', icon: FiHome },
  { to: '/agent/students', label: 'My Students', icon: FiUsers },
  { to: '/agent/calendar', label: 'My Calendar', icon: FiCalendar },
  { to: '/agent/profile', label: 'My Profile', icon: FiUser },
];

export default function AgentShell() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card-bg border-b border-card-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wide">Agent Portal</p>
          <h1 className="text-lg font-semibold text-text">{user?.company?.name || 'VisaERP'}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary hidden sm:inline">
            {user?.firstName} {user?.lastName}
          </span>
          <Button variant="ghost" size="sm" onClick={() => dispatch(logoutUser())}>
            <FiLogOut className="mr-1" /> Sign out
          </Button>
        </div>
      </header>
      <nav className="bg-card-bg border-b border-card-border px-4 flex gap-1 overflow-x-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-text-secondary hover:text-text'
              }`
            }
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
