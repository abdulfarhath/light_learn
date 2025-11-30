import React from 'react';
import './StatCard.css';

const StatCard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    color = 'primary',
    loading = false
}) => {
    return (
        <div className={`stat-card glass glass-hover stat-card-${color}`}>
            <div className="stat-card-icon">
                <span>{icon}</span>
            </div>
            <div className="stat-card-content">
                <div className="stat-card-title">{title}</div>
                {loading ? (
                    <div className="stat-card-value">
                        <span className="spinner"></span>
                    </div>
                ) : (
                    <div className="stat-card-value">{value}</div>
                )}
                {trend && trendValue && (
                    <div className={`stat-card-trend trend-${trend}`}>
                        <span className="trend-icon">
                            {trend === 'up' ? '↑' : '↓'}
                        </span>
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
