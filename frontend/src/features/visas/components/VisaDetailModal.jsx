import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckCircle, FiExternalLink, FiClipboard, FiFileText, FiMail, FiAward, FiXCircle,
} from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import { resolveStudentPhotoUrl } from '../../student/config/studentDocument.config';
import ContentLoader from '../../../components/ui/ContentLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';
import {
  useGetVisaQuery,
  useUpdateVisaMutation,
  useDeleteVisaMutation,
} from '../redux/visaApiSlice';
import { displayVisaStatus, getVisaStatusTone } from '../config/visaConstants';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import CountryFlagLabel from '../../../components/ui/CountryFlagLabel';
import '../styles/visas.theme.css';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function DetailTile({ label, value, country = false }) {
  return (
    <div className="visa-detail-tile">
      <span className="visa-detail-tile__label">{label}</span>
      <span className="visa-detail-tile__value" title={!country && value ? String(value) : undefined}>
        {country ? <CountryFlagLabel country={value} size="sm" /> : (value || '—')}
      </span>
    </div>
  );
}

export default function VisaDetailModal({
  visaId, open, onClose, onUpdated, onDeleted,
}) {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState([]);
  const [advancing, setAdvancing] = useState(false);

  const { data: record, isLoading, refetch } = useGetVisaQuery(visaId, {
    skip: !open || !visaId,
  });
  const [updateVisa] = useUpdateVisaMutation();
  const [deleteVisa, { isLoading: deleting }] = useDeleteVisaMutation();

  useEffect(() => {
    const countryId = record?.metadata?.countryId;
    if (!countryId || !open) {
      setChecklist([]);
      return undefined;
    }
    let cancelled = false;
    masterApi.visaChecklistByCountry(countryId)
      .then((res) => {
        if (!cancelled) setChecklist(Array.isArray(res?.data) ? res.data : (res || []));
      })
      .catch(() => { if (!cancelled) setChecklist([]); });
    return () => { cancelled = true; };
  }, [record?.metadata?.countryId, open]);

  const advanceStatus = async () => {
    const countryId = record?.metadata?.countryId;
    if (!countryId) {
      toastService.error('Visa has no country — assign a country first');
      return;
    }
    setAdvancing(true);
    try {
      const workflowRes = await masterApi.visaStatusWorkflow(countryId);
      const workflow = Array.isArray(workflowRes?.data) ? workflowRes.data : (workflowRes || []);
      const currentId = record.metadata?.visaStatusMasterId;
      const idx = workflow.findIndex((s) => s.value === currentId);
      const next = idx >= 0 ? workflow[idx + 1] : workflow[0];
      if (!next) {
        toastService.info('Already at the final status');
        return;
      }
      await updateVisa({ id: record.id, visaStatusMasterId: next.value }).unwrap();
      toastService.success(`Status updated to ${next.label}`);
      refetch();
      onUpdated?.();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Update failed'));
    } finally {
      setAdvancing(false);
    }
  };

  const handleDelete = async () => {
    const ok = await alertService.deleteConfirm({
      title: 'Delete visa case',
      text: 'This will remove the visa case.',
    });
    if (!ok) return;
    try {
      await deleteVisa(record.id).unwrap();
      toastService.success('Visa case removed');
      onDeleted?.();
      onClose?.();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Delete failed'));
    }
  };

  const student = record?.student;
  const studentLabel = student
    ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.studentCode
    : '—';
  const statusLabel = record ? displayVisaStatus(record) : '';
  const statusTone = record ? getVisaStatusTone(record.status, record.metadata) : 'neutral';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record?.applicationNo || 'Visa Case'}
      subtitle={record ? `${record.country || '—'} · ${record.visaType || 'Visa'}` : 'Loading…'}
      size="lg"
      footer={record && (
        <>
          <PermissionGate permission={PERMISSIONS.VISAS_DELETE}>
            <Button variant="danger" type="button" size="sm" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </PermissionGate>
          <div className="ml-auto flex items-center gap-2">
            {student?.id && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                icon={FiExternalLink}
                onClick={() => {
                  navigate(ROUTES.STUDENT_TAB(student.id, 'visa'));
                  onClose?.();
                }}
              >
                Open Student
              </Button>
            )}
            <PermissionGate permission={PERMISSIONS.VISAS_UPDATE}>
              <Button
                variant="primary"
                size="sm"
                type="button"
                icon={FiCheckCircle}
                loading={advancing}
                onClick={advanceStatus}
              >
                Advance Status
              </Button>
            </PermissionGate>
          </div>
        </>
      )}
    >
      {isLoading && !record ? (
        <ContentLoader rows={5} />
      ) : record ? (
        <div className="visa-detail">
          <div className="visa-detail__hero">
            <Avatar name={studentLabel} src={resolveStudentPhotoUrl(student)} size="lg" />
            <div className="visa-detail__hero-body">
              <div className="visa-detail__hero-name">{studentLabel}</div>
              <div className="visa-detail__hero-meta">
                <span className="font-mono">{student?.studentCode || '—'}</span>
                {record.country ? (
                  <span className="inline-flex items-center gap-1">
                    · <CountryFlagLabel country={record.country} size="xs" />
                  </span>
                ) : null}
                {record.visaType ? <span>· {record.visaType}</span> : null}
              </div>
            </div>
            <div className="visa-detail__hero-aside">
              <Badge color={statusTone}>{statusLabel}</Badge>
              <div className="visa-detail__hero-badges">
                {record.metadata?.mailSend && (
                  <span className="visa-detail__chip"><FiMail className="w-3 h-3" /> Mail</span>
                )}
                {record.metadata?.visaApproved && (
                  <span className="visa-detail__chip visa-detail__chip--success">
                    <FiAward className="w-3 h-3" /> Approved
                  </span>
                )}
                {record.metadata?.visaRejected && (
                  <span className="visa-detail__chip visa-detail__chip--danger">
                    <FiXCircle className="w-3 h-3" /> Rejected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="visa-detail__grid">
            <DetailTile label="Student" value={studentLabel} />
            <DetailTile label="Student code" value={student?.studentCode} />
            <DetailTile label="Country" value={record.country || record.metadata?.countryName} country />
            <DetailTile label="Visa type" value={record.visaType} />
            <DetailTile label="Visa no" value={record.applicationNo} />
            <DetailTile label="Workflow status" value={record.metadata?.visaStatusName || statusLabel} />
            <DetailTile label="Submitted" value={formatDate(record.submittedAt)} />
            <DetailTile label="Decision" value={formatDate(record.decisionAt)} />
            <DetailTile label="Expiry" value={formatDate(record.expiryDate)} />
          </div>

          {checklist.length > 0 && (
            <div className="visa-detail__docs">
              <div className="visa-detail__docs-head">
                <FiClipboard className="w-4 h-4 text-primary shrink-0" />
                <span>Visa Documents</span>
                <span className="visa-detail__docs-count">{checklist.length}</span>
              </div>
              <ul className="visa-detail__docs-list">
                {checklist.map((item) => (
                  <li key={item.id} className="visa-detail__doc-item">
                    <FiFileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span>
                      {item.name}
                      {item.isMandatory && <span className="text-danger font-medium"> *</span>}
                      {item.documentType && <span className="text-text-muted"> ({item.documentType})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-text-muted py-8 text-center">Visa case not found</div>
      )}
    </Modal>
  );
}
