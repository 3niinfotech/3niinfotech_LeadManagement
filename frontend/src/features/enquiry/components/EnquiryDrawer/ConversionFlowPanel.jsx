import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiArrowDown, FiRepeat, FiCheckCircle } from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import { buildConversionFlow } from '../../utils/enquiryConversion.utils';
import { ROUTES } from '../../../../config/routes';

function FlowStep({ step, isLast }) {
  return (
    <>
      <div className="crm-conversion-flow__step" data-status={step.status}>
        <span className="crm-conversion-flow__step-dot" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="crm-conversion-flow__step-head">
            <p className="crm-conversion-flow__step-title">{step.label}</p>
            {step.meta && (
              <span className="crm-conversion-flow__step-meta">{step.meta}</span>
            )}
          </div>
          <p className="crm-conversion-flow__step-desc">{step.description}</p>
        </div>
      </div>
      {!isLast && (
        <div className="crm-conversion-flow__arrow" aria-hidden>
          <FiArrowDown className="w-4 h-4" />
        </div>
      )}
    </>
  );
}

export default function ConversionFlowPanel({
  enquiry,
  onConvert,
  converting = false,
}) {
  const flow = useMemo(() => buildConversionFlow(enquiry), [enquiry]);

  if (!flow) {
    return (
      <FormSection
        title="Convert to Student"
        description="Creates a separate student record — applications, visa, and finance live there."
      >
        <p className="text-sm text-text-muted text-center py-6 border border-dashed border-border rounded-lg">
          Conversion flow appears once the enquiry is saved.
        </p>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Convert to Student"
      description="Creates a separate student record — applications, visa, and finance live there."
    >
      <div className="crm-conversion-flow">
        <div className="crm-conversion-flow__banner">
          <span className="crm-conversion-flow__banner-icon" aria-hidden>
            {flow.converted ? <FiCheckCircle className="w-4 h-4" /> : <FiRepeat className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <p className="crm-conversion-flow__banner-title">
              {flow.converted ? 'Converted to student' : 'Ready to convert'}
            </p>
            <p className="crm-conversion-flow__banner-meta">
              {flow.enquiryCode}
              {flow.studentCode ? ` → ${flow.studentCode}` : ''}
              {flow.linkedExisting ? ' · linked to existing student' : ''}
            </p>
          </div>
          <Badge color={flow.converted ? 'success' : 'brand'} className="shrink-0">
            {flow.converted ? 'Done' : 'Pending'}
          </Badge>
        </div>

        <div className="crm-conversion-flow__pipeline" aria-label="Lead to student conversion flow">
          {flow.steps.map((step, index) => (
            <FlowStep key={step.id} step={step} isLast={index === flow.steps.length - 1} />
          ))}
        </div>

        <div className="crm-conversion-flow__actions">
          {flow.canConvert && (
            <Button
              icon={FiUser}
              onClick={() => onConvert?.()}
              loading={converting}
            >
              Convert to Student
            </Button>
          )}
          {flow.converted && flow.studentId && (
            <Link to={ROUTES.STUDENT_DETAIL(flow.studentId)}>
              <Button variant="outline" icon={FiUser}>
                Open student profile
              </Button>
            </Link>
          )}
          {flow.blocked && !flow.converted && (
            <p className="text-sm text-text-muted">
              This enquiry cannot be converted in its current status.
            </p>
          )}
        </div>
      </div>
    </FormSection>
  );
}
