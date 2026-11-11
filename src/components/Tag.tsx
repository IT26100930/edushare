import React from 'react';

interface TagProps {
  children: React.ReactNode;
  variant?: 'peach' | 'amber' | 'orange' | 'outline' | 'navy';
  className?: string;
  icon?: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({
  children,
  variant = 'peach',
  className = '',
  icon,
}) => {
  const variantStyles = {
    peach:
      'bg-[#FDE7E0] text-[#FF4A00] dark:bg-[#34211D] dark:text-[#FFA07A] border border-[#FF4A00]/15 dark:border-[#FF4A00]/30',
    amber:
      'bg-[#FFF5D9] text-[#9A6200] dark:bg-[#322818] dark:text-[#FFD066] border border-[#FFB31F]/30',
    orange:
      'bg-[#FF4A00] text-white',
    outline:
      'bg-transparent text-[#555555] dark:text-neutral-300 border border-[#E8E2D6] dark:border-neutral-700',
    navy:
      'bg-[#263577]/10 text-[#263577] dark:bg-[#263577]/40 dark:text-blue-200 border border-[#263577]/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold tracking-tight whitespace-nowrap shrink-0 ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
