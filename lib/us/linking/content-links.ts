import { getUsCalculatorContent } from '@/lib/us/content/registry';
import {isUsNavigationVisible} from '../release-gate';
import {usCalculatorPath} from '../us-calculator-path';
import { getUsGuide, US_PUBLISHED_GUIDES } from '@/lib/us/guides/published-guides';
import { US_ROUTABLE_SLUGS } from '@/lib/us/us-routable-slugs';

const ROUTABLE = new Set<string>(US_ROUTABLE_SLUGS);

export function calculatorPath(slug: string, domain?: 'electrical' | 'facility'): string {
  if (domain === 'facility') return `/us/tools/facility/${slug}`;
  return `/us/tools/electrical/${slug}`;
}

export function guidePath(slug: string): string {
  return `/us/references/${slug}`;
}

/** Related guide slugs declared on calculator content or inverse map. */
export function relatedGuidesForCalculator(slug: string): string[] {
  const content = getUsCalculatorContent(slug);
  const fromContent = content?.relatedGuideSlugs ?? [];
  const fromGuides = US_PUBLISHED_GUIDES.filter((g) => g.relatedCalculatorSlugs.includes(slug)).map((g) => g.slug);
  return [...new Set([...fromContent, ...fromGuides])].filter((s) => getUsGuide(s)&&isUsNavigationVisible(guidePath(s)));
}

export function relatedCalculatorsForGuide(slug: string): string[] {
  const guide = getUsGuide(slug);
  if (!guide) return [];
  return guide.relatedCalculatorSlugs.filter((s) => ROUTABLE.has(s)&&isUsNavigationVisible(usCalculatorPath(s)));
}

export function validateInternalLink(href: string): 'ok' | 'missing' | 'blocked' {
  if (href.startsWith('/us/tools/electrical/') || href.startsWith('/us/tools/facility/')) {
    const slug = href.split('/').pop() ?? '';
    return ROUTABLE.has(slug) ? 'ok' : 'missing';
  }
  if (href.startsWith('/us/references/')) {
    const slug = href.replace('/us/references/', '');
    return getUsGuide(slug) ? 'ok' : 'missing';
  }
  return 'missing';
}
