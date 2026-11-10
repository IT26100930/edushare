import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { Button } from './Button.tsx';

interface BrowseEmptyStateProps {
  onReset: () => void;
}

export const BrowseEmptyState: React.FC<BrowseEmptyStateProps> = ({ onReset }) => {
  return (
    <div className="py-16 px-6 text-center rounded-[24px] bg-neutral-50/70 dark:bg-neutral-900/50 border border-[#E8E2D6] dark:border-neutral-800 space-y-5">
      {/* Friendly Flat Vector SVG Illustration */}
      <div className="w-36 h-36 mx-auto relative select-none">
        <svg viewBox="0 0 160 160" className="w-full h-full" fill="none">
          {/* Peach background disc */}
          <circle cx="80" cy="80" r="64" fill="#FDE7E0" className="dark:fill-[#2B211E]" />

          {/* Book / document base */}
          <rect x="42" y="62" width="60" height="48" rx="8" fill="#FFFFFF" stroke="#E8E2D6" strokeWidth="2" />
          <line x1="52" y1="74" x2="88" y2="74" stroke="#FF4A00" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="52" y1="84" x2="80" y2="84" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          <line x1="52" y1="94" x2="72" y2="94" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

          {/* Magnifying Glass with Orange Accent */}
          <circle cx="95" cy="85" r="24" fill="#FFFFFF" stroke="#FF4A00" strokeWidth="3" />
          <line x1="112" y1="102" x2="128" y2="118" stroke="#FF4A00" strokeWidth="4" strokeLinecap="round" />

          {/* Question / Exclamation particle */}
          <circle cx="95" cy="85" r="6" fill="#FFB31F" />
        </svg>
      </div>

      <div className="max-w-md mx-auto space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold font-display text-neutral-900 dark:text-neutral-100">
          No study resources match your filters
        </h3>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          We couldn&apos;t find any notes matching the exact combination of category, module code, and price filters.
        </p>
      </div>

      <div className="pt-2">
        <Button variant="primary" size="md" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          <span>Clear All Filters</span>
        </Button>
      </div>
    </div>
  );
};
