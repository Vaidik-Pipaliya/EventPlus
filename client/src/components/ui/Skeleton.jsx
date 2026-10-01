import React from 'react';

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-app-surface-muted rounded-input ${className}`}
      {...props}
    />
  );
};
