import React from 'react';
import { Sparkles, Check, DollarSign } from 'lucide-react';

interface BadgeProps {
  type: 'Free' | 'Premium' | 'Paid';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ type, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  };

  const badgeStyles = {
    Free: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    Premium: 'bg-[#FF4A00] text-white shadow-xs font-semibold',
    Paid: 'bg-[#1E6FEB] text-white shadow-xs font-semibold',
  };

  const icons = {
    Free: <Check className="w-3 h-3 stroke-[2.5]" />,
    Premium: <Sparkles className="w-3 h-3 fill-white stroke-none" />,
    Paid: <DollarSign className="w-3 h-3 stroke-[2.5]" />,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium tracking-tight whitespace-nowrap select-none shrink-0 ${sizeClasses[size]} ${badgeStyles[type]} ${className}`}
    >
      {icons[type]}
      <span>{type}</span>
    </span>
  );
};
