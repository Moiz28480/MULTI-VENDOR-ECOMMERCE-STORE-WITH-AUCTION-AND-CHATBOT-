import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const BASE_DATA = [
    { month: 'Nov', users: 16, vendors: 10 },
    { month: 'Dec', users: 19, vendors: 12 },
    { month: 'Jan', users: 22, vendors: 14 },
    { month: 'Feb', users: 25, vendors: 16 },
];

const getGrowthData = ({ totalUsers, activeVendors }) => {
    const usersValue = Number(totalUsers || 0);
    const vendorsValue = Number(activeVendors || 0);

    return [
        ...BASE_DATA,
        { month: 'Mar', users: usersValue, vendors: vendorsValue },
        { month: 'Apr', users: 0, vendors: 0 },
    ];
};

const GrowthChart = ({ totalUsers = 0, activeVendors = 0 }) => {
    const data = getGrowthData({ totalUsers, activeVendors });

    return (
        <article className="admin-chart-card" aria-label="User and vendor growth chart">
            <h2 className="admin-chart-title">User & Vendor Growth</h2>

            <div className="admin-chart-body">
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                        <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis
                            ticks={[10, 20, 30, 40]}
                            domain={[0, 40]}
                            tick={{ fill: '#4b5563', fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: 10, border: '1px solid #d1d5db' }}
                            labelStyle={{ color: '#111827', fontWeight: 600 }}
                        />
                        <Area type="monotone" dataKey="users" stroke="#2563eb" fill="#93c5fd" fillOpacity={0.45} strokeWidth={2} />
                        <Area type="monotone" dataKey="vendors" stroke="#0f766e" fill="#5eead4" fillOpacity={0.35} strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </article>
    );
};

export default GrowthChart;
