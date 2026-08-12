import { useNavigate } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function WorkflowPipeline({ title, subtitle, steps, activeStep = 0 }) {
  const navigate = useNavigate();

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isDone = index < activeStep;
          return (
            <div
              key={step.id}
              className={`rounded-xl border p-3 ${isActive ? 'border-primary/40 bg-primary/5' : isDone ? 'border-success/30 bg-success/5' : 'border-border bg-surface'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${isDone ? 'bg-success' : isActive ? 'bg-primary' : 'bg-border'}`} />
                    <p className="font-semibold text-text">{step.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">{step.description}</p>
                </div>
                {step.actionLabel && (
                  <Button size="sm" variant={isActive ? 'primary' : 'outline'} onClick={() => navigate(step.route)}>
                    {step.actionLabel}
                    <FiChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
