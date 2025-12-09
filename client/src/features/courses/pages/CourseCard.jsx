import React from 'react';

const CourseCard = ({ children, className = '', onClick }) => {
    return (
        <div
            className={`bg-bg-panel rounded-xl shadow-sm border border-border ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default CourseCard;
