import { Link } from 'react-router-dom';

/** Contextual link from a business module to the Master that drives it. */
export default function MasterManageLink({ to, children }) {
  return (
    <Link
      to={to}
      className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
    >
      {children}
    </Link>
  );
}
