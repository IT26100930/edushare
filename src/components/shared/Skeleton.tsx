import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'pill' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantStyles = {
    rectangular: 'rounded-[16px]',
    circular: 'rounded-full',
    pill: 'rounded-full',
    text: 'rounded-md h-4 my-1',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-neutral-200/80 dark:bg-neutral-800/80 ${variantStyles[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};

export const ResourceCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-[22px] p-6 bg-white dark:bg-neutral-900 border border-[#E8E2D6] dark:border-neutral-800 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="pill" className="w-20 h-6" />
        <Skeleton variant="pill" className="w-16 h-6" />
      </div>
      <Skeleton variant="text" className="w-3/4 h-5" />
      <Skeleton variant="text" className="w-full h-4" />
      <Skeleton variant="text" className="w-5/6 h-4" />
      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" className="w-7 h-7" />
          <Skeleton variant="text" className="w-24 h-4" />
        </div>
        <Skeleton variant="pill" className="w-20 h-8" />
      </div>
    </div>
  );
};
