import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { HalfFilledCircle } from '../Marquee.tsx';

interface AuthLayoutProps {
  children: React.ReactNode;
  subtitle?: string;
}

const MODULE_CHIPS = [
  'Java',
  'Python',
  'SQL',
  'Networking',
  'OOP',
  'Cyber Security',
  'AI / ML',
  'Web Dev',
  'Algorithms',
  'Operating Systems',
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="w-full min-h-[82vh] grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#151821] rounded-[8px] overflow-hidden">
      {/* Left Column: White Form Panel (Clean, focused) */}
      <div className="lg:col-span-7 p-6 sm:p-10 md:p-14 flex flex-col justify-between overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto space-y-6">
          {children}
        </div>

        {/* Quiet footer inside form panel */}
        <div className="pt-8 text-center text-xs text-neutral-400 dark:text-neutral-300">
          EduShare Student Network &bull; Protected by Academic Attribution Watermarking
        </div>
      </div>

      {/* Right Column: Full-Height Navy Panel (Hidden on mobile) */}
      <div className="hidden lg:flex lg:col-span-5 bg-[#263577] text-white p-10 flex-col justify-between relative overflow-hidden select-none">
        {/* Glow backdrop circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#FF4A00]/20 blur-3xl pointer-events-none" />

        {/* Top: Low-opacity marquee of module chips */}
        <div className="relative z-10 w-full overflow-hidden opacity-35 py-1">
          <motion.div
            className="flex items-center gap-6 whitespace-nowrap w-max"
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    x: ['0%', '-50%'],
                  }
            }
            transition={{
              repeat: Infinity,
              ease: 'linear',
              duration: 25,
            }}
          >
            {[...MODULE_CHIPS, ...MODULE_CHIPS].map((m, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs font-mono text-blue-200">
                <HalfFilledCircle className="w-3 h-3 text-blue-300" />
                <span>{m}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* The same transparent illustration used by the home-page hero. */}
        <div className="relative z-10 flex flex-1 items-center justify-center py-8 xl:py-10">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[calc(100%+2rem)] max-w-none shrink-0"
          >
            <img
              src="/images/edushare-collaborative-hero.png"
              alt="Five students studying together around an EduShare laptop, sharing books and notes"
              loading="eager"
              decoding="async"
              className="block w-full h-auto object-contain select-none drop-shadow-[0_18px_22px_rgba(0,0,0,0.14)]"
            />
          </motion.div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-[20px] p-6 border border-white/15 space-y-2">
          <div className="text-xs font-bold text-white">Share knowledge with classmates</div>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            Find course notes, publish your own resources, and take part in student discussions.
          </p>
        </div>
      </div>
    </div>
  );
};
