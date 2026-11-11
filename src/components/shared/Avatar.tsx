import React from 'react';
import { Check } from 'lucide-react';

interface AvatarProps {
  src?: string;
  name: string;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  isVerified = false,
  size = 'md',
  className = '',
}) => {
  const [imageError, setImageError] = React.useState(false);
  React.useEffect(()=>setImageError(false),[src]);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const badgeSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className={`relative inline-block shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-[#FDE7E0] dark:bg-[#2A1F1D] text-[#FF4A00] font-bold flex items-center justify-center border border-black/5 dark:border-white/10`}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {isVerified && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${badgeSizeClasses[size]} rounded-full bg-[#1E6FEB] text-white flex items-center justify-center shadow-xs ring-1 ring-white dark:ring-neutral-900`}
          title="Verified University Student"
        >
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </span>
      )}
    </div>
  );
};
