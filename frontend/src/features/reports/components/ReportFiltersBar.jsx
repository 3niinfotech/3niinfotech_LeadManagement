import { FiRefreshCw } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { REPORT_DATE_PRESETS } from '../config/reports.config';
import { useBranchOptions } from '../../master/hooks/useRelationalMasterOptions';

export default function ReportFiltersBar({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFrom,
  onCustomTo,
  branchId,
  onBranchChange,
  branchLocked = false,
  canViewAllBranches = true,
  onRefresh,
  refreshLoading = false,
  hideRefresh = false,
  extra = null,
}) {
  const { options: branches } = useBranchOptions({ enabled: true });

  return (
    <div className="crm-report-filters">
      <div className="crm-report-filters__group">
        <Select
          label="Date range"
          size="sm"
          value={preset}
          onChange={(e) => onPresetChange(e.target.value)}
        >
          {REPORT_DATE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </Select>

        {preset === 'custom' && (
          <>
            <Input label="From" type="date" size="sm" value={customFrom} onChange={(e) => onCustomFrom(e.target.value)} />
            <Input label="To" type="date" size="sm" value={customTo} onChange={(e) => onCustomTo(e.target.value)} />
          </>
        )}

        <Select
          label={branchLocked ? 'Branch (Active)' : 'Branch'}
          size="sm"
          containerClassName="crm-report-filters__branch"
          value={branchId}
          disabled={branchLocked}
          onChange={(e) => onBranchChange(e.target.value)}
          hint={branchLocked ? 'Locked to navbar Active Branch' : undefined}
        >
          {canViewAllBranches && !branchLocked ? (
            <option value="">All branches</option>
          ) : null}
          {(branches || []).map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </Select>

        {extra}
      </div>

      {!hideRefresh && (
        <div className="crm-report-filters__actions">
          <Button
            size="sm"
            variant="outline"
            icon={FiRefreshCw}
            loading={refreshLoading}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
