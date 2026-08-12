import { useMemo } from 'react';
import { FiZap, FiRefreshCw } from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';
import FormSection from '../../../../components/ui/FormSection';
import { buildEnquiryAiSummary } from '../../utils/enquiryAiSummary.utils';

const TONE_MAP = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  primary: 'primary',
  secondary: 'secondary',
};

function ConversionRing({ value, tone }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="crm-ai-summary__ring" data-tone={tone}>
      <svg width="104" height="104" viewBox="0 0 104 104" aria-hidden>
        <circle cx="52" cy="52" r={radius} className="crm-ai-summary__ring-track" />
        <circle
          cx="52"
          cy="52"
          r={radius}
          className="crm-ai-summary__ring-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="crm-ai-summary__ring-label">
        <span className="crm-ai-summary__ring-value">{value}%</span>
        <span className="crm-ai-summary__ring-caption">Conversion</span>
      </div>
    </div>
  );
}

export default function AiSummaryPanel({ enquiry }) {
  const summary = useMemo(() => buildEnquiryAiSummary(enquiry), [enquiry]);

  if (!summary) {
    return (
      <FormSection
        title="AI Summary"
        description="Save the enquiry to generate insights automatically."
      >
        <p className="text-sm text-text-muted text-center py-6 border border-dashed border-border rounded-lg">
          AI summary will appear once enquiry data is available.
        </p>
      </FormSection>
    );
  }

  const updatedLabel = summary.generatedAt
    ? new Date(summary.generatedAt).toLocaleString('en-IN')
    : 'Just now';

  return (
    <FormSection
      title="AI Summary"
      description="Generated automatically from profile, demos, notes, and activity."
    >
      <div className="crm-ai-summary">
        <div className="crm-ai-summary__main">
          <div className="crm-ai-summary__header">
            <span className="crm-ai-summary__badge">
              <FiZap className="w-3.5 h-3.5" />
              Auto-generated
            </span>
            <span className="crm-ai-summary__updated">
              <FiRefreshCw className="w-3 h-3" />
              {updatedLabel}
            </span>
          </div>

          {summary.insights.length === 0 ? (
            <p className="text-sm text-text-muted py-4">
              Add country, course, demos, or notes to unlock richer insights.
            </p>
          ) : (
            <div className="crm-ai-summary__insights">
              {summary.insights.map((item) => (
                <Badge
                  key={item.id}
                  color={TONE_MAP[item.tone] || 'secondary'}
                  className="crm-ai-summary__insight"
                >
                  {item.label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="crm-ai-summary__score">
          <p className="crm-ai-summary__score-title">Conversion Chance</p>
          <ConversionRing value={summary.conversionChance} tone={summary.conversionTone} />
        </div>
      </div>
    </FormSection>
  );
}
