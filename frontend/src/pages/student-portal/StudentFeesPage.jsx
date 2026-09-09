import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiDollarSign, FiFileText } from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import Button from '../../components/ui/Button';
import {
  PortalPage,
  PortalMetrics,
  PortalMetric,
  PortalPanel,
  PortalEmpty,
  PortalSkeletonPage,
  PortalTable,
  PortalBadge,
} from '../../components/portal/PortalUi';
import { formatDate, formatMoney } from './components/portalFormat';
import {
  ReportDonutChart,
  ReportGaugeChart,
} from '../../features/reports/components/MuiReportCharts';

function feeTone(status) {
  const s = String(status || '').toUpperCase();
  if (['PAID', 'COMPLETED'].includes(s)) return 'success';
  if (['OVERDUE', 'FAILED'].includes(s)) return 'danger';
  if (['PARTIAL', 'SENT', 'DUE'].includes(s)) return 'warning';
  return 'neutral';
}

export default function StudentFeesPage() {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_FEES)
      .then((res) => {
        if (!cancelled) setBundle(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setBundle(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const summary = bundle?.summary || {};
  const currency = summary.currency || 'INR';
  const invoices = bundle?.invoices || [];
  const payments = bundle?.payments || [];
  const installments = bundle?.installments || [];
  const paidPercent = summary.totalFees
    ? Math.round((Number(summary.paid) / Number(summary.totalFees)) * 100)
    : 0;

  const feeChart = useMemo(() => ([
    { label: 'Paid', count: Number(summary.paid) || 0 },
    { label: 'Pending', count: Number(summary.pending) || 0 },
  ].filter((r) => r.count > 0)), [summary.paid, summary.pending]);

  if (loading) return <PortalSkeletonPage />;

  return (
    <PortalPage className="crm-stu-fees">
      <div className="crm-portal-page-toolbar">
        <Link to={ROUTES.STUDENT_RECEIPTS}>
          <Button size="sm" variant="outline" icon={FiFileText}>Receipts</Button>
        </Link>
      </div>

      <PortalMetrics columns={4}>
        <PortalMetric label="Total fees" value={formatMoney(summary.totalFees, currency)} tone="neutral" icon={FiDollarSign} />
        <PortalMetric label="Paid" value={formatMoney(summary.paid, currency)} tone="success" />
        <PortalMetric label="Pending" value={formatMoney(summary.pending, currency)} tone="warning" />
        <PortalMetric
          label="Next due"
          value={summary.nextDueAmount != null ? formatMoney(summary.nextDueAmount, currency) : '—'}
          hint={summary.nextDueDate ? formatDate(summary.nextDueDate) : 'No upcoming due'}
          tone="info"
        />
      </PortalMetrics>

      {(feeChart.length > 0 || paidPercent > 0) && (
        <div className="crm-stu-fees__charts">
          <PortalPanel title="Payment progress" description="% of fees paid" padded>
            <ReportGaugeChart value={paidPercent} max={100} height={168} label="Paid" color="#059669" />
          </PortalPanel>
          {feeChart.length > 0 && (
            <PortalPanel title="Fee split" description="Paid vs pending" padded>
              <ReportDonutChart
                data={feeChart}
                nameKey="label"
                valueKey="count"
                height={200}
                centerLabel="Total"
                centerValue={formatMoney(summary.totalFees, currency)}
              />
            </PortalPanel>
          )}
        </div>
      )}

      {installments.length > 0 && (
        <PortalPanel title="Installments">
          <PortalTable>
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Due date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((row) => (
                <tr key={row.id}>
                  <td>{row.title || 'Installment'}</td>
                  <td>{formatMoney(row.amount, currency)}</td>
                  <td>{formatDate(row.dueDate)}</td>
                  <td><PortalBadge tone={feeTone(row.status)}>{row.status}</PortalBadge></td>
                </tr>
              ))}
            </tbody>
          </PortalTable>
        </PortalPanel>
      )}

      <div className="crm-stu-fees__tables">
        <PortalPanel title="Invoices">
          {!invoices.length ? (
            <PortalEmpty title="No invoices yet" description="Invoices will appear here after billing." className="crm-portal-empty--panel" />
          ) : (
            <PortalTable>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Total</th>
                  <th>Due date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((row) => (
                  <tr key={row.id}>
                    <td>{row.invoiceNo}</td>
                    <td>{formatMoney(row.total, row.currency || currency)}</td>
                    <td>{formatDate(row.dueDate)}</td>
                    <td><PortalBadge tone={feeTone(row.status)}>{row.status}</PortalBadge></td>
                  </tr>
                ))}
              </tbody>
            </PortalTable>
          )}
        </PortalPanel>

        <PortalPanel
          title="Recent payments"
          action={(
            <Link to={ROUTES.STUDENT_RECEIPTS}>
              <Button size="sm" variant="ghost">All receipts</Button>
            </Link>
          )}
        >
          {!payments.length ? (
            <PortalEmpty title="No payments yet" description="Payment history will show here." className="crm-portal-empty--panel" />
          ) : (
            <PortalTable minWidth={480}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 10).map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.date, true)}</td>
                    <td>{formatMoney(row.amount, currency)}</td>
                    <td>{row.method || '—'}</td>
                    <td>{row.receiptNo || row.reference || '—'}</td>
                    <td>
                      <Link
                        to={`${ROUTES.STUDENT_RECEIPTS}?id=${encodeURIComponent(row.receiptNo || row.id)}`}
                        className="text-brand text-xs font-semibold"
                      >
                        Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </PortalTable>
          )}
        </PortalPanel>
      </div>
    </PortalPage>
  );
}
