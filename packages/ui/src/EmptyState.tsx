import React from 'react';
import { cn } from './utils';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center animate-in fade-in-50',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm ring-8 ring-indigo-50/50">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
          {description}
        </p>
      )}

      {children && <div className="mt-4">{children}</div>}

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex items-center gap-3">
          {secondaryActionLabel && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
