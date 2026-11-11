import React, { forwardRef } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string | boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(2, 7)}`;

    let statusBorder = 'border-neutral-300 dark:border-neutral-700 focus:border-[#FF4A00] focus:ring-2 focus:ring-[#FF4A00]/20';
    if (error) {
      statusBorder = 'border-rose-500 text-rose-900 dark:text-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20';
    } else if (success) {
      statusBorder = 'border-emerald-500 text-neutral-900 dark:text-neutral-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
    }

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 pointer-events-none text-neutral-400 dark:text-neutral-300">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full py-3 rounded-full text-sm font-medium bg-neutral-50/80 dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none transition-all duration-200 ${
              leftIcon ? 'pl-11' : 'pl-5'
            } ${rightIcon || error || success ? 'pr-11' : 'pr-5'} border ${statusBorder} ${className}`}
            aria-invalid={!!error}
            {...props}
          />

          <div className="absolute right-4 flex items-center gap-1.5 pointer-events-none">
            {error ? (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              rightIcon
            )}
          </div>
        </div>

        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium pl-2">
            {error}
          </p>
        ) : typeof success === 'string' ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium pl-2">
            {success}
          </p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 pl-2">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
