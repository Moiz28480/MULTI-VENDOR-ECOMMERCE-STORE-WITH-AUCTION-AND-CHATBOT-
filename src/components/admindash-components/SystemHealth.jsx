import { Activity } from 'lucide-react';
import { useAdminDashContext } from '../../context/AdminDashContext.jsx';

const getColorClass = (tone) => {
    if (tone === 'green') return 'admin-health-bar-green';
    if (tone === 'orange') return 'admin-health-bar-orange';
    return 'admin-health-bar-red';
};

const SystemHealthMetric = ({ title, status, tone, widthPercent }) => {
    return (
        <div className="admin-health-item">
            <div className="admin-health-row">
                <span className="admin-health-label">{title}</span>
                <span className={`admin-health-value admin-health-value-${tone}`}>{status}</span>
            </div>
            <div className="admin-health-track">
                <div
                    className={`admin-health-bar ${getColorClass(tone)}`}
                    style={{ width: `${widthPercent}%` }}
                />
            </div>
        </div>
    );
};

const SystemHealth = () => {
    const { systemHealth } = useAdminDashContext();

    if (systemHealth.loading) {
        return (
            <section className="admin-health-card" aria-label="System health loading state">
                <div className="admin-health-header">
                    <div className="admin-health-icon-wrap">
                        <Activity size={16} />
                    </div>
                    <h2 className="admin-health-title">System Health</h2>
                </div>
                <p className="admin-health-loading">Loading health metrics...</p>
            </section>
        );
    }

    return (
        <section className="admin-health-card" aria-label="System health status">
            <div className="admin-health-header">
                <div className="admin-health-icon-wrap">
                    <Activity size={16} />
                </div>
                <h2 className="admin-health-title">System Health</h2>
            </div>

            <div className="admin-health-grid">
                <SystemHealthMetric
                    title="Server Status"
                    status={systemHealth.serverStatus.label}
                    tone={systemHealth.serverStatus.tone}
                    widthPercent={systemHealth.serverStatus.widthPercent}
                />

                <SystemHealthMetric
                    title="Database"
                    status={systemHealth.databaseStatus.label}
                    tone={systemHealth.databaseStatus.tone}
                    widthPercent={systemHealth.databaseStatus.widthPercent}
                />

                <SystemHealthMetric
                    title="API Response"
                    status={systemHealth.apiResponse.label}
                    tone={systemHealth.apiResponse.tone}
                    widthPercent={systemHealth.apiResponse.widthPercent}
                />
            </div>
        </section>
    );
};

export default SystemHealth;
