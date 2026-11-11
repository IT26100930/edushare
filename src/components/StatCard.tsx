import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';

interface StatCardProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  sublabel?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  suffix = '+',
  prefix = '',
  label,
  sublabel,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [displayCount, setDisplayCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (shouldReduceMotion) {
      setDisplayCount(value);
      return;
    }

    const duration = 1500; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(ease * value);
      setDisplayCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayCount(value);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, shouldReduceMotion]);

  return (
    <motion.div
      ref={ref}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              transition: { type: 'spring', stiffness: 350, damping: 25 },
            }
      }
      className={`p-6 md:p-8 rounded-[22px] border border-[#E8E2D6] dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xs flex flex-col justify-between transition-colors shadow-xs ${className}`}
    >
      <div>
        <div className="text-3xl md:text-5xl font-semibold tracking-tight text-[#111111] dark:text-neutral-100 font-display tabular-nums">
          {prefix}
          {displayCount}
          {suffix}
        </div>
        <p className="mt-2 text-base font-semibold text-neutral-800 dark:text-neutral-200">
          {label}
        </p>
      </div>
      {sublabel && (
        <p className="mt-2 text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
          {sublabel}
        </p>
      )}
    </motion.div>
  );
};
