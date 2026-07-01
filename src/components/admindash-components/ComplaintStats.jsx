import { MessageCircle, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

const ComplaintStats = ({ stats }) => {
    const statCards = [
        {
            label: 'Total Complaints',
            value: stats.total,
            icon: MessageCircle,
            iconWrapClass: 'complaints-stat-icon-wrap complaints-stat-icon-total',
        },
        {
            label: 'Open',
            value: stats.open,
            icon: AlertCircle,
            iconWrapClass: 'complaints-stat-icon-wrap complaints-stat-icon-open',
        },
        {
            label: 'In Progress',
            value: stats.inProgress,
            icon: Clock,
            iconWrapClass: 'complaints-stat-icon-wrap complaints-stat-icon-progress',
        },
        {
            label: 'Resolved',
            value: stats.resolved,
            icon: CheckCircle2,
            iconWrapClass: 'complaints-stat-icon-wrap complaints-stat-icon-resolved',
        },
    ];

    return (
        <div className="complaints-stats-grid">
            {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <article key={index} className="complaints-stat-card">
                        <div className="complaints-stat-main">
                            <div className={card.iconWrapClass}>
                                <Icon size={18} aria-hidden="true" />
                            </div>
                            <div className="complaints-stat-copy">
                                <p className="complaints-stat-value">{card.value}</p>
                                <p className="complaints-stat-label">{card.label}</p>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
};

export default ComplaintStats;
