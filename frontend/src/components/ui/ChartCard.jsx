import Card from './Card';

export default function ChartCard({ title, children }) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-text mb-4">{title}</h3>
      {children}
    </Card>
  );
}
