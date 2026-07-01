import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const VendorOrdersTrendChart = ({ data = [] }) => {
    return (
        <section className="vendor-card vendor-chart-card">
            <div className="vendor-card-header">
                <h2>Orders Trend</h2>
            </div>

            <div className="vendor-chart-wrap" aria-label="Orders trend bar chart">
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            ticks={[5, 10, 20, 40]}
                            domain={[0, (dataMax) => Math.max(dataMax, 40)]}
                        />
                        <Tooltip formatter={(value) => [value, 'orders']} />
                        <Legend verticalAlign="bottom" height={24} />
                        <Bar dataKey="orders" name="orders" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};

export default VendorOrdersTrendChart;
