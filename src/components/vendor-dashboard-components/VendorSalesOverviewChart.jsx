import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const VendorSalesOverviewChart = ({ data = [] }) => {
    return (
        <section className="vendor-card vendor-chart-card">
            <div className="vendor-card-header">
                <h2>Sales Overview</h2>
            </div>

            <div className="vendor-chart-wrap" aria-label="Sales overview line chart">
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            ticks={[1000, 2000, 4000, 8000]}
                            domain={[0, (dataMax) => Math.max(dataMax, 8000)]}
                        />
                        <Tooltip formatter={(value) => [value, 'sales']} />
                        <Legend verticalAlign="bottom" height={24} />
                        <Line
                            type="monotone"
                            dataKey="sales"
                            name="sales"
                            stroke="#6d28d9"
                            strokeWidth={2}
                            dot={{ r: 3, stroke: '#6d28d9', strokeWidth: 2, fill: '#ffffff' }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};

export default VendorSalesOverviewChart;
