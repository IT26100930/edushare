import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  max?: number;
  showValue?: boolean;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (val: number) => void;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  showValue = true,
  reviewCount,
  size = 'md',
  interactive = false,
  onChange,
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, index) => {
          const starNumber = index + 1;
          const isFilled = activeValue >= starNumber;
          const isHalf = activeValue >= starNumber - 0.5 && activeValue < starNumber;

          return (
            <button
              key={index}
              type="button"
              aria-label={`Rate ${starNumber} ${starNumber === 1 ? 'star' : 'stars'}`}
              aria-pressed={interactive ? value === starNumber : undefined}
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starNumber)}
              onMouseEnter={() => interactive && setHoverValue(starNumber)}
              onMouseLeave={() => interactive && setHoverValue(null)}
              className={`${
                interactive
                  ? 'cursor-pointer hover:scale-110 transition-transform'
                  : 'cursor-default'
              } p-0.5 focus:outline-none`}
            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isHalf
                    ? 'text-amber-400 fill-amber-400/50'
                    : 'text-neutral-300 dark:text-neutral-600'
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-xs sm:text-sm font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">
          {value.toFixed(1)}
        </span>
      )}

      {reviewCount !== undefined && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          ({reviewCount})
        </span>
      )}
    </div>
  );
};
