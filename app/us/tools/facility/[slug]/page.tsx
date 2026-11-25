import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { UsCalculatorWorkspace } from "@/components/calculators/us/us-calculator-workspace";
import { UsTrendAnalysisPage } from "@/components/calculators/us/us-trend-page";
import { UsDevBanner } from "@/components/us/dev-banner";
import { getFormulaById } from "@/lib/data/formulas";
import { getToolBySlug } from "@/lib/data/tools";
import { getUsCalculatorByUsSlug, isUsCalculatorPublished } from "@/lib/us/calculator-catalog";
import { buildUsToolPresentation } from "@/lib/us/tool-presentation";
import { usCalculatorJsonLd, usCalculatorMetadata } from "@/lib/us/seo-calculator";
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { UsGroupBPage } from '@/components/calculators/us/us-group-b-page';
import { usPageMetadata } from '@/lib/seo-us';

const DEDICATED = new Set(["trend-analysis"]);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const groupB=GROUP_B_TOOLS.find(tool=>tool.slug===slug&&tool.domain==='facility');
  if(groupB) return usPageMetadata({title:groupB.title,description:groupB.overview,path:`/us/tools/facility/${slug}`});
  const entry = getUsCalculatorByUsSlug(slug);
  const tool = buildUsToolPresentation(slug);
  if (!entry || !tool || !isUsCalculatorPublished(entry)) return { robots: { index: false, follow: false } };
  return usCalculatorMetadata(tool);
}

export async function generateStaticParams() {
  const { US_CALCULATOR_CATALOG } = await import("@/lib/us/calculator-catalog");
  const fromCatalog = US_CALCULATOR_CATALOG.filter((e) => isUsCalculatorPublished(e))
    .filter((e) => getToolBySlug(e.krSlug)?.domain === "facility")
    .filter((e) => !DEDICATED.has(e.usSlug))
    .map((e) => ({ slug: e.usSlug }));
  const extra = GROUP_B_TOOLS.filter((t) => t.domain === "facility").map((t) => t.slug);
  const seen = new Set(fromCatalog.map((p) => p.slug));
  return [...fromCatalog, ...extra.filter((slug) => !seen.has(slug)).map((slug) => ({ slug }))];
}

export default async function UsFacilityToolPage({ params }: Props) {
  const { slug } = await params;
  const groupB=GROUP_B_TOOLS.find(tool=>tool.slug===slug&&tool.domain==='facility');
  if(groupB) return <UsGroupBPage spec={groupB}/>;
  const entry = getUsCalculatorByUsSlug(slug);
  const kr = getToolBySlug(slug);
  if (!entry || !kr || kr.domain !== "facility" || !isUsCalculatorPublished(entry)) notFound();

  if (slug === "trend-analysis") {
    return (
      <div className="space-y-6">
        <UsDevBanner />
        <UsTrendAnalysisPage />
      </div>
    );
  }

  const tool = buildUsToolPresentation(slug);
  if (!tool) notFound();
  const formula = getFormulaById(tool.formulaId);
  if (!formula) notFound();

  return (
    <div className="space-y-6">
      <UsDevBanner />
      <JsonLd data={usCalculatorJsonLd(tool)} />
      <UsCalculatorWorkspace tool={tool} formula={formula} />
    </div>
  );
}
