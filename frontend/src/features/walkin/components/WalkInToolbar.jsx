import { FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { WALKIN_VIEW_TABS } from '../config/walkin.constants';

export default function WalkInToolbar({
  search,
  onSearchChange,
  activeView,
  onViewChange,
  onAdd,
  filtersOpen,
  onToggleFilters,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-card-border">
      <Button icon={FiPlus} onClick={onAdd}>New Walk-in</Button>

      <div className="flex items-center gap-1 ml-2">
        {WALKIN_VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onViewChange(tab.id)}
            className={`crm-view-tab ${activeView === tab.id ? 'crm-view-tab--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-[200px] max-w-md ml-auto">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name, mobile, token, lead ID..."
          icon={FiSearch}
        />
      </div>

      <Button variant="outline" icon={FiFilter} onClick={onToggleFilters}>
        {filtersOpen ? 'Hide Filters' : 'Filters'}
      </Button>
    </div>
  );
}
