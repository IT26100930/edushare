import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Skeleton } from './Skeleton.tsx';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show a small skeleton on each page load for 400ms as requested
    setIsLoading(true);
    window.scrollTo({ top: 0, behavior: 'instant' });

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // A footer/menu link to the page already open should still leave the footer.
  useEffect(()=>{
    if(!location.search&&!location.hash)window.scrollTo({top:0,behavior:shouldReduceMotion?'auto':'smooth'});
  },[location.key,shouldReduceMotion]);

  if (isLoading && !shouldReduceMotion) {
    return (
      <div className="min-h-[60vh] p-6 sm:p-10 space-y-6 max-w-5xl mx-auto">
        {/* Top small header skeleton */}
        <div className="space-y-3">
          <Skeleton variant="pill" className="w-24 h-6" />
          <Skeleton variant="text" className="w-2/3 h-8" />
          <Skeleton variant="text" className="w-1/2 h-4" />
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="rounded-[22px] p-6 bg-neutral-100/70 dark:bg-neutral-800/60 border border-[#E8E2D6] dark:border-neutral-800 space-y-4">
            <Skeleton variant="text" className="w-1/2 h-5" />
            <Skeleton variant="text" className="w-full h-16" />
            <Skeleton variant="pill" className="w-full h-10" />
          </div>
          <div className="rounded-[22px] p-6 bg-neutral-100/70 dark:bg-neutral-800/60 border border-[#E8E2D6] dark:border-neutral-800 space-y-4">
            <Skeleton variant="text" className="w-2/3 h-5" />
            <Skeleton variant="text" className="w-full h-16" />
            <Skeleton variant="pill" className="w-full h-10" />
          </div>
          <div className="rounded-[22px] p-6 bg-neutral-100/70 dark:bg-neutral-800/60 border border-[#E8E2D6] dark:border-neutral-800 space-y-4">
            <Skeleton variant="text" className="w-1/3 h-5" />
            <Skeleton variant="text" className="w-full h-16" />
            <Skeleton variant="pill" className="w-full h-10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key={location.pathname}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};
