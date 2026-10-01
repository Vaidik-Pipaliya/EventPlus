import React from 'react';

export const Input = ({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-app-text-muted mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`w-full h-10 px-3 text-sm bg-app-surface border ${
          error ? 'border-app-danger' : 'border-app-border'
        } rounded-input text-app-text placeholder:text-app-text-muted/60 transition-colors focus:outline-none focus:border-app-primary focus:ring-2 focus:ring-app-primary/30 disabled:bg-app-surface-muted disabled:cursor-not-allowed ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[12.5px] text-app-danger">{error}</p>
      )}
    </div>
  );
};
