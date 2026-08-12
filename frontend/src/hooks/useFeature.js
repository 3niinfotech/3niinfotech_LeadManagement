import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../redux/slices/authSlice';
import { useGetEffectiveFeaturesQuery } from '../features/feature/redux/featureApiSlice';

export function useFeatures() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { data, isLoading, isFetching, refetch } = useGetEffectiveFeaturesQuery(undefined, {
    skip: !isAuthenticated,
  });

  return {
    flags: data?.flags ?? {},
    modes: data?.modes ?? {},
    isLoading: isLoading || isFetching,
    refetch,
  };
}

export function useFeature(key) {
  const { flags, modes, isLoading } = useFeatures();
  return {
    enabled: Boolean(flags[key]),
    isLoading,
    modes,
  };
}
