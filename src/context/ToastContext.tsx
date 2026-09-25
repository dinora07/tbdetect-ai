import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Keep up to 5 visible

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => showToast('success', message, title), [showToast]);
  const error = useCallback((message: string, title?: string) => showToast('error', message, title, 5000), [showToast]);
  const info = useCallback((message: string, title?: string) => showToast('info', message, title), [showToast]);
  const warning = useCallback((message: string, title?: string) => showToast('warning', message, title), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, info, warning, removeToast }}>
      {children}
      {/* Floating Toast Container */}
      <div
        id="tbdetect-toast-container"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none p-2 sm:p-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in-up ${
                isSuccess
                  ? 'bg-white/95 border-emerald-300/80 text-slate-800 ring-1 ring-emerald-500/10'
                  : isError
                  ? 'bg-white/95 border-rose-300/80 text-slate-800 ring-1 ring-rose-500/10'
                  : isWarning
                  ? 'bg-white/95 border-amber-300/80 text-slate-800 ring-1 ring-amber-500/10'
                  : 'bg-white/95 border-blue-300/80 text-slate-800 ring-1 ring-blue-500/10'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-600'
                    : isError
                    ? 'bg-rose-50 text-rose-600'
                    : isWarning
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isError && <AlertCircle className="w-5 h-5" />}
                {isWarning && <AlertTriangle className="w-5 h-5" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <p className="text-xs font-bold text-slate-900 tracking-tight leading-snug">
                    {toast.title}
                  </p>
                )}
                <p className={`text-xs leading-relaxed text-slate-600 ${toast.title ? 'mt-0.5' : ''}`}>
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
