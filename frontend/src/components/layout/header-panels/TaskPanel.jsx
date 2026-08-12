import { FiExternalLink, FiPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Button from '../../ui/Button';
import { TASK_PREVIEW } from '../../../config/headerMock.data';
import { ROUTES } from '../../../config/routes';

const STATUS_STYLES = {
  Pending: 'bg-danger-soft text-danger border-danger/30',
  Complete: 'bg-success-soft text-success border-success/30',
};

const PRIORITY_STYLES = {
  High: 'text-success border-success/40 bg-success-soft/50',
  Medium: 'text-warning border-warning/40 bg-warning-soft/50',
  Low: 'text-text-muted border-border bg-page',
};

export default function TaskPanel() {
  const pendingCount = TASK_PREVIEW.filter((t) => t.status === 'Pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-text-secondary">
          <strong className="text-text">{pendingCount}</strong> pending tasks
        </p>
        <Link to={ROUTES.TASKS}>
          <Button size="sm" icon={FiPlus}>
            Create Task
          </Button>
        </Link>
      </div>

      <ul className="space-y-2">
        {TASK_PREVIEW.map((task) => (
          <li
            key={task.id}
            className={`p-3 rounded-lg border transition-colors ${
              task.status === 'Pending'
                ? 'border-danger/20 bg-danger-soft/30'
                : 'border-border bg-page'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-text">{task.title}</p>
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  STATUS_STYLES[task.status] || STATUS_STYLES.Pending
                }`}
              >
                {task.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span
                className={`px-2 py-0.5 rounded border font-medium ${
                  PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.Low
                }`}
              >
                {task.priority}
              </span>
              <span className="text-text-muted">Due: {task.dueDate}</span>
              <span className="text-text-muted">→ {task.assignedTo}</span>
            </div>
          </li>
        ))}
      </ul>

      <Link to={ROUTES.TASKS} className="block">
        <Button variant="outline" className="w-full" icon={FiExternalLink}>
          View all tasks
        </Button>
      </Link>
    </div>
  );
}
