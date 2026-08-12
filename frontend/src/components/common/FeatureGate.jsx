import { useFeature } from '../../hooks/useFeature';

export default function FeatureGate({ flag, children, fallback = null, loadingFallback = null }) {
  const { enabled, isLoading } = useFeature(flag);

  if (isLoading) return loadingFallback;
  if (!enabled) return fallback;
  return children;
}
