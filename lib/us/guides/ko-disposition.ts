import { articles } from '@/lib/data/articles';
import { KO_REFERENCE_ANALYSIS } from '@/lib/us/guides/ko-reference-inventory';

export type UsDisposition = 'LOCALIZED' | 'MERGED' | 'DEFERRED' | 'BLOCKED' | 'NOT_APPLICABLE' | 'PLANNED';

export type KoDispositionRow = {
  krSlug: string;
  krTitle: string;
  contentCategory: string;
  usDisposition: UsDisposition;
  usTargetSlug: string;
  sourceStatus: string;
  followUpPhase: string;
  notes: string;
};

type KoArticleAnalysis = (typeof KO_REFERENCE_ANALYSIS)[number];

function mapDisposition(
  usAction: KoArticleAnalysis['usAction'],
  usGuideSlug?: string,
): UsDisposition {
  if (usAction === 'BLOCKED') return 'BLOCKED';
  if (usAction === 'NOT_APPLICABLE') return 'NOT_APPLICABLE';
  if (usAction === 'MERGE') return 'MERGED';
  if (usGuideSlug && (usAction === 'NEW_US_CONTENT' || usAction === 'REUSE_WITH_LOCALIZATION' || usAction === 'REWRITE_FOR_US')) {
    return 'LOCALIZED';
  }
  if (usAction === 'REUSE_WITH_LOCALIZATION' || usAction === 'REWRITE_FOR_US') return 'PLANNED';
  return 'DEFERRED';
}

export function buildKoDispositionRows(): KoDispositionRow[] {
  const bySlug = new Map(KO_REFERENCE_ANALYSIS.map((a) => [a.koSlug, a]));
  return articles.map((art) => {
    const row = bySlug.get(art.slug);
    const usGuideSlug = row?.usGuideSlug ?? '';
    const disposition = row ? mapDisposition(row.usAction, row.usGuideSlug) : 'PLANNED';
    let sourceStatus = 'PENDING';
    if (disposition === 'LOCALIZED') sourceStatus = 'PARTIAL';
    if (disposition === 'BLOCKED') sourceStatus = 'BLOCKED_LICENSE';
    if (disposition === 'NOT_APPLICABLE') sourceStatus = 'NOT_APPLICABLE';
  if (disposition === 'MERGED') sourceStatus = 'PARTIAL';
    return {
      krSlug: art.slug,
      krTitle: art.title,
      contentCategory: art.categoryId,
      usDisposition: disposition,
      usTargetSlug: usGuideSlug,
      sourceStatus,
      followUpPhase: disposition === 'LOCALIZED' ? 'US-5' : disposition === 'BLOCKED' ? 'US-6+' : 'US-6',
      notes: row?.notes ?? 'No US-5 mapping row',
    };
  });
}