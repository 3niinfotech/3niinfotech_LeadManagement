import IconBox from './IconBox';
import Card from './Card';

export default function StatCard({ title, value, change, icon: Icon, color = 'primary' }) {
  return (
    <Card hover className="!p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary font-medium">{title}</p>
          <p className="text-2xl font-semibold text-text mt-1">{value}</p>
          {change != null && (
            <p className={`text-xs mt-1 font-medium ${change >= 0 ? 'text-success' : 'text-danger'}`}>
              {change >= 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        {Icon && <IconBox icon={Icon} color={color} size="md" />}
      </div>
    </Card>
  );
}
