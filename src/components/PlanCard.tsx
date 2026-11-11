import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, X, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from './Button.tsx';
import {
  PlanConfig,
  BillingCycle,
  getDisplayPlanPrice,
  STUDENT_DISCOUNT,
} from '../data/plansConfig.ts';

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanCardProps {
  plan?: PlanConfig;
  name?: string;
  badge?: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  isYearly?: boolean;
  billingCycle?: BillingCycle;
  features?: PlanFeature[] | string[];
  isPopular?: boolean;
  isRecommended?: boolean;
  isStudentVerified?: boolean;
  ctaText?: string;
  subCtaText?: string;
  onSelect?: () => void;
  className?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  name = plan?.name || 'Free',
  badge = plan?.badge,
  description = plan?.description || '',
  billingCycle = 'semester',
  features = plan?.features || [],
  isPopular = plan?.isPopular ?? false,
  isRecommended = false,
  isStudentVerified = false,
  ctaText,
  subCtaText = plan?.subCtaText,
  onSelect,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Price calculations from single source config
  let currentPrice = 0;
  let perMonthAmount = 0;
  let originalPrice: number | undefined;
  let periodLabel = '/ semester (5 mo)';
  let isDiscounted = false;

  if (plan) {
    const display = getDisplayPlanPrice(plan, billingCycle, isStudentVerified);
    currentPrice = display.amount;
    perMonthAmount = display.perMonthAmount;
    originalPrice = display.originalAmount;
    periodLabel = display.periodLabel;
    isDiscounted = display.isDiscounted;
  }

  // Button text
  const primaryButtonText =
    ctaText ||
    (plan?.id === 'premium'
      ? 'Choose Demo Premium'
      : plan?.ctaText || 'Get Started');

  // Subtext under CTA
  const underButtonNote =
    subCtaText || (plan?.id === 'premium' ? 'Cancel anytime' : plan?.subCtaText);

  // Normalize features
  const normalizedFeatures: PlanFeature[] = features.map((f) => {
    if (typeof f === 'string') {
      return { text: f, included: true };
    }
    return f;
  });

  return (
    <motion.div
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -8,
              boxShadow: isPopular
                ? '0 25px 35px -10px rgba(255, 74, 0, 0.35)'
                : '0 20px 30px -10px rgba(0, 0, 0, 0.08)',
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }
      }
      className={`relative rounded-[24px] p-7 md:p-8 flex flex-col justify-between transition-all duration-300 ${
        isPopular
          ? 'bg-[#FF4A00] text-white shadow-xl ring-2 ring-[#FF4A00]'
          : 'bg-white dark:bg-neutral-900 border border-[#E8E2D6] dark:border-neutral-800 text-neutral-900 dark:text-neutral-100'
      } ${
        isRecommended
          ? 'ring-4 ring-amber-400 shadow-[0_0_35px_rgba(255,179,31,0.45)]'
          : ''
      } ${className}`}
    >
      {/* Top Floating Badges */}
      <div className="absolute -top-3.5 right-6 flex items-center gap-2">
        {/* Recommended from Quiz badge */}
        {isRecommended && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-400 text-neutral-950 shadow-md">
            <Sparkles className="w-3 h-3" />
            <span>Recommended</span>
          </span>
        )}

        {/* Plan badge (e.g. Best Value) */}
        {badge && !isRecommended && (
          <span
            className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isPopular
                ? 'bg-white text-[#FF4A00] shadow-sm'
                : 'bg-[#FF4A00] text-white shadow-sm'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight font-display">
              {name}
            </h3>

            {/* Student Verified Badge on Premium */}
            {plan?.id === 'premium' && isStudentVerified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-100 border border-emerald-400/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{STUDENT_DISCOUNT.badgeText}</span>
              </span>
            )}
          </div>

          <p
            className={`text-sm mt-1 leading-relaxed ${
              isPopular ? 'text-orange-100' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {description}
          </p>
        </div>

        {/* Price tag with animated figure */}
        <div className="my-6 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="flex items-baseline gap-1.5 font-display">
            <span className="text-sm font-semibold tracking-wide">Rs.</span>

            {/* Strike-through original price if discounted */}
            {isDiscounted && originalPrice && (
              <span
                className={`text-2xl font-bold line-through opacity-70 ${
                  isPopular ? 'text-orange-200' : 'text-neutral-400'
                }`}
              >
                {originalPrice.toLocaleString()}
              </span>
            )}

            <motion.span
              key={`${currentPrice}-${billingCycle}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight tabular-nums"
            >
              {currentPrice.toLocaleString()}
            </motion.span>

            <span
              className={`text-xs sm:text-sm font-medium ${
                isPopular ? 'text-orange-100' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {periodLabel}
            </span>
          </div>

          {/* Under price: Per-month equivalent & savings badge */}
          <div className="mt-2 space-y-1">
            {plan?.id === 'premium' && (
              <div className="flex items-center gap-2">
                {billingCycle === 'semester' && (
                  <span
                    className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isPopular
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    Save 20%
                  </span>
                )}
                {billingCycle === 'yearly' && (
                  <span
                    className={`inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isPopular
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    Save 37%
                  </span>
                )}
                <span
                  className={`text-xs font-semibold ${
                    isPopular ? 'text-orange-100' : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {billingCycle === 'monthly'
                    ? isStudentVerified
                      ? 'Student rate: Rs. 159 / month'
                      : 'Billed monthly'
                    : `≈ Rs. ${perMonthAmount.toLocaleString()} / month`}
                </span>
              </div>
            )}

            {plan?.id === 'batch' && (
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold ${
                    isPopular ? 'text-white' : 'text-[#FF4A00]'
                  }`}
                >
                  {plan.memberPriceNote || '≈ Rs. 50 per member'}
                </span>
                <span
                  className={`text-[11px] ${
                    isPopular ? 'text-orange-200' : 'text-neutral-400'
                  }`}
                >
                  (up to 30 students)
                </span>
              </div>
            )}

            {plan?.id === 'free' && (
              <span
                className={`text-xs font-medium ${
                  isPopular ? 'text-orange-100' : 'text-neutral-500'
                }`}
              >
                Always free for individual learners
              </span>
            )}
          </div>
        </div>

        {/* Feature list */}
        <ul className="space-y-3.5 mb-8">
          {normalizedFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <span
                className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  feature.included
                    ? isPopular
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : isPopular
                    ? 'bg-black/10 text-orange-200'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                }`}
              >
                {feature.included ? (
                  <Check className="w-3 h-3 stroke-[2.8]" />
                ) : (
                  <X className="w-3 h-3 stroke-[2.5]" />
                )}
              </span>
              <span
                className={
                  feature.included
                    ? isPopular
                      ? 'text-white font-medium'
                      : 'text-neutral-800 dark:text-neutral-200 font-medium'
                    : isPopular
                    ? 'text-orange-200/70 line-through'
                    : 'text-neutral-400 dark:text-neutral-500 line-through'
                }
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button & Subtext */}
      <div>
        <Button
          variant={isPopular ? 'white' : 'primary'}
          size="md"
          showArrow
          className="w-full justify-center text-center font-bold shadow-xs"
          onClick={onSelect}
        >
          {primaryButtonText}
        </Button>

        {underButtonNote && (
          <p
            className={`text-center text-[11px] mt-2 font-medium ${
              isPopular ? 'text-orange-100/90' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {underButtonNote}
          </p>
        )}
      </div>
    </motion.div>
  );
};
