import React, { createContext, useContext, useEffect, useState } from 'react';
import { cn } from './utils';
import { X } from 'lucide-react';

interface DialogContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ open: controlledOpen, onOpenChange, children }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (value: React.SetStateAction<boolean>) => {
    const nextValue = typeof value === 'function' ? value(open) : value;
    if (!isControlled) {
      setUncontrolledOpen(nextValue);
    }
    if (onOpenChange) {
      onOpenChange(nextValue);
    }
  };

  return <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>;
};

export const DialogTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}> = ({ children, className }) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogTrigger must be used within a Dialog');

  return (
    <div
      onClick={() => context.setOpen(true)}
      className={cn('inline-flex cursor-pointer select-none', className)}
    >
      {children}
    </div>
  );
};

export interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const DialogContent: React.FC<DialogContentProps> = ({
  children,
  className,
  maxWidth = 'md',
}) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('DialogContent must be used within a Dialog');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') context.setOpen(false);
    };
    if (context.open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [context.open, context]);

  if (!context.open) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={() => context.setOpen(false)}
        />

        {/* Modal Dialog */}
        <div
          className={cn(
            'relative w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-2xl transition-all border border-slate-100 animate-in zoom-in-95 duration-150',
            maxWidths[maxWidth],
            className
          )}
        >
          <button
            onClick={() => context.setOpen(false)}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('flex flex-col space-y-1.5 text-left mb-4', className)}>{children}</div>;

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <h2 className={cn('text-lg font-semibold text-slate-900 leading-none tracking-tight', className)}>{children}</h2>;

export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <p className={cn('text-xs text-slate-500 mt-1', className)}>{children}</p>;

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t border-slate-100', className)}>
    {children}
  </div>
);

export const DialogClose: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const context = useContext(DialogContext);
  return (
    <div onClick={() => context?.setOpen(false)} className={cn('inline-flex', className)}>
      {children}
    </div>
  );
};
