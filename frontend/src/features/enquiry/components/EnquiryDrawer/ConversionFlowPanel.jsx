import { useMemo, useState } from 'react';
import {
  FiUserPlus, FiCheck, FiArrowRight, FiExternalLink, FiUser,
} from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import { buildConversionFlow } from '../../utils/enquiryConversion.utils';
import { ROUTES, openRouteInNewTab } from '../../../../config/routes';
import ConversionConfirmModal from './ConversionConfirmModal';

function StepCard({ step, index }) {
  const n = index + 1;
  return (
    <div className="crm-convert-step" data-status={step.status}>
      <div className="crm-convert-step__top">
        <span className="crm-convert-step__index" aria-hidden>
          {step.status === 'done' ? <FiCheck className="w-3.5 h-3.5" /> : n}
        </span>
        <span className="crm-convert-step__label">{step.label}</span>
        {step.meta && (
          <span className="crm-convert-step__meta">{step.meta}</span>
        )}
      </div>
      <p className="crm-convert-step__desc">{step.description}</p>
    </div>
  );
}

export default function ConversionFlowPanel({
  enquiry,
  onConvert,
  converting = false,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const flow = useMemo(() => buildConversionFlow(enquiry), [enquiry]);

  const handleConfirm = () => {
    setConfirmOpen(false);
    onConvert?.();
  };

  if (!flow) {
    return (
      <FormSection
        title="Convert to Student"
        description="Promotes this enquiry into the student master for applications, visa, and fees."
        className="crm-conversion-panel"
      >
        <p className="crm-convert-empty">
          Save the enquiry first to unlock conversion.
        </p>
      </FormSection>
    );
  }

  return (
    <>
      <FormSection
        title="Convert to Student"
        description="One person, one master record — enquiry history, demos and documents stay linked."
        className="crm-conversion-panel"
      >
        <div className="crm-convert">
          <div className="crm-convert__summary" data-state={flow.converted ? 'done' : 'ready'}>
            <div className="min-w-0">
              <p className="crm-convert__summary-title">
                {flow.converted ? 'Student record active' : 'Ready for admission'}
              </p>
              <p className="crm-convert__summary-meta">
                <span className="font-mono">{flow.enquiryCode}</span>
                {flow.studentCode && (
                  <>
                    <FiArrowRight className="inline w-3 h-3 mx-1 opacity-60" aria-hidden />
                    <span className="font-mono">{flow.studentCode}</span>
                  </>
                )}
                {flow.linkedExisting && ' · linked existing'}
              </p>
            </div>
            <Badge color={flow.converted ? 'success' : 'brand'} className="shrink-0">
              {flow.converted ? 'Converted' : 'Pending'}
            </Badge>
          </div>

          <div className="crm-convert__rail" aria-label="Conversion stages">
            {flow.steps.map((step, index) => (
              <div key={step.id} className="crm-convert__rail-item">
                <StepCard step={step} index={index} />
                {index < flow.steps.length - 1 && (
                  <span className="crm-convert__rail-arrow" aria-hidden>
                    <FiArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="crm-convert__footer">
            {flow.canConvert && (
              <Button
                icon={FiUserPlus}
                onClick={() => setConfirmOpen(true)}
                loading={converting}
              >
                Convert to Student
              </Button>
            )}
            {flow.converted && flow.studentId && (
              <Button
                variant="outline"
                icon={FiExternalLink}
                onClick={() => openRouteInNewTab(ROUTES.STUDENT_DETAIL(flow.studentId))}
              >
                Open student profile
              </Button>
            )}
            {flow.blocked && !flow.converted && (
              <p className="crm-convert__blocked">
                <FiUser className="w-3.5 h-3.5 shrink-0" />
                Current status blocks conversion. Update status first.
              </p>
            )}
          </div>
        </div>
      </FormSection>

      <ConversionConfirmModal
        open={confirmOpen}
        enquiryId={enquiry?.id}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        onOpenStudent={(studentId) => openRouteInNewTab(ROUTES.STUDENT_DETAIL(studentId))}
        converting={converting}
      />
    </>
  );
}
