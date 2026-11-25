import type { SearchHit } from '@/lib/types';
import { US_SEARCH_INDEX } from '@/lib/us/search-index';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\-_/·]/g, '')
    .replace(/[()]/g, '');
}

function scoreMatch(haystack: string, needle: string): number {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n) return 0;
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  if (h.includes(n)) return 50;
  return 0;
}

const US_QUERY_ALIASES: Record<string, string[]> = {
  'voltage drop': ['voltage drop', 'voltage loss', 'vd'],
  'wire size': ['wire size', 'awg', 'kcmil', 'conductor'],
  awg: ['awg', 'wire size', 'american wire gauge'],
  kcmil: ['kcmil', 'mcm', 'circular mil'],
  conductor: ['conductor', 'cable', 'wire'],
  transformer: ['transformer', 'kva'],
  motor: ['motor', 'horsepower', 'hp'],
  'power factor': ['power factor', 'pf', 'kvar'],
  'short circuit': ['short circuit', 'fault current'],
  grounding: ['grounding', 'ground rod', 'earthing'],
  'conduit fill': ['conduit fill', 'raceway fill'],
  'single line diagram': ['single line diagram', 'sld', 'one line'],
  'load schedule': ['load schedule', 'demand load'],
  'load flow': ['load flow', 'radial'],
};

function expandQuery(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const key = trimmed.toLowerCase();
  const aliases = US_QUERY_ALIASES[key] ?? US_QUERY_ALIASES[trimmed];
  return Array.from(new Set([trimmed, ...(aliases ?? [])]));
}

export function searchUsCatalog(query: string, limit = 24): SearchHit[] {
  const needles = expandQuery(query);
  if (needles.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const item of US_SEARCH_INDEX) {
    const parts = [item.title, item.description, ...item.keywords, ...item.aliases];
    const score = Math.max(0, ...needles.flatMap((needle) => parts.map((part) => scoreMatch(part, needle))));
    if (score <= 0) continue;
    const badge =
      item.type === 'calculator'
        ? 'Calculator'
        : item.type === 'guide'
          ? 'Guide'
          : item.type === 'workspace'
            ? 'Workspace'
            : 'Hub';
    hits.push({
      id: item.id,
      type: item.type === 'guide' ? 'article' : item.type === 'hub' ? 'category' : 'calculator',
      title: item.title,
      description: item.description,
      href: item.href,
      badges: [badge],
      score,
    });
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}