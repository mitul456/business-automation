import React from 'react';
import { cn } from './utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'destructive'
    | 'danger'
    | 'ghost'
    | 'link'
    | 'success';
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants: Record<string, string> = {
      default:
        'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-100 active:scale-[0.99]',
      primary:
        'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm shadow-indigo-100 active:scale-[0.99]',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 active:scale-[0.99]',
      outline:
        'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:ring-indigo-500 active:scale-[0.99]',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm shadow-rose-100 active:scale-[0.99]',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm shadow-rose-100 active:scale-[0.99]',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300',
      link:
        'bg-transparent text-indigo-600 underline-offset-4 hover:underline p-0 h-auto focus:ring-0',
      success:
        'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm shadow-emerald-100 active:scale-[0.99]',
    };

    const sizes: Record<string, string> = {
      default: 'text-sm h-9 px-4 py-2 gap-2',
      md: 'text-sm h-9 px-4 py-2 gap-2',
      sm: 'text-xs h-8 px-2.5 py-1.5 gap-1.5',
      lg: 'text-base h-11 px-6 py-2.5 gap-2.5',
      icon: 'h-9 w-9 p-0 justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';
