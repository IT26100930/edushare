import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  Heart,
  Download,
  Star,
  FileText,
  Code,
  Database,
  Shield,
  Cpu,
  Globe,
  Layers,
} from 'lucide-react';
import { Resource } from '../data/models.ts';
import { Avatar } from './shared/Avatar.tsx';
import { Badge } from './shared/Badge.tsx';

interface ResourceCardProps {
  resource: Resource;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

// Category-to-color mapping following design tokens:
// Amber #FFB31F, Blue #1E6FEB, Orange #FF4A00, Navy #263577
const getCategoryTheme = (category: string) => {
  switch (category) {
    case 'Java':
    case 'Python':
    case 'OOP':
      return {
        bg: 'bg-[#FF4A00]',
        text: 'text-white',
        border: 'border-[#FF4A00]/30',
        badgeBg: 'bg-white/20 text-white',
        icon: Code,
        pattern: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)',
      };
    case 'SQL':
      return {
        bg: 'bg-[#FFB31F]',
        text: 'text-neutral-950',
        border: 'border-amber-400/40',
        badgeBg: 'bg-black/15 text-neutral-950',
        icon: Database,
        pattern: 'radial-gradient(circle at 80% 20%, rgba(0,0,0,0.12) 0%, transparent 50%)',
      };
    case 'Networking':
      return {
        bg: 'bg-[#1E6FEB]',
        text: 'text-white',
        border: 'border-blue-400/30',
        badgeBg: 'bg-white/20 text-white',
        icon: Layers,
        pattern: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.22) 0%, transparent 55%)',
      };
    case 'Cyber Security':
      return {
        bg: 'bg-[#263577]',
        text: 'text-white',
        border: 'border-indigo-400/30',
        badgeBg: 'bg-white/20 text-white',
        icon: Shield,
        pattern: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.18) 0%, transparent 60%)',
      };
    case 'AI/ML':
      return {
        bg: 'bg-[#FFB31F]',
        text: 'text-neutral-950',
        border: 'border-amber-400/40',
        badgeBg: 'bg-black/15 text-neutral-950',
        icon: Cpu,
        pattern: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, transparent 60%)',
      };
    case 'Web Dev':
    default:
      return {
        bg: 'bg-[#1E6FEB]',
        text: 'text-white',
        border: 'border-blue-400/30',
        badgeBg: 'bg-white/20 text-white',
        icon: Globe,
        pattern: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
      };
  }
};

// Distinct illustration for resource formats; other resources use their subject cover.
const getResourceCover = (resource: Resource): string => {
  const type = `${resource.type || ''} ${resource.fileFormat || ''}`.toLowerCase();
  const category = (resource.category || '').toLowerCase();
  const base = '/images/category-presets/';

  if (type.includes('video') || type.includes('youtube')) return base + 'video-lessons.svg';
  if (type.includes('past paper') || type.includes('pastpaper')) return base + 'past-papers.svg';
  if (type.includes('pdf') || type.includes('lecture') || type.includes('note') || type.includes('ebook')) return base + 'pdf-notes.svg';
  if (category.includes('cyber') || category.includes('security')) return base + 'cybersecurity.svg';
  if (category.includes('network')) return base + 'networking.svg';
  if (category.includes('database') || category.includes('sql')) return base + 'databases.svg';
  if (category.includes('ai') || category.includes('machine learn')) return base + 'ai-ml.svg';
  if (category.includes('math')) return base + 'mathematics.svg';
  return base + 'programming.svg';
};

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  isBookmarked,
  onToggleBookmark,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const theme = getCategoryTheme(resource.category);
  const Icon = theme.icon;
  const username = resource.author.username ? `@${resource.author.username}` : 'Uploader';

  return (
    <motion.div
      layout
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -6,
              boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.1)',
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }
      }
      className="group rounded-[22px] bg-white dark:bg-neutral-900 border border-[#E8E2D6] dark:border-neutral-800 overflow-hidden flex flex-col justify-between shadow-xs transition-shadow duration-300"
    >
      <div>
        {/* Cover Image / Color Block with zoom on card hover */}
        <div className="relative h-44 overflow-hidden select-none">
          <div
            className={`w-full h-full ${theme.bg} ${theme.text} p-5 flex flex-col justify-between transition-transform duration-500 ease-out group-hover:scale-105`}
            style={{ backgroundImage: theme.pattern }}
          >
            {/* Context-specific cover illustration, separate for videos and PDF notes. */}
            <img
              src={getResourceCover(resource)}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
            />
            {/* Top Row: Type chip & Module watermark */}
            <div className="relative z-10 flex items-center justify-between pr-12 gap-3">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-xs ${theme.badgeBg}`}
              >
                {resource.type}
              </span>

              <span className="font-mono text-xs font-black tracking-wider opacity-70 text-right whitespace-nowrap max-w-[7rem] truncate" title={resource.moduleCode}>
                {resource.moduleCode}
              </span>
            </div>

            {/* Middle decorative icon illustration */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80 block">
                  {resource.category}
                </span>
                <span className="text-xl font-black font-display tracking-tight block drop-shadow-xs">
                  {resource.academicYear} &bull; {resource.semester}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner group-hover:rotate-6 transition-transform duration-300">
                <Icon className="w-6 h-6 stroke-[2.2]" />
              </div>
            </div>

            {/* Bottom specs line */}
            <div className="relative z-10 flex items-center justify-between text-[11px] opacity-85 font-mono">
              <span>{resource.pages} Pages</span>
              <span>{resource.fileFormat} &bull; {resource.fileSize}</span>
            </div>
          </div>

          {/* Floating Bookmark Heart with Pop Animation */}
          <motion.button
            whileTap={{ scale: 1.4 }}
            animate={
              shouldReduceMotion
                ? undefined
                : isBookmarked
                ? { scale: [1, 1.35, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBookmark(resource.id);
            }}
            className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-md cursor-pointer transition-colors z-20 ${
              isBookmarked
                ? 'bg-white text-[#FF4A00] dark:bg-neutral-900'
                : 'bg-black/30 hover:bg-black/50 text-white'
            }`}
            aria-label={isBookmarked ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isBookmarked ? 'fill-[#FF4A00] stroke-[#FF4A00]' : 'stroke-white'
              }`}
            />
          </motion.button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-3">
          {/* Title */}
          <Link
            to={`/resource/${resource.id}`}
            className="block group-hover:text-[#FF4A00] transition-colors"
          >
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-display leading-snug line-clamp-2">
              {resource.title}
            </h3>
          </Link>

          {/* Description snippet */}
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
            {resource.description}
          </p>

          {/* Uploader Avatar + @username */}
          <Link
            to={resource.author.username ? `/u/${encodeURIComponent(resource.author.username)}` : '/browse'}
            className="flex items-center gap-2.5 pt-1 hover:opacity-80 transition-opacity cursor-pointer group/author"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar
              src={resource.author.avatar}
              name={resource.author.name}
              isVerified={resource.author.isVerified}
              size="sm"
            />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block truncate group-hover/author:text-[#FF4A00] transition-colors">
                {resource.author.name}
              </span>
              <span className="text-[11px] font-mono text-neutral-400 block truncate dark:text-neutral-300">
                {username}
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer bar: Rating stars, downloads, price tag / badge */}
      <div className="px-5 py-3.5 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-800/20 flex items-center justify-between text-xs">
        {/* Rating & Downloads */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-bold text-neutral-800 dark:text-neutral-200">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="tabular-nums">{resource.rating.toFixed(1)}</span>
          </div>
          <span className="text-neutral-300 dark:text-neutral-700">&bull;</span>
          <div className="flex items-center gap-1 text-neutral-500 font-medium dark:text-neutral-300">
            <Download className="w-3 h-3 text-neutral-400 dark:text-neutral-300" />
            <span className="tabular-nums">{resource.downloads}</span>
          </div>
        </div>

        {/* Price Tag or Free / Premium Badge */}
        <div>
          {resource.priceType === 'Free' ? (
            <Badge type="Free" size="sm" />
          ) : resource.priceType === 'Premium' ? (
            <Badge type="Premium" size="sm" />
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-mono font-bold text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
              Rs. {resource.price}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
