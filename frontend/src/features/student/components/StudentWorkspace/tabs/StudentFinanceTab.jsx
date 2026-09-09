import { FiDollarSign, FiFileText } from 'react-icons/fi';
import FormSection from '../../../../../components/ui/FormSection';
import Badge from '../../../../../components/ui/Badge';

export default function StudentFinanceTab({ student }) {
  const invoices = student?.invoices || student?.fees || [];

  return (
    <div className="space-y-4">
      <FormSection
        title="Finance"
        description="Fee quotations, payments, and instalments linked to this student master."
      >
        {invoices.length === 0 ? (
          <div className="crm-timeline__empty py-6">
            <span className="crm-timeline__empty-icon" aria-hidden>
              <FiDollarSign className="w-5 h-5" />
            </span>
            <h3 className="crm-timeline__empty-title">No fee records yet</h3>
            <p className="crm-timeline__empty-desc">
              Quotations and payments appear here once created from Finance / Invoices for this student.
            </p>
          </div>
        ) : (
          <ul className="crm-student-record-list">
            {invoices.map((inv) => (
              <li key={inv.id} className="crm-student-record">
                <div className="crm-student-record__primary inline-flex items-center gap-2 min-w-0">
                  <FiFileText className="w-4 h-4 text-brand shrink-0" />
                  <span className="truncate">{inv.invoiceNumber || inv.code || inv.title || 'Invoice'}</span>
                </div>
                <div className="crm-student-record__meta">
                  <Badge color="secondary" size="sm">{inv.status || '—'}</Badge>
                </div>
                <div className="crm-student-record__muted tabular-nums">
                  {inv.totalAmount != null ? inv.totalAmount : inv.amount ?? '—'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
