import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCheckCircle,
  FiExternalLink,
  FiClipboard,
  FiFileText,
  FiMail,
  FiAward,
} from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import ContentLoader from '../../../components/ui/ContentLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';
import {
  useGetApplicationQuery,
  useUpdateApplicationMutation,
  useDeleteApplicationMutation,
} from '../redux/applicationApiSlice';
import {
  displayApplicationStatus,
  getApplicationStatusTone,
} from '../config/applicationConstants';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import CountryFlagLabel from '../../../components/ui/CountryFlagLabel';
import '../styles/applications.theme.css';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function DetailTile({ label, value, country = false }) {
  return (
    <div className="app-detail-tile">
      <span className="app-detail-tile__label">{label}</span>
      <span className="app-detail-tile__value" title={!country && value ? String(value) : undefined}>
        {country ? <CountryFlagLabel country={value} size="sm" /> : (value || '—')}
      </span>
    </div>
  );
}

export default function ApplicationDetailModal({
  applicationId,
  open,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState([]);
  const [advancing, setAdvancing] = useState(false);

  const { data: record, isLoading, refetch } = useGetApplicationQuery(applicationId, {
    skip: !open || !applicationId,
  });
  const [updateApplication] = useUpdateApplicationMutation();
  const [deleteApplication, { isLoading: deleting }] = useDeleteApplicationMutation();

  useEffect(() => {
    const countryId = record?.metadata?.countryId;
    if (!countryId || !open) {
      setChecklist([]);
      return undefined;
    }
    let cancelled = false;
    masterApi.applicationChecklistByCountry(countryId)
      .then((res) => {
        if (!cancelled) {
          setChecklist(Array.isArray(res?.data) ? res.data : (res || []));
        }
      })
      .catch(() => {
        if (!cancelled) setChecklist([]);
      });
    return () => { cancelled = true; };
  }, [record?.metadata?.countryId, open]);

  const advanceStatus = async () => {
    const countryId = record?.metadata?.countryId;
    if (!countryId) {
      toastService.error('Application has no country — assign a country first');
      return;
    }
    setAdvancing(true);
    try {
      const workflowRes = await masterApi.applicationStatusWorkflow(countryId);
      const workflow = Array.isArray(workflowRes?.data) ? workflowRes.data : (workflowRes || []);
      const currentId = record.metadata?.applicationStatusMasterId;
      const idx = workflow.findIndex((s) => s.value === currentId);
      const next = idx >= 0 ? workflow[idx + 1] : workflow[0];
      if (!next) {
        toastService.info('Already at the final status');
        return;
      }
      await updateApplication({
        id: record.id,
        applicationStatusMasterId: next.value,
      }).unwrap();
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
      title: 'Delete application',
      text: 'This will remove the application record.',
    });
    if (!ok) return;
    try {
      await deleteApplication(record.id).unwrap();
      toastService.success('Application removed');
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
  const statusLabel = record ? displayApplicationStatus(record) : '';
  const statusTone = record ? getApplicationStatusTone(record.status, record.metadata) : 'neutral';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record?.applicationNo || 'Application Details'}
      subtitle={record ? `${record.university || '—'} · ${record.course || '—'}` : 'Loading application…'}
      size="lg"
      className="app-detail-modal"
      footer={record && (
        <>
          <PermissionGate permission={PERMISSIONS.APPLICATIONS_DELETE}>
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
                  navigate(ROUTES.STUDENT_TAB(student.id, 'applications'));
                  onClose?.();
                }}
              >
                Open Student
              </Button>
            )}
            <PermissionGate permission={PERMISSIONS.APPLICATIONS_UPDATE}>
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
        <div className="app-detail">
          {/* Hero */}
          <div className="app-detail__hero">
            <Avatar name={studentLabel} size="lg" />
            <div className="app-detail__hero-body">
              <div className="app-detail__hero-name">{studentLabel}</div>
              <div className="app-detail__hero-meta">
                <span className="font-mono">{student?.studentCode || '—'}</span>
                {record.country || record.metadata?.countryName ? (
                  <span className="inline-flex items-center gap-1">
                    · <CountryFlagLabel country={record.country || record.metadata?.countryName} size="xs" />
                  </span>
                ) : null}
                {record.intake ? <span>· {record.intake}</span> : null}
              </div>
            </div>
            <div className="app-detail__hero-aside">
              <Badge color={statusTone}>{statusLabel}</Badge>
              <div className="app-detail__hero-badges">
                {record.metadata?.mailSend && (
                  <span className="app-detail__chip">
                    <FiMail className="w-3 h-3" /> Mail enabled
                  </span>
                )}
                {record.metadata?.setOfferLetter && (
                  <span className="app-detail__chip app-detail__chip--success">
                    <FiAward className="w-3 h-3" /> Offer stage
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Facts grid — centered tiles */}
          <div className="app-detail__grid">
            <DetailTile label="Student" value={studentLabel} />
            <DetailTile label="Student code" value={student?.studentCode} />
            <DetailTile label="Country" value={record.country || record.metadata?.countryName} country />
            <DetailTile label="University" value={record.university} />
            <DetailTile label="Course" value={record.course} />
            <DetailTile label="Intake" value={record.intake} />
            <DetailTile label="Submitted" value={formatDate(record.submittedAt)} />
            <DetailTile label="Offer date" value={formatDate(record.offerDate)} />
            <DetailTile
              label="Workflow status"
              value={record.metadata?.applicationStatusName || statusLabel}
            />
          </div>

          {checklist.length > 0 && (
            <div className="app-detail__docs">
              <div className="app-detail__docs-head">
                <FiClipboard className="w-4 h-4 text-primary shrink-0" />
                <span>Required Documents</span>
                <span className="app-detail__docs-count">{checklist.length}</span>
              </div>
              <ul className="app-detail__docs-list">
                {checklist.map((item) => (
                  <li key={item.id} className="app-detail__doc-item">
                    <FiFileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
                    <span>
                      {item.name}
                      {item.isMandatory && <span className="text-danger font-medium"> *</span>}
                      {item.documentType && (
                        <span className="text-text-muted"> ({item.documentType})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-text-muted py-8 text-center">Application not found</div>
      )}
    </Modal>
  );
}
