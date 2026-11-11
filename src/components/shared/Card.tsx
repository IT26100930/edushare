import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  variant?: 'white' | 'cream' | 'peach' | 'amber' | 'blue' | 'navy' | 'dark';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = true,
  variant = 'white',
  onClick,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variantStyles = {
    white:
      'bg-white dark:bg-neutral-900 border border-[#E8E2D6] dark:border-neutral-800 text-neutral-900 dark:text-neutral-100',
    cream:
      'bg-[#FFFDF9] dark:bg-neutral-900/90 border border-[#E8E2D6] dark:border-neutral-800 text-neutral-900 dark:text-neutral-100',
    peach:
      'bg-[#FDE7E0] dark:bg-[#271E1C] border border-[#FF4A00]/20 dark:border-[#FF4A00]/30 text-neutral-900 dark:text-neutral-100',
    amber:
      'bg-[#FFB31F] text-[#1A1608] border border-amber-500/20',
    blue:
      'bg-[#1E6FEB] text-white border border-blue-400/20',
    navy:
      'bg-[#263577] text-white border border-indigo-900/40',
    dark:
      'bg-[#111111] dark:bg-neutral-950 text-white border border-neutral-800',
  };

  return (
    <motion.div
      whileHover={
        hoverable && !shouldReduceMotion
          ? {
              y: -6,
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.08)',
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }
          : undefined
      }
      onClick={onClick}
      className={`rounded-[22px] p-6 md:p-7 transition-colors relative overflow-hidden ${
        variantStyles[variant]
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
};
