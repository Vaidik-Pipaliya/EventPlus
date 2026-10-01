import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const base = "inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-input focus:outline-none focus:ring-2 focus:ring-app-primary/30 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base"
  };

  const variantClasses = {
    primary: "bg-app-primary text-white hover:bg-app-primary-hover active:bg-app-primary-hover border border-transparent shadow-none",
    secondary: "bg-app-surface text-app-text hover:bg-app-surface-muted active:bg-app-surface-muted border border-app-border",
    outline: "bg-transparent text-app-primary hover:bg-app-primary-soft border border-app-primary",
    ghost: "bg-transparent text-app-text hover:bg-app-surface-muted border border-transparent",
    danger: "bg-app-danger text-white hover:bg-red-700 active:bg-red-800 border border-transparent",
    success: "bg-app-success-soft text-app-success border border-app-success/20 hover:bg-app-success-soft"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
