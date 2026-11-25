import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UsDevBanner } from "@/components/us/dev-banner";
import { getCategoryBySlug, getHubCategories } from "@/lib/data/categories";
import { usPageMetadata } from "@/lib/seo-us";
import { US_CALCULATOR_CATALOG } from "@/lib/us/calculator-catalog";
import { usCalculatorTitle } from "@/lib/us/us-calculator-title";
import { getToolBySlug } from "@/lib/data/tools";
import Link from 'next/link';
import { usCategoryDescription } from '@/lib/us/search-aliases';
import { usCalculatorPath } from '@/lib/us/us-calculator-path';
import { isUsNavigationVisible } from "@/lib/us/release-gate";
import { isUsProductionPublic } from "@/lib/us/release-seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getHubCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  const title = isUsProductionPublic() ? category.nameEn : `${category.nameEn} (US preview)`;
  return usPageMetadata({
    title,
    description: usCategoryDescription(category.slug,category.nameEn),
    path: `/us/tools/categories/${slug}`,
  });
}

export default async function UsCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category || category.order >= 90) notFound();

  const tools = US_CALCULATOR_CATALOG.filter((e) => e.publicationStatus === "published" || e.publicationStatus === "review");
  const inCategory = tools.filter((e) => {
    const t = getToolBySlug(e.krSlug);
    return t?.categoryId === category.id && isUsNavigationVisible(usCalculatorPath(e.usSlug));
  });

  return (
    <div className="space-y-6">
      <UsDevBanner />
      <h1 className="text-3xl font-semibold">{category.nameEn}</h1>
      <p className="text-muted">{usCategoryDescription(category.slug,category.nameEn)}</p>
      <ul className="grid gap-2">
        {inCategory.map((e) => (
          <li key={e.contentId} className="text-sm text-muted">
            <Link className="text-primary underline" href={usCalculatorPath(e.usSlug)}>{usCalculatorTitle(e.usSlug, e.krSlug)}</Link>
          </li>
        ))}
      </ul>
      {slug === 'schedule' ? <p><Link className="underline" href="/us/workspaces/load-schedule">Load schedule</Link> and <Link className="underline" href="/us/workspaces/cable-schedule">cable schedule</Link> use your own demand factors, ratings, and notes.</p> : null}
      {slug === 'advanced' ? <p>{isUsNavigationVisible('/us/workspaces/load-flow')?<><Link className="underline" href="/us/workspaces/load-flow">Radial load flow</Link> provides a balanced approximation. </>:null}<Link className="underline" href="/us/workspaces/sld">Single-line diagram drafts</Link> use lists and a simple SVG preview.</p> : null}
    </div>
  );
}
