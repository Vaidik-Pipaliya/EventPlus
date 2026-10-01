import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  className = ''
}) => {
  const variantStyles = {
    default: 'bg-app-surface-muted text-app-text-muted border-app-border',
    primary: 'bg-app-primary-soft text-app-primary border-app-primary/20',
    success: 'bg-app-success-soft text-app-success border-app-success/20',
    warning: 'bg-amber-50 text-app-warning border-amber-200',
    danger: 'bg-red-50 text-app-danger border-red-200'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {children}
    </span>
  );
};
