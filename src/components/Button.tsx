import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'white' | 'outline' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showArrow?: boolean;
  children: React.ReactNode;
  className?: string;
  href?: string;
  to?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  showArrow = false,
  children,
  className = '',
  href,
  to,
  onClick,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-full cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 whitespace-nowrap shrink-0 group select-none';

  const sizeClasses = {
    sm: 'text-xs px-4 py-2 gap-1.5',
    md: 'text-sm px-6 py-3 gap-2',
    lg: 'text-base px-8 py-4 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#FF4A00] text-white hover:bg-[#e04100] active:bg-[#c93a00] focus-visible:ring-[#FF4A00] shadow-sm',
    secondary:
      'bg-transparent text-[#111111] dark:text-neutral-100 border border-[#111111]/25 dark:border-white/30 hover:border-[#111111] dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 focus-visible:ring-neutral-400',
    white:
      'bg-white text-[#111111] hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-white shadow-sm',
    outline:
      'bg-transparent text-white border border-white/40 hover:border-white hover:bg-white/10 focus-visible:ring-white',
    dark:
      'bg-[#111111] text-white hover:bg-[#222222] active:bg-black focus-visible:ring-neutral-800 shadow-sm',
  };

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  const content = (
    <>
      <span>{children}</span>
      {showArrow && (
        <span className="transition-transform duration-200 ease-out group-hover:translate-x-1 inline-flex items-center">
          <ArrowRight className="w-4 h-4 stroke-[2.2]" />
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClasses} onClick={onClick as any}>
        <motion.span
          className="inline-flex items-center justify-center w-full gap-2"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {content}
        </motion.span>
      </Link>
    );
  }

  if (href) {
    return (
      <motion.a
        href={href}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={combinedClasses}
        onClick={onClick as any}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={combinedClasses}
      onClick={onClick}
      {...(props as any)}
    >
      {content}
    </motion.button>
  );
};
