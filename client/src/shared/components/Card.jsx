import React from 'react';
import './Card.css';

const Card = ({
    children,
    className = '',
    hover = false,
    onClick,
    ...props
}) => {
    const classNames = [
        'card',
        'glass',
        hover && 'glass-hover',
        onClick && 'card-clickable',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classNames} onClick={onClick} {...props}>
            {children}
        </div>
    );
};

export default Card;
