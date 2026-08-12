import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import { useGetEffectiveFeaturesQuery } from '../../features/feature/redux/featureApiSlice';

/** Preloads effective feature flags after login */
export default function FeatureBootstrap() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  useGetEffectiveFeaturesQuery(undefined, { skip: !isAuthenticated });
  return null;
}
