import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiShield } from 'react-icons/fi';
import PageShell from '../../components/layout/PageShell';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { selectUser } from '../../redux/slices/authSlice';
import { getDefaultRoute, resolvePortalFromRole } from '../../config/portal.config';
import { IMAGES } from '../../config/assets';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const portal = user?.portal || resolvePortalFromRole(user?.role?.slug);
  const home = user?.defaultRoute || getDefaultRoute(portal, user);

  return (
    <PageShell>
      <Card className="max-w-lg mx-auto text-center !p-10">
        <img
          src={IMAGES.errors.somethingWentWrong}
          alt="Access denied"
          className="w-48 mx-auto mb-6 opacity-90"
        />
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-danger-soft text-danger mb-4">
          <FiShield size={22} />
        </div>
        <h1 className="text-2xl font-semibold text-text-primary mb-2">403 — Access Denied</h1>
        <p className="text-text-muted mb-6">
          You do not have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
          <Button onClick={() => navigate(home)}>Go to workspace</Button>
        </div>
      </Card>
    </PageShell>
  );
}
