// ========================================================
// SINGLE SOURCE OF TRUTH: EduShare Plans & Pricing Config
// ========================================================

export type BillingCycle = 'monthly' | 'semester' | 'yearly';

export interface PlanPricing {
  monthly: number;
  semester: number; // 5 months
  yearly: number;
}

export interface PlanConfig {
  id: 'free' | 'premium' | 'batch';
  name: string;
  badge?: string;
  description: string;
  pricing: PlanPricing;
  perMonthEquivalent: {
    monthly: number;
    semester: number;
    yearly: number;
  };
  savingsBadge?: {
    semester?: string;
    yearly?: string;
  };
  ctaText: string;
  subCtaText?: string;
  isPopular?: boolean;
  memberCapacity?: number;
  memberPriceNote?: string;
  features: string[];
}

export interface FeatureRow {
  id: string;
  name: string;
  free: string | boolean;
  premium: string | boolean;
  batch: string | boolean;
  tooltip?: string;
}

export interface FeatureGroup {
  groupName: string;
  rows: FeatureRow[];
}

// Student Discount Rates
export const STUDENT_DISCOUNT = {
  verifiedMonthlyPrice: 159,
  regularMonthlyPrice: 199,
  badgeText: 'Student verified',
  discountPercentageText: '20% Student Benefit',
};

// Marketplace rules
export const MARKETPLACE_CONFIG = {
  minPdfPrice: 30,
  maxPdfPrice: 3000,
  stepPdfPrice: 10,
  defaultPdfPrice: 150,
  platformCommissionRate: 0.10, // 10% fee
  premiumMemberPdfDiscountRate: 0.15, // 15% off paid PDFs for Premium
};

export const PLANS_CONFIG: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Essential revision access for individual exam prep and browsing community lecture notes.',
    pricing: {
      monthly: 0,
      semester: 0,
      yearly: 0,
    },
    perMonthEquivalent: {
      monthly: 0,
      semester: 0,
      yearly: 0,
    },
    ctaText: 'Get Started Free',
    subCtaText: 'Free forever · No card required',
    isPopular: false,
    features: [
      'Browse all university module notes',
      'Download 5 PDFs per month',
      'Community discussion lounge & questions',
      'Public study circles',
      'Standard web reader',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    badge: 'Best Value',
    description: 'Our most popular student pass for top grades, complete past paper proofs, and unlimited downloads.',
    pricing: {
      monthly: 199,
      semester: 799,
      yearly: 1499,
    },
    perMonthEquivalent: {
      monthly: 199,
      semester: 160,
      yearly: 125,
    },
    savingsBadge: {
      semester: 'Save 20%',
      yearly: 'Save 37%',
    },
    ctaText: 'Choose Demo Premium',
    subCtaText: 'Cancel anytime',
    isPopular: true,
    features: [
      'Unlimited PDF & past paper downloads',
      '15% discount on paid PDFs',
      'Full 5-year past paper solutions',
      'On-demand AI PDF summaries',
      'Private study groups with screen share',
      'Zero ads & clean print exports',
      'Bulk ZIP download & offline access',
      'Special Scholar badge on profile',
    ],
  },
  {
    id: 'batch',
    name: 'Batch Pack',
    badge: 'For Cohorts',
    description: 'Designed for university study circles, hostel batches, and student club cohorts of up to 30 members.',
    pricing: {
      monthly: 1499,
      semester: 5999,
      yearly: 11999,
    },
    perMonthEquivalent: {
      monthly: 1499,
      semester: 1200,
      yearly: 1000,
    },
    savingsBadge: {
      semester: 'Save 20%',
      yearly: 'Save 33%',
    },
    memberCapacity: 30,
    memberPriceNote: '≈ Rs. 50 per member',
    ctaText: 'Get Batch Pack',
    subCtaText: 'Up to 30 students included',
    isPopular: false,
    features: [
      'Full Premium for up to 30 classmates',
      '≈ Rs. 50 per member pricing',
      '100 shared batch repository storage',
      'Private batch study circles & lounge',
      'AI summaries & batch question bank',
      'Centralized semester billing',
      'Priority tutor response support',
    ],
  },
];

// Single source comparison table rows
export const COMPARISON_TABLE_DATA: FeatureGroup[] = [
  {
    groupName: 'Downloads & Access',
    rows: [
      {
        id: 'downloads_per_month',
        name: 'Downloads per month',
        free: '5',
        premium: 'Unlimited',
        batch: 'Unlimited',
        tooltip: 'High-resolution watermarked PDF study guides and papers.',
      },
      {
        id: 'premium_only_resources',
        name: 'Premium-only resources',
        free: false,
        premium: true,
        batch: true,
        tooltip: 'Exclusive 5-year solved past papers and faculty model answers.',
      },
      {
        id: 'discount_on_paid_pdfs',
        name: 'Discount on paid PDFs',
        free: '0%',
        premium: '15%',
        batch: '15%',
        tooltip: 'Instant member discount applied at checkout on all student-priced guides.',
      },
    ],
  },
  {
    groupName: 'Publishing & Storage',
    rows: [
      {
        id: 'uploads_allowed',
        name: 'Uploads allowed',
        free: '5',
        premium: '100',
        batch: '100 shared batch library',
        tooltip: 'Number of study guides, cheatsheets, and lab manuals you can publish.',
      },
      {
        id: 'max_file_size',
        name: 'Max file size',
        free: '20MB',
        premium: '100MB',
        batch: '100MB',
        tooltip: 'Maximum PDF file upload size limit per resource.',
      },
    ],
  },
  {
    groupName: 'AI & Collaboration Features',
    rows: [
      {
        id: 'ai_features',
        name: 'On-demand AI PDF summaries',
        free: false,
        premium: true,
        batch: true,
        tooltip: 'One-click AI chapter summaries and instant questions answered from documents.',
      },
      {
        id: 'private_study_groups',
        name: 'Private study groups',
        free: false,
        premium: true,
        batch: '✓ (batch-wide)',
        tooltip: 'Create locked peer study circles for your university module or cohort.',
      },
      {
        id: 'ads_banners',
        name: 'Ads / banners',
        free: 'shown',
        premium: 'hidden',
        batch: 'hidden',
        tooltip: 'Enjoy clean, distraction-free reading without sponsored study ads.',
      },
      {
        id: 'perks_bundle',
        name: 'Early access, bulk ZIP download, Premium badge',
        free: false,
        premium: true,
        batch: true,
        tooltip: 'Download entire module archives in one ZIP file with verified profile flair.',
      },
      {
        id: 'priority_support',
        name: 'Priority support',
        free: false,
        premium: false,
        batch: true,
        tooltip: 'Direct batch administrator support line with sub-2 hour SLA.',
      },
    ],
  },
];

// Helper: Calculate discount on paid PDF for Premium members
export function calculatePdfPrice(
  basePrice: number,
  isPremiumUser: boolean
): { price: number; discount: number; isDiscounted: boolean } {
  if (isPremiumUser && basePrice > 0) {
    const discount = Math.round(basePrice * MARKETPLACE_CONFIG.premiumMemberPdfDiscountRate);
    const finalPrice = Math.max(0, basePrice - discount);
    return { price: finalPrice, discount, isDiscounted: true };
  }
  return { price: basePrice, discount: 0, isDiscounted: false };
}

// Helper: Calculate Creator Earnings after 10% platform fee
export function calculateCreatorEarnings(sellingPrice: number): number {
  return Math.round(sellingPrice * (1 - MARKETPLACE_CONFIG.platformCommissionRate));
}

// Helper: Get plan price based on billing cycle and student verification
export function getDisplayPlanPrice(
  plan: PlanConfig,
  cycle: BillingCycle,
  isStudentVerified: boolean
): {
  amount: number;
  perMonthAmount: number;
  originalAmount?: number;
  periodLabel: string;
  isDiscounted: boolean;
} {
  const isMonthly = cycle === 'monthly';
  const isSemester = cycle === 'semester';
  const isYearly = cycle === 'yearly';

  let amount = plan.pricing[cycle];
  let perMonthAmount = plan.perMonthEquivalent[cycle];
  let originalAmount: number | undefined;
  let isDiscounted = false;

  // Apply student discount to Premium monthly
  if (plan.id === 'premium' && isStudentVerified) {
    if (isMonthly) {
      originalAmount = plan.pricing.monthly; // 199
      amount = STUDENT_DISCOUNT.verifiedMonthlyPrice; // 159
      perMonthAmount = STUDENT_DISCOUNT.verifiedMonthlyPrice;
      isDiscounted = true;
    }
  }

  const periodLabel = isMonthly ? '/ month' : isSemester ? '/ semester (5 mo)' : '/ year';

  return {
    amount,
    perMonthAmount,
    originalAmount,
    periodLabel,
    isDiscounted,
  };
}
