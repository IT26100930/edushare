import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';

interface AccordionItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="border border-[#E8E2D6] dark:border-neutral-800 rounded-[20px] bg-white dark:bg-neutral-900 overflow-hidden transition-colors shadow-xs">
      <button
        onClick={onToggle}
        className="w-full text-left p-6 md:p-7 flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4A00] rounded-[20px]"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
        id={`faq-header-${index}`}
      >
        <span className="text-base md:text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 font-display">
          {question}
        </span>
        <motion.span
          animate={shouldReduceMotion ? {} : { rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isOpen
              ? 'bg-[#FF4A00] text-white'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
          }`}
        >
          <Plus className="w-5 h-5 stroke-[2.2]" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${index}`}
            role="region"
            aria-labelledby={`faq-header-${index}`}
            initial={
              shouldReduceMotion
                ? { opacity: 1, height: 'auto' }
                : { opacity: 0, height: 0 }
            }
            animate={{ opacity: 1, height: 'auto' }}
            exit={
              shouldReduceMotion
                ? { opacity: 0, height: 0 }
                : { opacity: 0, height: 0 }
            }
            transition={{
              height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.25, ease: 'easeOut' },
            }}
          >
            <div className="px-6 pb-6 md:px-7 md:pb-7 text-sm md:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800/60 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
