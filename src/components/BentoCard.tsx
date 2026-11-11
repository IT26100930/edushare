import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface BentoCardProps {
  variant: 'amber' | 'blue' | 'orange' | 'navy';
  title: string;
  description: string;
  icon: React.ReactNode;
  colSpan?: string;
  children?: React.ReactNode;
  className?: string;
  badge?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  variant,
  title,
  description,
  icon,
  colSpan = 'col-span-1',
  children,
  className = '',
  badge,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const variantStyles = {
    amber: {
      card: 'bg-[#FFB31F] text-[#1A1608]',
      iconWrap: 'bg-black/10 text-neutral-900',
      desc: 'text-neutral-800/85',
      badge: 'bg-black/15 text-neutral-900',
    },
    blue: {
      card: 'bg-[#1E6FEB] text-white',
      iconWrap: 'bg-white/20 text-white',
      desc: 'text-blue-100/90',
      badge: 'bg-white/20 text-white',
    },
    orange: {
      card: 'bg-[#FF4A00] text-white',
      iconWrap: 'bg-white/20 text-white',
      desc: 'text-orange-100/90',
      badge: 'bg-white/20 text-white',
    },
    navy: {
      card: 'bg-[#263577] text-white',
      iconWrap: 'bg-white/15 text-white',
      desc: 'text-slate-200/90',
      badge: 'bg-white/15 text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <motion.div
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -6,
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.15)',
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }
      }
      className={`relative overflow-hidden rounded-[24px] p-7 md:p-8 flex flex-col justify-between transition-shadow ${style.card} ${colSpan} ${className}`}
    >
      {/* Top Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xs transition-transform duration-300 group-hover:scale-105 ${style.iconWrap}`}
          >
            {icon}
          </div>
          {badge && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${style.badge}`}
            >
              {badge}
            </span>
          )}
        </div>

        <h3 className="text-[22px] md:text-[24px] font-semibold tracking-tight leading-snug mb-2 font-display">
          {title}
        </h3>
        <p className={`text-[14px] md:text-[15px] leading-relaxed max-w-md ${style.desc}`}>
          {description}
        </p>
      </div>

      {/* Optional Child Graphic / Slot */}
      {children && <div className="mt-6 relative z-10">{children}</div>}
    </motion.div>
  );
};
