import React from 'react';
import { cn } from './utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
    circular: 'rounded-full',
  };

  return (
    <div
      className={cn('animate-pulse bg-slate-200/80', variantStyles[variant], className)}
      {...props}
    />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn('h-4', i === lines - 1 ? 'w-3/5' : 'w-full')}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('rounded-xl border border-slate-200 p-6 space-y-4 bg-white', className)}>
    <div className="flex items-center space-x-3">
      <Skeleton className="h-10 w-10" variant="circular" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <SkeletonText lines={2} />
    <Skeleton className="h-8 w-full" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className,
}) => (
  <div className={cn('w-full border border-slate-200 rounded-xl overflow-hidden bg-white', className)}>
    <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
      {Array.from({ length: columns }).map((_, idx) => (
        <Skeleton key={idx} className="h-4 flex-1" />
      ))}
    </div>
    <div className="divide-y divide-slate-100 p-4 space-y-4">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4 pt-2">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton key={cIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
