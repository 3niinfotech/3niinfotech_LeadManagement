import { useState } from 'react';
import ScrollArea from '../../../../components/ui/ScrollArea';
import { useGetImportHistoryQuery } from '../../redux/enquiryApiSlice';
import { enquiryService } from '../../services/enquiryService';

export default function ImportHistoryTab() {
  const { data: history = [], isLoading } = useGetImportHistoryQuery();
  const [expanded, setExpanded] = useState(null);
  const [duplicates, setDuplicates] = useState([]);

  const loadDuplicates = async (batchId) => {
    if (expanded === batchId) {
      setExpanded(null);
      return;
    }
    const data = await enquiryService.getImportDuplicates(batchId);
    setDuplicates(data.data || data);
    setExpanded(batchId);
  };

  if (isLoading) return <p className="text-sm text-text-muted">Loading history...</p>;

  return (
    <ScrollArea axis="x" className="rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-row-hover">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">File</th>
            <th className="p-2 text-left">Total</th>
            <th className="p-2 text-left">Uploaded</th>
            <th className="p-2 text-left">Duplicate</th>
            <th className="p-2 text-left">Failed</th>
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {history.map((batch) => (
            <>
              <tr key={batch.id} className="border-t border-border">
                <td className="p-2">{new Date(batch.createdAt).toLocaleString()}</td>
                <td className="p-2">{batch.fileName}</td>
                <td className="p-2">{batch.totalRows}</td>
                <td className="p-2">{batch.uploaded}</td>
                <td className="p-2">{batch.duplicates}</td>
                <td className="p-2">{batch.failed}</td>
                <td className="p-2">
                  <button type="button" className="text-primary-600 text-xs" onClick={() => loadDuplicates(batch.id)}>
                    View Duplicates
                  </button>
                </td>
              </tr>
              {expanded === batch.id && (
                <tr key={`${batch.id}-dup`}>
                  <td colSpan={7} className="p-3 bg-row-hover">
                    <pre className="text-xs overflow-auto">{JSON.stringify(duplicates, null, 2)}</pre>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}
