import React from 'react';

const StatCard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    color = 'primary',
    loading = false
}) => {
    const colorStyles = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        success: 'bg-success/10 text-success border-success/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
        danger: 'bg-danger/10 text-danger border-danger/20',
    };

    const iconStyles = {
        primary: 'bg-primary/20 text-primary',
        success: 'bg-success/20 text-success',
        warning: 'bg-warning/20 text-warning',
        danger: 'bg-danger/20 text-danger',
    };

    return (
        <div className={`bg-bg-panel border border-border rounded-2xl p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl group`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-text-muted text-sm font-medium mb-1">{title}</p>
                    {loading ? (
                        <div className="h-8 w-24 bg-bg-hover animate-pulse rounded"></div>
                    ) : (
                        <h3 className="text-2xl font-bold text-text-main">{value}</h3>
                    )}

                    {trend && trendValue && (
                        <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                            <span>{trend === 'up' ? '↑' : '↓'}</span>
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${iconStyles[color] || iconStyles.primary}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
