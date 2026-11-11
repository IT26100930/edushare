import { SellabilityConfig, DEFAULT_SELLABILITY_CONFIG } from '../config/sellabilityRules.ts';
import { Resource } from '../data/models.ts';

// ============================================================================
// OOP CONCEPT: Strategy Pattern for Pricing Rules
// Encapsulates pricing constraints and messaging strategies based on resource type.
// ============================================================================

export interface PricingStrategy {
  isPriceTypeAllowed(priceType: 'Free' | 'Premium' | 'Paid'): boolean;
  getExplanatoryTooltip(): string;
  getSuggestionCard(): { title: string; text: string } | null;
}

export class FreeOnlyPricing implements PricingStrategy {
  isPriceTypeAllowed(priceType: 'Free' | 'Premium' | 'Paid'): boolean {
    return priceType === 'Free';
  }

  getExplanatoryTooltip(): string {
    return "Official campus material belongs to its owner. You can share it for free, or sell your own explanations and answers instead.";
  }

  getSuggestionCard(): { title: string; text: string } | null {
    return {
      title: 'Monetization Tip',
      text: 'Create an answers pack for this paper and sell that.',
    };
  }
}

export class PaidPricing implements PricingStrategy {
  isPriceTypeAllowed(): boolean {
    return true; // Free, Premium, or Paid allowed
  }

  getExplanatoryTooltip(): string {
    return 'Original student work can be offered for free, monetized as a single purchase, or unlocked with Scholar Pass.';
  }

  getSuggestionCard(): { title: string; text: string } | null {
    return null;
  }
}

export class FreeOrPremiumPricing implements PricingStrategy {
  isPriceTypeAllowed(priceType: 'Free' | 'Premium' | 'Paid'): boolean {
    return priceType === 'Free' || priceType === 'Premium';
  }

  getExplanatoryTooltip(): string {
    return 'Video links cannot be sold individually. You can offer them for free or include them in Premium Scholar Pass.';
  }

  getSuggestionCard(): { title: string; text: string } | null {
    return {
      title: 'Content Packaging',
      text: 'Offer your video walkthrough as part of Premium Scholar Pass or attach your written solution notes.',
    };
  }
}

// ============================================================================
// OOP CONCEPT: Abstraction & Polymorphism
// Abstract Resource base class with polymorphic getPriceRule() method.
// Subclasses represent domain resource models.
// ============================================================================

export abstract class BaseResourceModel {
  constructor(
    public id: string,
    public title: string,
    public type: string
  ) {}

  // CONCEPT: Polymorphism - Every concrete resource class overrides getPriceRule()
  abstract getPriceRule(config?: SellabilityConfig): PricingStrategy;
}

export class PastPaperResource extends BaseResourceModel {
  getPriceRule(): PricingStrategy {
    return new FreeOnlyPricing();
  }
}

export class OfficialSlidesResource extends BaseResourceModel {
  getPriceRule(): PricingStrategy {
    return new FreeOnlyPricing();
  }
}

export class ArticleLinkResource extends BaseResourceModel {
  getPriceRule(): PricingStrategy {
    return new FreeOnlyPricing();
  }
}

export class OwnNotesResource extends BaseResourceModel {
  getPriceRule(): PricingStrategy {
    return new PaidPricing();
  }
}

export class AnswersResource extends BaseResourceModel {
  getPriceRule(): PricingStrategy {
    return new PaidPricing();
  }
}

export class VideoLinkResource extends BaseResourceModel {
  getPriceRule(): PricingStrategy {
    return new FreeOrPremiumPricing();
  }
}

// Factory helper to instantiate resource domain models
export class ResourceModelFactory {
  static create(type: string, id: string = 'res-temp', title: string = 'Untitled'): BaseResourceModel {
    switch (type) {
      case 'Past paper (official)':
      case 'Past Paper':
        return new PastPaperResource(id, title, type);
      case 'Official lecture slides / textbook / e-book':
      case 'E-Book':
        return new OfficialSlidesResource(id, title, type);
      case 'Article link':
      case 'Article':
        return new ArticleLinkResource(id, title, type);
      case 'Answers or explanations for a past paper':
        return new AnswersResource(id, title, type);
      case 'Video link':
        return new VideoLinkResource(id, title, type);
      case 'Own notes/summary':
      case 'Notes':
      default:
        return new OwnNotesResource(id, title, type);
    }
  }
}

// ============================================================================
// OOP CONCEPT: Interface Segregation & Originality Checkers
// Single-responsibility checkers for Hash, Similarity, Keywords, and AI Review.
// ============================================================================

export interface SimilarityMatchInfo {
  matchedResourceId: string;
  matchedTitle: string;
  similarityPercentage: number;
  fileHashMatch: boolean;
}

export interface ReviewCheckResult {
  checkerName: string;
  passed: boolean;
  score: number; // 0 to 100
  badge: 'Looks original' | 'Needs review' | 'Likely official material';
  flaggedKeywords: string[];
  similarityMatch?: SimilarityMatchInfo;
  reason: string;
}

export interface OriginalityChecker {
  check(
    resourceData: {
      title: string;
      description: string;
      fileHash?: string;
      sampleContent?: string[];
      type: string;
    },
    existingResources: Resource[],
    config: SellabilityConfig
  ): ReviewCheckResult;
}

// 1. HashChecker - Checks exact duplicate file hashes
export class HashChecker implements OriginalityChecker {
  check(
    resourceData: { title: string; description: string; fileHash?: string; sampleContent?: string[]; type: string },
    existingResources: Resource[]
  ): ReviewCheckResult {
    const hash = resourceData.fileHash;
    if (hash) {
      const match = existingResources.find((r) => r.id === hash || r.title.toLowerCase() === resourceData.title.toLowerCase());
      if (match) {
        return {
          checkerName: 'HashChecker',
          passed: false,
          score: 0,
          badge: 'Likely official material',
          flaggedKeywords: [],
          similarityMatch: {
            matchedResourceId: match.id,
            matchedTitle: match.title,
            similarityPercentage: 100,
            fileHashMatch: true,
          },
          reason: `Exact duplicate file match found with catalog resource "${match.title}".`,
        };
      }
    }
    return {
      checkerName: 'HashChecker',
      passed: true,
      score: 100,
      badge: 'Looks original',
      flaggedKeywords: [],
      reason: 'No exact hash duplicate found in EduShare repository.',
    };
  }
}

// 2. SimilarityChecker - Near-duplicate text fingerprinting (flags 80%+)
export class SimilarityChecker implements OriginalityChecker {
  check(
    resourceData: { title: string; description: string; fileHash?: string; sampleContent?: string[]; type: string },
    existingResources: Resource[]
  ): ReviewCheckResult {
    const textToCompare = (resourceData.title + ' ' + resourceData.description).toLowerCase();
    
    for (const res of existingResources) {
      const existingText = (res.title + ' ' + res.description).toLowerCase();
      const sim = calculateJaccardSimilarity(textToCompare, existingText);
      
      if (sim >= 0.80) {
        const perc = Math.round(sim * 100);
        return {
          checkerName: 'SimilarityChecker',
          passed: false,
          score: Math.round((1 - sim) * 100),
          badge: 'Needs review',
          flaggedKeywords: [],
          similarityMatch: {
            matchedResourceId: res.id,
            matchedTitle: res.title,
            similarityPercentage: perc,
            fileHashMatch: false,
          },
          reason: `High text similarity (${perc}%) with existing resource "${res.title}".`,
        };
      }
    }

    return {
      checkerName: 'SimilarityChecker',
      passed: true,
      score: 95,
      badge: 'Looks original',
      flaggedKeywords: [],
      reason: 'Text fingerprint similarity is below 80% threshold.',
    };
  }
}

// Helper: Calculate word Jaccard similarity index
function calculateJaccardSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/).filter((w) => w.length > 3));
  const words2 = new Set(str2.split(/\s+/).filter((w) => w.length > 3));
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });
  
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

// 3. KeywordChecker - Keyword & university metadata flags
export class KeywordChecker implements OriginalityChecker {
  check(
    resourceData: { title: string; description: string; fileHash?: string; sampleContent?: string[]; type: string },
    _existingResources: Resource[],
    config: SellabilityConfig = DEFAULT_SELLABILITY_CONFIG
  ): ReviewCheckResult {
    const text = (resourceData.title + ' ' + resourceData.description + ' ' + (resourceData.sampleContent?.join(' ') || '')).toLowerCase();
    const foundKeywords: string[] = [];

    config.keywordFlags.forEach((kw) => {
      if (text.includes(kw.toLowerCase())) {
        foundKeywords.push(kw);
      }
    });

    if (foundKeywords.length > 0) {
      return {
        checkerName: 'KeywordChecker',
        passed: false,
        score: Math.max(20, 100 - foundKeywords.length * 25),
        badge: resourceData.type.includes('Past paper') || resourceData.type.includes('Official')
          ? 'Likely official material'
          : 'Needs review',
        flaggedKeywords: foundKeywords,
        reason: `Contains official institutional keywords: "${foundKeywords.join('", "')}".`,
      };
    }

    return {
      checkerName: 'KeywordChecker',
      passed: true,
      score: 100,
      badge: 'Looks original',
      flaggedKeywords: [],
      reason: 'No restricted campus keywords or exam headers detected.',
    };
  }
}

// 4. AiReviewChecker - Evaluates overall risk and assigns mock AI badge
export class AiReviewChecker implements OriginalityChecker {
  check(
    resourceData: { title: string; description: string; fileHash?: string; sampleContent?: string[]; type: string },
    existingResources: Resource[],
    config: SellabilityConfig
  ): ReviewCheckResult {
    // Run preceding checks to derive overall AI verdict
    const hashRes = new HashChecker().check(resourceData, existingResources);
    const simRes = new SimilarityChecker().check(resourceData, existingResources);
    const kwRes = new KeywordChecker().check(resourceData, existingResources, config);

    if (!hashRes.passed) {
      return {
        checkerName: 'AiReviewChecker',
        passed: false,
        score: 10,
        badge: 'Likely official material',
        flaggedKeywords: kwRes.flaggedKeywords,
        similarityMatch: hashRes.similarityMatch,
        reason: hashRes.reason,
      };
    }

    if (!simRes.passed) {
      return {
        checkerName: 'AiReviewChecker',
        passed: false,
        score: simRes.score,
        badge: 'Needs review',
        flaggedKeywords: kwRes.flaggedKeywords,
        similarityMatch: simRes.similarityMatch,
        reason: `This looks the same as an existing resource ("${simRes.similarityMatch?.matchedTitle}").`,
      };
    }

    if (!kwRes.passed) {
      return {
        checkerName: 'AiReviewChecker',
        passed: false,
        score: kwRes.score,
        badge: resourceData.type === 'Past paper (official)' || resourceData.type === 'Official lecture slides / textbook / e-book'
          ? 'Likely official material'
          : 'Needs review',
        flaggedKeywords: kwRes.flaggedKeywords,
        reason: kwRes.reason,
      };
    }

    // Default if type is inherently official
    if (
      resourceData.type === 'Past paper (official)' ||
      resourceData.type === 'Official lecture slides / textbook / e-book'
    ) {
      return {
        checkerName: 'AiReviewChecker',
        passed: false,
        score: 50,
        badge: 'Likely official material',
        flaggedKeywords: ['Official Material'],
        reason: 'Type classified as official campus material. Free-only rules apply.',
      };
    }

    return {
      checkerName: 'AiReviewChecker',
      passed: true,
      score: 98,
      badge: 'Looks original',
      flaggedKeywords: [],
      reason: 'AI Analysis confirms original student authoring structure.',
    };
  }
}

// ============================================================================
// OOP CONCEPT: Composition / Pipeline Pattern
// ReviewPipeline aggregates all checkers into a unified execution flow.
// ============================================================================

export class ReviewPipeline {
  private checkers: OriginalityChecker[];

  constructor() {
    this.checkers = [
      new HashChecker(),
      new SimilarityChecker(),
      new KeywordChecker(),
      new AiReviewChecker(),
    ];
  }

  public runPipeline(
    resourceData: {
      title: string;
      description: string;
      fileHash?: string;
      sampleContent?: string[];
      type: string;
    },
    existingResources: Resource[],
    config: SellabilityConfig = DEFAULT_SELLABILITY_CONFIG
  ): ReviewCheckResult {
    let finalResult: ReviewCheckResult = {
      checkerName: 'PipelineUnified',
      passed: true,
      score: 100,
      badge: 'Looks original',
      flaggedKeywords: [],
      reason: 'All automated originality checks passed successfully.',
    };

    for (const checker of this.checkers) {
      const result = checker.check(resourceData, existingResources, config);
      if (!result.passed) {
        return result; // Early exit on severe failure
      }
    }

    return finalResult;
  }
}
