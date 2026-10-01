import React from 'react';
import { CalendarX } from 'lucide-react';
import { Button } from './Button.jsx';

export const EmptyState = ({
  icon: Icon = CalendarX,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-app-surface border border-app-border rounded-card">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-app-surface-muted text-app-text-muted mb-3">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-semibold text-app-text mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-app-text-muted max-w-sm mb-4">{description}</p>
      )}
      {actionText && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
