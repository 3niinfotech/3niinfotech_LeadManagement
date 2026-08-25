import { FiFilter } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import SegmentControl from '../../../components/ui/SegmentControl';
import ModuleToolbar, {
  ModuleToolbarSearch, ModuleToolbarSegments, ModuleToolbarActions,
} from '../../../components/layout/ModuleToolbar';
import { WALKIN_VIEW_TABS } from '../config/walkin.constants';

export default function WalkInToolbar({
  search,
  onSearchChange,
  activeView,
  onViewChange,
  filtersOpen,
  onToggleFilters,
  countLabel,
}) {
  return (
    <ModuleToolbar>
      <ModuleToolbarSearch>
        <SearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, mobile, ID…"
        />
      </ModuleToolbarSearch>

      <ModuleToolbarSegments>
        <SegmentControl
          items={WALKIN_VIEW_TABS}
          value={activeView}
          onChange={onViewChange}
          layoutId="crm-walkin-view-pill"
        />
      </ModuleToolbarSegments>

      <ModuleToolbarActions>
        {countLabel && <span className="crm-reception-count">{countLabel}</span>}
        <Button variant="outline" size="sm" icon={FiFilter} onClick={onToggleFilters}>
          {filtersOpen ? 'Hide filters' : 'Filters'}
        </Button>
      </ModuleToolbarActions>
    </ModuleToolbar>
  );
}
