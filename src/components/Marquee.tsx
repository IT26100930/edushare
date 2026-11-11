import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ModuleItem {
  name: string;
}

const MODULES: ModuleItem[] = [
  { name: 'Java' },
  { name: 'Python' },
  { name: 'SQL' },
  { name: 'Networking' },
  { name: 'OOP' },
  { name: 'Cyber Security' },
  { name: 'AI / ML' },
  { name: 'Web Dev' },
];

export const HalfFilledCircle: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    className={`${className} shrink-0`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3 A9 9 0 0 1 12 21 Z" fill="currentColor" />
  </svg>
);

export const Marquee: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Repeating array to ensure seamless infinite scroll
  const items = [...MODULES, ...MODULES, ...MODULES, ...MODULES];

  return (
    <div
      className="relative w-full overflow-hidden py-6 border-y border-[#E8E2D6] dark:border-neutral-800/80 my-8"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Supported academic modules marquee"
    >
      <motion.div
        className="flex items-center gap-10 whitespace-nowrap w-max select-none"
        animate={
          shouldReduceMotion
            ? { x: 0 }
            : {
                x: isPaused ? undefined : ['0%', '-50%'],
              }
        }
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 30,
        }}
      >
        {items.map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="flex items-center gap-3 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-200 cursor-default"
          >
            <HalfFilledCircle className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
            <span className="text-base md:text-lg font-medium tracking-tight font-sans">
              {item.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
