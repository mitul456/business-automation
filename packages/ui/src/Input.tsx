import React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, inputSize = 'md', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const sizeStyles = {
      sm: 'h-8 px-2.5 text-xs',
      md: 'h-9 px-3.5 text-sm',
      lg: 'h-11 px-4 text-base',
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
              sizeStyles[inputSize],
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 3, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={cn(
            'block w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500',
            error && 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
