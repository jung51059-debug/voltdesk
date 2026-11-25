import type { UsCalculatorFaq, UsContentReference } from '@/lib/us/content/types';

export type UsGuideSection = { heading: string; paragraphs: string[] };

export type UsGuideRecord = {
  contentId: string;
  slug: string;
  title: string;
  description: string;
  category: 'basics' | 'practice' | 'systems';
  contentType: 'reference_article' | 'reference_guide' | 'us_new';
  koArticleSlug?: string;
  migrationStatus:
    | 'REUSE_WITH_LOCALIZATION'
    | 'REWRITE_FOR_US'
    | 'MERGE'
    | 'NEW_US_CONTENT'
    | 'BLOCKED'
    | 'NOT_APPLICABLE';
  sections: UsGuideSection[];
  faqs: UsCalculatorFaq[];
  references: UsContentReference[];
  relatedCalculatorSlugs: string[];
  relatedGuideSlugs: string[];
  sourceIds: string[];
  verificationStatus: 'VERIFIED' | 'PARTIAL' | 'PENDING' | 'BLOCKED_LICENSE' | 'BLOCKED_ACCESS';
  publicationStatus: 'review';
  indexable: false;
};