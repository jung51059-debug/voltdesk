import { getToolBySlug } from "@/lib/data/tools";
import { regionalPath } from "@/lib/region/config";
import type { CalculatorTool } from "@/lib/types";
import { getUsCalculatorContent } from "@/lib/us/content/registry";
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { US_CABLE_TOOLS } from '@/lib/us/cable-tools';

/** US-facing tool record for rendering (SEO still noindex at layout level). */
export type UsToolPresentation = {
  slug: string;
  id: string;
  name: string;
  pageHeading: string;
  description: string;
  metaDescription: string;
  href: string;
  domain: CalculatorTool["domain"];
  categoryId: string;
  formulaId: string;
  relatedToolIds: string[];
  faqs: { question: string; answer: string }[];
};

export function buildUsToolPresentation(krSlug: string): UsToolPresentation | null {
  const tool = getToolBySlug(krSlug);
  if (!tool) return null;
  const content = getUsCalculatorContent(krSlug);
  const groupB = GROUP_B_TOOLS.find(t=>t.slug===krSlug);
  const cable = US_CABLE_TOOLS.find(t=>t.slug===krSlug);
  const domain = tool.domain;
  const basePath = domain === "facility" ? `/tools/facility/${krSlug}` : `/tools/electrical/${krSlug}`;
  const name = groupB?.title || cable?.title || tool.nameEn?.trim() || tool.name;
  const description = groupB?.overview || (cable ? `${cable.title} using US and SI units with explicit engineering assumptions.` : undefined) || content?.overview || tool.metaDescription || tool.description;
  return {
    slug: krSlug,
    id: tool.id,
    name,
    pageHeading: name,
    description,
    metaDescription: description.slice(0,160),
    href: regionalPath("US", basePath),
    domain,
    categoryId: tool.categoryId,
    formulaId: tool.formulaId,
    relatedToolIds: tool.relatedToolIds,
    faqs: content?.faqs ?? [],
  };
}

export function usCategoryLabel(categoryId: string): string {
  const map: Record<string, string> = {
    "cat-electrical-basics": "Electrical fundamentals",
    "cat-power-quality": "Power quality",
    "cat-transformer": "Transformers",
    "cat-motor": "Motors",
    "cat-cable": "Conductors",
    "cat-grounding": "Grounding",
    "cat-lighting": "Lighting",
    "cat-renewable": "Renewable",
    "cat-facility-energy": "Facility energy",
    "cat-field-verify": "Field verification",
    "cat-maintenance": "Maintenance",
  };
  return map[categoryId] ?? "Calculators";
}

export function usCategoryHref(categorySlug: string): string {
  return regionalPath("US", `/tools/categories/${categorySlug}`);
}
