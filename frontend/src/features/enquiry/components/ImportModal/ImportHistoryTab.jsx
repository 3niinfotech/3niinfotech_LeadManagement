import { Fragment, useMemo, useState } from 'react';
import { FiClock } from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import Loader from '../../../../components/ui/Loader';
import { useGetImportHistoryQuery } from '../../redux/enquiryApiSlice';
import { enquiryService } from '../../services/enquiryService';

export default function ImportHistoryTab() {
  const { data: history = [], isLoading } = useGetImportHistoryQuery();
  const [expanded, setExpanded] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const allIds = useMemo(() => history.map((b) => b.id).filter(Boolean), [history]);
  const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : allIds);
  };

  const toggleOne = (id) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ));
  };

  const loadDuplicates = async (batchId) => {
    if (expanded === batchId) {
      setExpanded(null);
      return;
    }
    const data = await enquiryService.getImportDuplicates(batchId);
    setDuplicates(data.data || data);
    setExpanded(batchId);
  };

  if (isLoading) {
    return (
      <div className="crm-import-history__empty">
        <Loader size="sm" variant="dots" />
        <p className="crm-import-history__empty-hint">Loading import history…</p>
      </div>
    );
  }

  if (!history.length) {
    return (
      <div className="crm-import-history__empty">
        <span
          className="crm-import__dropzone-icon"
          style={{ marginBottom: '0.5rem' }}
          aria-hidden
        >
          <FiClock size={20} />
        </span>
        <p className="crm-import-history__empty-title">No import batches yet</p>
        <p className="crm-import-history__empty-hint">
          When you import a spreadsheet, each batch appears here with totals, duplicates, and failures.
        </p>
      </div>
    );
  }

  return (
    <div className="crm-import-history">
      <div className="crm-import-history__toolbar">
        <p className="crm-import-history__meta">
          <strong>{history.length}</strong> batch{history.length === 1 ? '' : 'es'}
          {selectedIds.length > 0 ? (
            <> · <strong>{selectedIds.length}</strong> selected</>
          ) : null}
        </p>
        {selectedIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
            Clear selection
          </Button>
        )}
      </div>

      <div className="crm-import-history__table-wrap">
        <table className="crm-import-history__table">
          <thead>
            <tr>
              <th className="crm-import-history__check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleAll}
                  aria-label="Select all batches"
                />
              </th>
              <th>Date</th>
              <th>File</th>
              <th>Total</th>
              <th>Uploaded</th>
              <th>Duplicate</th>
              <th>Failed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((batch) => {
              const selected = selectedIds.includes(batch.id);
              return (
                <Fragment key={batch.id}>
                  <tr className={selected ? 'is-selected' : undefined}>
                    <td className="crm-import-history__check">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleOne(batch.id)}
                        aria-label={`Select ${batch.fileName || 'batch'}`}
                      />
                    </td>
                    <td className="tabular-nums text-text-muted whitespace-nowrap">
                      {new Date(batch.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <div className="crm-import-history__file" title={batch.fileName}>
                        {batch.fileName || '—'}
                      </div>
                    </td>
                    <td className="crm-import-history__num">{batch.totalRows ?? 0}</td>
                    <td className="crm-import-history__num crm-import-history__num--ok">
                      {batch.uploaded ?? 0}
                    </td>
                    <td className="crm-import-history__num crm-import-history__num--warn">
                      {batch.duplicates ?? 0}
                    </td>
                    <td className="crm-import-history__num crm-import-history__num--danger">
                      {batch.failed ?? 0}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-brand text-xs font-semibold hover:underline"
                        onClick={() => loadDuplicates(batch.id)}
                      >
                        {expanded === batch.id ? 'Hide duplicates' : 'View duplicates'}
                      </button>
                    </td>
                  </tr>
                  {expanded === batch.id && (
                    <tr key={`${batch.id}-dup`}>
                      <td colSpan={8} className="crm-import-history__dup">
                        <pre>{JSON.stringify(duplicates, null, 2)}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
