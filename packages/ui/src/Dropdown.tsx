import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { cn } from './utils';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = createContext<DropdownContextType | null>(null);

export interface DropdownProps {
  children: React.ReactNode;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ children, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export interface DropdownTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export const DropdownTrigger: React.FC<DropdownTriggerProps> = ({ children, className }) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownTrigger must be used within a Dropdown');

  return (
    <div
      onClick={() => context.setIsOpen((prev) => !prev)}
      className={cn('cursor-pointer select-none inline-flex items-center', className)}
    >
      {children}
    </div>
  );
};

export interface DropdownContentProps {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  width?: string;
}

export const DropdownContent: React.FC<DropdownContentProps> = ({
  children,
  align = 'right',
  className,
  width = 'w-56',
}) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownContent must be used within a Dropdown');

  if (!context.isOpen) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 origin-top rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg shadow-slate-200/50 ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 focus:outline-none',
        align === 'right' ? 'right-0' : 'left-0',
        width,
        className
      )}
    >
      {children}
    </div>
  );
};

export interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  disabled = false,
  destructive = false,
  icon,
  className,
}) => {
  const context = useContext(DropdownContext);

  const handleClick = () => {
    if (disabled) return;
    if (onClick) onClick();
    if (context) context.setIsOpen(false);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors select-none text-left',
        destructive
          ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent',
        className
      )}
    >
      {icon && <span className="w-4 h-4 text-slate-400 group-hover:text-slate-600">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
    </button>
  );
};

export const DropdownSeparator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('-mx-1.5 my-1.5 h-px bg-slate-100', className)} />
);

export const DropdownLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cn('px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider', className)}>
    {children}
  </div>
);
