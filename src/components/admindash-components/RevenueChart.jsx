import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const BASE_DATA = [
    { month: 'Nov', revenue: 700 },
    { month: 'Dec', revenue: 900 },
    { month: 'Jan', revenue: 1100 },
    { month: 'Feb', revenue: 1300 },
];

const getRevenueData = (totalRevenue) => {
    const dynamicRevenue = Number(totalRevenue || 0);

    return [
        ...BASE_DATA,
        { month: 'Mar', revenue: dynamicRevenue },
        { month: 'Apr', revenue: dynamicRevenue },
    ];
};

const RevenueChart = ({ totalRevenue = 0 }) => {
    const data = getRevenueData(totalRevenue);

    return (
        <article className="admin-chart-card" aria-label="Platform revenue chart">
            <h2 className="admin-chart-title">Platform Revenue</h2>

            <div className="admin-chart-body">
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                        <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis
                            ticks={[500, 1000, 1500, 2000]}
                            domain={[0, 2000]}
                            tick={{ fill: '#4b5563', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                            contentStyle={{ borderRadius: 10, border: '1px solid #d1d5db' }}
                            labelStyle={{ color: '#111827', fontWeight: 600 }}
                        />
                        <Bar dataKey="revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </article>
    );
};

export default RevenueChart;
