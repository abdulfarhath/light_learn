import React from 'react';

const Card = ({
    children,
    className = '',
    hover = false,
    onClick,
    ...props
}) => {
    const baseClasses = "bg-bg-panel border border-border rounded-2xl p-6 shadow-lg transition-all duration-300";
    const hoverClasses = hover ? "hover:bg-bg-hover hover:border-primary/30 hover:-translate-y-1 hover:shadow-xl" : "";
    const clickableClasses = onClick ? "cursor-pointer" : "";

    return (
        <div
            className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
