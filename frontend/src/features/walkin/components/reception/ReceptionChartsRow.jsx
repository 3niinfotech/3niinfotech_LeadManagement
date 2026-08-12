import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="crm-reception-chart-card">
      <div className="crm-reception-chart-card__head">
        <Icon className="w-4 h-4 text-primary-600" />
        <span>{title}</span>
      </div>
      <div className="crm-reception-chart-card__body">{children}</div>
    </div>
  );
}

export default function ReceptionChartsRow({ metrics = {} }) {
  const { byHour = [], bySource = [], byCountry = [], counsellorWorkload = [] } = metrics;

  return (
    <div className="crm-reception-charts">
      <ChartCard title="Walk-ins by Hour" icon={FiBarChart2}>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={byHour}>
            <defs>
              <linearGradient id="walkinHour" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
            <YAxis hide allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="url(#walkinHour)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Lead Sources" icon={FiPieChart}>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie data={bySource.length ? bySource : [{ name: 'Walk-in', value: 1 }]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={2}>
              {(bySource.length ? bySource : [{ name: 'Walk-in', value: 1 }]).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Country Interest" icon={FiTrendingUp}>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={byCountry.length ? byCountry : [{ name: 'N/A', value: 0 }]} layout="vertical" margin={{ left: 4, right: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={72} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Counsellor Workload" icon={FiBarChart2}>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={counsellorWorkload.length ? counsellorWorkload : [{ name: 'Team', value: 0 }]}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={48} />
            <YAxis hide allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
