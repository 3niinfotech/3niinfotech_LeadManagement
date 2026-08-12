import { FiInbox } from 'react-icons/fi';
import Button from './Button';
import IconBox from './IconBox';

export default function EmptyState({ title = 'No data found', description, actionLabel, onAction, icon: Icon = FiInbox, iconColor = 'secondary' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <IconBox icon={Icon} color={iconColor} size="lg" iconSize="lg" />
      <h3 className="text-lg font-medium text-text dark:text-text-dark mt-4 mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted dark:text-text-mutedDark text-center max-w-sm mb-4">{description}</p>}
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
