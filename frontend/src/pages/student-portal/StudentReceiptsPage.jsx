import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiPrinter, FiX } from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import Button from '../../components/ui/Button';
import { ROUTES } from '../../config/routes';
import { selectUser } from '../../redux/slices/authSlice';
import { formatDate, formatMoney } from './components/portalFormat';
import {
  PortalPage,
  PortalPanel,
  PortalEmpty,
  PortalSkeletonPage,
  PortalTable,
} from '../../components/portal/PortalUi';

function ReceiptView({ receipt, currency = 'INR', companyFallback, onClose }) {
  if (!receipt) return null;
  const { student, receipt: payment, issuedAt, company } = receipt;
  const receiptNo = payment?.receiptNo || payment?.reference || '—';
  const status = String(payment?.status || 'PAID').toUpperCase();
  const companyName = company?.name || companyFallback || 'VisaERP';

  return (
    <div className="crm-receipt-wrap">
      <div className="crm-receipt-toolbar crm-print-hide">
        <div>
          <p className="crm-receipt-toolbar__title">Payment receipt</p>
          <p className="crm-receipt-toolbar__sub">Ready to print or save as PDF</p>
        </div>
        <div className="crm-receipt-toolbar__actions">
          <Button variant="primary" size="sm" icon={FiPrinter} onClick={() => window.print()}>
            Print
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" icon={FiX} onClick={onClose}>Close</Button>
          )}
        </div>
      </div>

      <article className="crm-print-document crm-receipt" aria-label="Payment receipt">
        <header className="crm-receipt__head">
          <div className="crm-receipt__brand">
            <span className="crm-receipt__mark" aria-hidden>
              {(companyName || 'V').charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="crm-receipt__org">{companyName}</p>
              <p className="crm-receipt__doc-label">Official payment receipt</p>
            </div>
          </div>
          <div className="crm-receipt__meta-head">
            <span className={`crm-receipt__status crm-receipt__status--${status === 'PAID' || status === 'SUCCESS' ? 'ok' : 'muted'}`}>
              {status}
            </span>
            <p className="crm-receipt__no">#{receiptNo}</p>
            <p className="crm-receipt__issued">Issued {formatDate(issuedAt || payment?.date, true)}</p>
          </div>
        </header>

        <section className="crm-receipt__amount-block">
          <p className="crm-receipt__amount-label">Amount paid</p>
          <p className="crm-receipt__amount">{formatMoney(payment?.amount, currency)}</p>
        </section>

        <section className="crm-receipt__grid">
          <div className="crm-receipt__field">
            <span>Student</span>
            <strong>{student?.name || '—'}</strong>
            <em>{student?.studentCode || '—'}</em>
          </div>
          <div className="crm-receipt__field">
            <span>Branch</span>
            <strong>{student?.branch || '—'}</strong>
          </div>
          <div className="crm-receipt__field">
            <span>Payment method</span>
            <strong>{payment?.method || '—'}</strong>
          </div>
          <div className="crm-receipt__field">
            <span>Reference</span>
            <strong>{payment?.reference || receiptNo}</strong>
          </div>
        </section>

        <footer className="crm-receipt__foot">
          <p>This is a system-generated receipt. Keep it for your records.</p>
          <p className="crm-receipt__foot-print">Printed {formatDate(new Date().toISOString(), true)}</p>
        </footer>
      </article>
    </div>
  );
}

export default function StudentReceiptsPage() {
  const user = useSelector(selectUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const [payments, setPayments] = useState([]);
  const [currency, setCurrency] = useState('INR');
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const loadReceipt = useCallback((key) => {
    if (!key) {
      setReceipt(null);
      return;
    }
    setReceiptLoading(true);
    apiGet(API.PORTAL_STUDENT_RECEIPT(key))
      .then((res) => setReceipt(res.data || null))
      .catch(() => setReceipt(null))
      .finally(() => setReceiptLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGet(API.PORTAL_STUDENT_FEES)
      .then((res) => {
        if (cancelled) return;
        const bundle = res.data || {};
        setPayments(bundle.payments || []);
        setCurrency(bundle.summary?.currency || 'INR');
      })
      .catch(() => {
        if (!cancelled) setPayments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedId) loadReceipt(selectedId);
    else setReceipt(null);
  }, [selectedId, loadReceipt]);

  if (loading) return <PortalSkeletonPage />;

  return (
    <PortalPage className={receipt ? 'crm-portal-page--printing-ready' : ''}>
      <div className="crm-print-hide">
        <div className="crm-portal-page-toolbar">
          <Link to={ROUTES.STUDENT_FEES}>
            <Button size="sm" variant="outline">Back to fees</Button>
          </Link>
        </div>
      </div>

      {(receiptLoading || receipt) && (
        receiptLoading
          ? <div className="crm-print-hide"><PortalSkeletonPage /></div>
          : (
            <ReceiptView
              receipt={receipt}
              currency={currency}
              companyFallback={user?.company?.name}
              onClose={() => setSearchParams({})}
            />
          )
      )}

      <div className="crm-print-hide">
        <PortalPanel title="Payment history">
          {!payments.length ? (
            <PortalEmpty title="No receipts yet" description="Payments will appear here after they are recorded." />
          ) : (
            <PortalTable>
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
                {payments.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.date, true)}</td>
                    <td>{formatMoney(row.amount, currency)}</td>
                    <td>{row.method || '—'}</td>
                    <td>{row.receiptNo || row.reference || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="text-brand text-xs font-semibold"
                        onClick={() => setSearchParams({ id: String(row.receiptNo || row.id) })}
                      >
                        View
                      </button>
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
