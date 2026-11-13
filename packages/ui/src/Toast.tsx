import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { cn } from './utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'default' | 'success' | 'destructive' | 'warning' | 'info';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastData[];
  toast: (options: Omit<ToastData, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 4000 }: Omit<ToastData, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastData = { id, title, description, variant, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export const Toaster: React.FC = () => {
  const context = useContext(ToastContext);
  if (!context || context.toasts.length === 0) return null;

  const icons: Record<ToastVariant, React.ReactNode> = {
    default: <Info className="w-5 h-5 text-indigo-600" />,
    info: <Info className="w-5 h-5 text-sky-600" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    destructive: <AlertCircle className="w-5 h-5 text-rose-600" />,
  };

  const borders: Record<ToastVariant, string> = {
    default: 'border-slate-200 bg-white',
    info: 'border-sky-200 bg-sky-50/50',
    success: 'border-emerald-200 bg-emerald-50/50',
    warning: 'border-amber-200 bg-amber-50/50',
    destructive: 'border-rose-200 bg-rose-50/50',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {context.toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl transition-all duration-200 animate-in slide-in-from-bottom-5',
            borders[t.variant || 'default']
          )}
        >
          <div className="flex-shrink-0 mt-0.5">{icons[t.variant || 'default']}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900">{t.title}</h4>
            {t.description && <p className="text-xs text-slate-600 mt-0.5">{t.description}</p>}
          </div>
          <button
            onClick={() => context.dismiss(t.id)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
