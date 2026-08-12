import ScrollArea from '../../../../components/ui/ScrollArea';

export default function ImportPreviewStep({ rows }) {
  return (
    <ScrollArea axis="both" hideBar className="max-h-96 rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-row-hover sticky top-0">
          <tr>
            <th className="p-2 text-left">Row</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Mobile</th>
            <th className="p-2 text-left">Errors</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row._row} className={`border-t border-border ${row.errors?.length ? 'bg-danger-soft/40' : ''}`}>
              <td className="p-2">{row._row}</td>
              <td className="p-2">{row.firstName} {row.lastName}</td>
              <td className="p-2">{row.email}</td>
              <td className="p-2">{row.mobile}</td>
              <td className="p-2 text-danger text-xs">{row.errors?.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}
