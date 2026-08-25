import { useEffect, useState } from 'react';
import Drawer from '../../../../components/ui/Drawer';
import Button from '../../../../components/ui/Button';
import { useRecommendCounsellorsQuery } from '../../redux/walkinApiSlice';
import CounsellorRecommendPanel from './CounsellorRecommendPanel';
import { getVisitorName } from '../../utils/reception.utils';

export default function AssignCounsellorDrawer({
  open,
  lead,
  onClose,
  onAssign,
  saving = false,
}) {
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    if (open) setSelectedId(lead?.assignedToId || '');
  }, [open, lead?.id, lead?.assignedToId]);

  const {
    data: recommendations = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useRecommendCounsellorsQuery(
    {
      branchId: lead?.branchId,
      interestedCountry: lead?.country || lead?.interestedCountry || undefined,
      interestedCourse: lead?.interestedCourse || undefined,
    },
    { skip: !open || !lead?.branchId, refetchOnMountOrArgChange: true },
  );

  const name = getVisitorName(lead);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Assign counsellor"
      size="md"
      footer={(
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={() => selectedId && onAssign(selectedId)}
            loading={saving}
            disabled={!selectedId}
          >
            Assign
          </Button>
        </div>
      )}
    >
      <p className="text-sm text-text mb-3">
        {name}
        {lead?.phone ? <span className="text-text-muted"> · {lead.phone}</span> : null}
      </p>
      <CounsellorRecommendPanel
        recommendations={recommendations}
        loading={isLoading && !recommendations.length}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onRefresh={() => refetch()}
        error={isError ? (error?.data?.message || 'Could not load counsellors') : null}
      />
    </Drawer>
  );
}
