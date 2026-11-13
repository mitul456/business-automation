import React, { createContext, useContext, useEffect, useState } from 'react';
import { cn } from './utils';
import { X } from 'lucide-react';

interface DrawerContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DrawerContext = createContext<DrawerContextType | null>(null);

export interface DrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ open: controlledOpen, onOpenChange, children }) => {
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

  return <DrawerContext.Provider value={{ open, setOpen }}>{children}</DrawerContext.Provider>;
};

export const DrawerTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}> = ({ children, className }) => {
  const context = useContext(DrawerContext);
  if (!context) throw new Error('DrawerTrigger must be used within a Drawer');

  return (
    <div
      onClick={() => context.setOpen(true)}
      className={cn('inline-flex cursor-pointer select-none', className)}
    >
      {children}
    </div>
  );
};

export interface DrawerContentProps {
  children: React.ReactNode;
  position?: 'right' | 'left' | 'bottom';
  className?: string;
  width?: string;
}

export const DrawerContent: React.FC<DrawerContentProps> = ({
  children,
  position = 'right',
  className,
  width = 'w-full sm:max-w-md',
}) => {
  const context = useContext(DrawerContext);
  if (!context) throw new Error('DrawerContent must be used within a Drawer');

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

  const positionStyles = {
    right: 'inset-y-0 right-0 h-full border-l animate-in slide-in-from-right duration-200',
    left: 'inset-y-0 left-0 h-full border-r animate-in slide-in-from-left duration-200',
    bottom: 'inset-x-0 bottom-0 h-auto max-h-[85vh] rounded-t-2xl border-t animate-in slide-in-from-bottom duration-200',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => context.setOpen(false)}
      />

      <div
        className={cn(
          'fixed z-50 flex flex-col bg-white p-6 shadow-2xl border-slate-200 transition-all',
          positionStyles[position],
          position !== 'bottom' && width,
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
  );
};

export const DrawerHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('flex flex-col space-y-1 mb-4 text-left', className)}>{children}</div>;

export const DrawerTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <h2 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h2>;

export const DrawerDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <p className={cn('text-xs text-slate-500', className)}>{children}</p>;

export const DrawerFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('mt-auto pt-4 border-t border-slate-100 flex items-center justify-end gap-2', className)}>
    {children}
  </div>
);

export const DrawerClose: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const context = useContext(DrawerContext);
  return (
    <div onClick={() => context?.setOpen(false)} className={cn('inline-flex', className)}>
      {children}
    </div>
  );
};
