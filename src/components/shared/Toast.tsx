import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#1E6FEB] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  };

  const borderMap = {
    success: 'border-emerald-500/30',
    info: 'border-blue-500/30',
    warning: 'border-amber-500/30',
    error: 'border-rose-500/30',
  };

  return (
    <div
      aria-live="polite"
      aria-label="EduShare notifications"
      className="fixed bottom-4 right-0 sm:right-4 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const type = toast.type || 'info';
          return (
            <motion.div
              key={toast.id}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 16, scale: 0.94 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: 10, scale: 0.94 }
              }
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={`pointer-events-auto p-4 rounded-[18px] bg-white/95 dark:bg-[#1A1D27]/95 backdrop-blur-md shadow-xl border ${borderMap[type]} flex items-start justify-between gap-3`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{iconMap[type]}</div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 font-display leading-snug">
                    {toast.title}
                  </h4>
                  {toast.message && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                      {toast.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-neutral-300"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
