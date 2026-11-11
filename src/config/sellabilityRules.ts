export interface SellabilityConfig {
  allowedPricingByResourceType: Record<string, ('Free' | 'Premium' | 'Paid')[]>;
  keywordFlags: string[];
  holdPeriodDays: number; // e.g. 14 days
  sellerEligibility: {
    requireVerifiedEmail: boolean;
    minAccountAgeDays: number; // e.g. 14 days
    minFreeUploads: number; // e.g. 3 free uploads
  };
}

export const RESOURCE_TYPE_LABELS = {
  OWN_NOTES: 'Own notes/summary',
  ANSWERS: 'Answers or explanations for a past paper',
  PAST_PAPER: 'Past paper (official)',
  OFFICIAL_SLIDES: 'Official lecture slides / textbook / e-book',
  VIDEO_LINK: 'Video link',
  ARTICLE_LINK: 'Article link',
} as const;

export const DEFAULT_SELLABILITY_CONFIG: SellabilityConfig = {
  allowedPricingByResourceType: {
    'Own notes/summary': ['Free', 'Premium', 'Paid'],
    'Answers or explanations for a past paper': ['Free', 'Premium', 'Paid'],
    'Past paper (official)': ['Free'],
    'Official lecture slides / textbook / e-book': ['Free'],
    'Video link': ['Free'],
    'Article link': ['Free'],
  },
  keywordFlags: [
    'Examination',
    'Faculty',
    'Confidential',
    'All rights reserved',
    'Time allowed',
    'University of Colombo',
    'SLIIT',
    'University of Moratuwa',
    'NIBM',
    'IIT',
  ],
  holdPeriodDays: 14,
  sellerEligibility: {
    requireVerifiedEmail: true,
    minAccountAgeDays: 14,
    minFreeUploads: 3,
  },
};
