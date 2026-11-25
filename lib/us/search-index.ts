import { US_PUBLISHED_GUIDES } from '@/lib/us/guides/published-guides';
import {isUsNavigationVisible} from './release-gate';
import { US_SEARCH_ALIASES, usCategoryDescription } from './search-aliases';
import { US_NEW_TOOLS } from './new-tools';
import { getUsCalculatorContent } from './content/registry';
import { usCalculatorPath } from './us-calculator-path';
import { buildUsToolPresentation } from '@/lib/us/tool-presentation';
import { US_ROUTABLE_SLUGS } from '@/lib/us/us-routable-slugs';
import { US_WORKSPACES } from '@/lib/us/workspaces/inventory';
import { getHubCategories } from '@/lib/data/categories';

export type UsSearchRecord = {
  id: string;
  type: 'calculator' | 'guide' | 'workspace' | 'hub';
  title: string;
  description: string;
  href: string;
  keywords: string[];
  aliases: string[];
};

export function buildUsSearchIndex(): UsSearchRecord[] {
  const items: UsSearchRecord[] = [];

  for (const slug of US_ROUTABLE_SLUGS) {
    const tool = buildUsToolPresentation(slug);
    if (!tool) {
      const title=US_NEW_TOOLS.find(t=>t.slug===slug)?.title??(slug==='conduit-fill-physical'?'Conduit Fill — Physical Area Calculator':null);
      const content=getUsCalculatorContent(slug);
      if(title&&content) items.push({id:`us-tool-${slug}`,type:'calculator',title,description:content.overview,href:usCalculatorPath(slug),keywords:[slug,'electrical'],aliases:[slug.replaceAll('-',' '),...(US_SEARCH_ALIASES[slug]??[])]});
      continue;
    }
    items.push({
      id: tool.id,
      type: 'calculator',
      title: tool.name,
      description: tool.description,
      href: tool.href,
      keywords: [slug, tool.domain, tool.categoryId],
      aliases: [slug.replace(/-/g, ' '), ...(US_SEARCH_ALIASES[slug]??[])],
    });
  }

  for (const guide of US_PUBLISHED_GUIDES) {
    items.push({
      id: guide.contentId,
      type: 'guide',
      title: guide.title,
      description: guide.description,
      href: `/us/references/${guide.slug}`,
      keywords: [guide.slug, guide.category, ...guide.relatedCalculatorSlugs],
      aliases: [guide.slug.replace(/-/g, ' '), ...(US_SEARCH_ALIASES[guide.slug]??[])],
    });
  }

  for (const ws of US_WORKSPACES) {
    if (ws.status === 'BLOCKED') continue;
    items.push({
      id: ws.contentId,
      type: 'workspace',
      title: ws.titleEn,
      description: ws.descriptionEn,
      href: ws.href,
      keywords: ws.searchTerms,
      aliases: [...ws.aliases, ws.slug.replaceAll('-',' '), ...(ws.slug==='sld'?['single-line diagram']:[])],
    });
  }

  const hubs: UsSearchRecord[] = [
    {
      id: 'hub-us-tools',
      type: 'hub',
      title: 'All calculators',
      description: 'Catalog of routable US electrical and facility calculators.',
      href: '/us/tools',
      keywords: ['calculators', 'tools'],
      aliases: ['catalog'],
    },
    {
      id: 'hub-us-electrical',
      type: 'hub',
      title: 'Electrical calculators',
      description: 'Routable US electrical engineering calculators.',
      href: '/us/tools/electrical',
      keywords: ['electrical'],
      aliases: [],
    },
    {
      id: 'hub-us-guides',
      type: 'hub',
      title: 'Technical guides',
      description: 'Independent US reference articles.',
      href: '/us/references',
      keywords: ['guides', 'references'],
      aliases: ['technical guides'],
    },
    {
      id: 'hub-us-workspaces',
      type: 'hub',
      title: 'Workspaces',
      description: 'Load flow, schedules, and single-line diagram helpers.',
      href: '/us/workspaces',
      keywords: ['workspace', 'schedule', 'sld'],
      aliases: [],
    },
  ];

  for (const c of getHubCategories().filter((cat) => cat.order < 90)) {
    hubs.push({
      id: `hub-cat-${c.id}`,
      type: 'hub',
      title: c.nameEn,
      description: usCategoryDescription(c.slug,c.nameEn),
      href: `/us/tools/categories/${c.slug}`,
      keywords: [c.slug, c.nameEn, ...c.id.split('-')],
      aliases: [c.nameEn],
    });
  }

  return [...items, ...hubs].filter(item=>isUsNavigationVisible(item.href));
}

export const US_SEARCH_INDEX = buildUsSearchIndex();
