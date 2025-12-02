import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    icon,
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    ...props
}) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-offset-bg-dark";

    const variants = {
        primary: "bg-primary hover:bg-primary-dark text-white focus:ring-primary shadow-lg shadow-primary/20",
        secondary: "bg-bg-panel border border-border text-text-main hover:bg-bg-hover focus:ring-gray-500",
        ghost: "bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-main",
        danger: "bg-danger hover:bg-danger-dark text-white focus:ring-danger shadow-lg shadow-danger/20",
        success: "bg-success hover:bg-success-dark text-white focus:ring-success shadow-lg shadow-success/20",
        warning: "bg-warning hover:bg-warning-dark text-white focus:ring-warning shadow-lg shadow-warning/20",
    };

    const sizes = {
        small: "px-3 py-1.5 text-sm",
        medium: "px-4 py-2 text-base",
        large: "px-6 py-3 text-lg",
    };

    return (
        <button
            type={type}
            className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.medium} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
            )}
            {icon && !loading && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
