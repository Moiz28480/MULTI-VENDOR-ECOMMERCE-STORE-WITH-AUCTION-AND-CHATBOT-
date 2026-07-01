import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const PIE_COLORS = ['#4f46e5', '#06b6d4', '#a855f7', '#f97316', '#22c55e', '#ef4444', '#0ea5e9'];

const VendorCategoryPieChart = ({ data = [] }) => {
    return (
        <section className="vendor-card vendor-category-card">
            <div className="vendor-card-header">
                <h2>Sales by Category</h2>
            </div>

            {data.length ? (
                <>
                    <div className="vendor-pie-wrap" aria-label="Category distribution pie chart">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={88}
                                    paddingAngle={2}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [value, 'Products']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <ul className="vendor-pie-legend">
                        {data.map((entry, index) => (
                            <li key={entry.name}>
                                <span
                                    className="vendor-pie-dot"
                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                    aria-hidden="true"
                                />
                                <span className="vendor-pie-label">{entry.name}</span>
                                <span className="vendor-pie-value">{entry.value}% ({entry.count})</span>
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <p className="vendor-empty-message">No category data available.</p>
            )}
        </section>
    );
};

export default VendorCategoryPieChart;
