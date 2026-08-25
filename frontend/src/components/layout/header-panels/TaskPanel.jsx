import { useMemo, useState } from 'react';
import { FiCheckSquare } from 'react-icons/fi';
import { TASK_PREVIEW } from '../../../config/headerMock.data';

const PRIORITY_DOT = {
  High: 'bg-danger',
  Medium: 'bg-warning',
  Low: 'bg-text-muted',
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Complete', label: 'Done' },
];

export default function TaskPanel({ onClose }) {
  const [filter, setFilter] = useState('Pending');

  const pendingCount = TASK_PREVIEW.filter((t) => t.status === 'Pending').length;
  const filtered = useMemo(
    () => (filter === 'all' ? TASK_PREVIEW : TASK_PREVIEW.filter((t) => t.status === filter)),
    [filter],
  );

  return (
    <div>
      <div className="px-4 pt-3 pb-2 border-b border-border bg-page/40 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] text-text-secondary">
            <span className="font-semibold text-text">{pendingCount}</span> pending
            {' · '}
            {TASK_PREVIEW.length} total
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                filter === f.id
                  ? 'bg-brand-soft text-brand border-brand/25'
                  : 'bg-page text-text-muted border-border hover:text-text hover:bg-row-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 py-2">
        {filtered.length === 0 ? (
          <div className="py-10 text-center px-4">
            <FiCheckSquare className="w-9 h-9 text-text-muted mx-auto mb-2 opacity-45" />
            <p className="text-sm font-medium text-text">No tasks here</p>
            <p className="text-[12px] text-text-muted mt-1">Create a task or switch filters.</p>
          </div>
        ) : (
          <ul className="space-y-0.5 max-h-[340px] overflow-y-auto no-scrollbar">
            {filtered.map((task) => {
              const done = task.status === 'Complete';
              return (
                <li key={task.id}>
                  <div
                    className={`px-3 py-2.5 rounded-xl transition-colors ${
                      done ? 'opacity-70 hover:bg-row-hover' : 'hover:bg-row-hover'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          done ? 'bg-success' : PRIORITY_DOT[task.priority] || PRIORITY_DOT.Low
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-[13px] font-semibold line-clamp-1 ${
                              done ? 'text-text-muted line-through' : 'text-text'
                            }`}
                          >
                            {task.title}
                          </p>
                          <span
                            className={`text-[10px] font-semibold shrink-0 ${
                              done ? 'text-success' : 'text-danger'
                            }`}
                          >
                            {done ? 'Done' : 'Pending'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-text-muted">
                          {task.priority}
                          {' · Due '}
                          {task.dueDate}
                          {' · '}
                          {task.assignedTo}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
