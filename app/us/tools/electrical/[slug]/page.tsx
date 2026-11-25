import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { UsCalculatorWorkspace } from "@/components/calculators/us/us-calculator-workspace";
import { UsDevBanner } from "@/components/us/dev-banner";
import { getFormulaById } from "@/lib/data/formulas";
import { getUsCalculatorByUsSlug, isUsCalculatorPublished } from "@/lib/us/calculator-catalog";
import { buildUsToolPresentation } from "@/lib/us/tool-presentation";
import { usCalculatorJsonLd, usCalculatorMetadata } from "@/lib/us/seo-calculator";
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { UsGroupBPage } from '@/components/calculators/us/us-group-b-page';
import { usPageMetadata } from '@/lib/seo-us';
import { US_CABLE_TOOLS } from '@/lib/us/cable-tools';
import { UsCablePage } from '@/components/calculators/us/us-cable-page';
import { US_NEW_TOOLS } from '@/lib/us/new-tools';
import { UsNewToolPage } from '@/components/calculators/us/us-new-tool-page';
import { GROUP_C_TOOLS } from '@/lib/us/group-c-tools';
import { UsGroupCPage } from '@/components/calculators/us/us-group-c-page';
import { UsConduitFillPage } from '@/components/calculators/us/us-conduit-fill-page';
import { isUsProductionPublic } from '@/lib/us/release-seo';

const DEDICATED_ROUTES = new Set(["rlc-impedance"]);
const NEW_TOOL_SLUGS = new Set<string>(US_NEW_TOOLS.map((tool) => tool.slug));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const newTool = US_NEW_TOOLS.find((tool) => tool.slug === slug);
  if (newTool) {
    return usPageMetadata({
      title: newTool.title,
      description: isUsProductionPublic()
        ? `${newTool.title} with US customary and SI unit options.`
        : `${newTool.title} with US customary and SI unit options. Review-only US surface; not indexed until launch.`,
      path: `/us/tools/electrical/${slug}`,
    });
  }
  const cable=US_CABLE_TOOLS.find(tool=>tool.slug===slug);
  if(cable) return usPageMetadata({title:cable.title,description:`${cable.title} with US and SI units, nominal AWG geometry and explicit engineering assumptions.`,path:`/us/tools/electrical/${slug}`});
  const groupB = GROUP_B_TOOLS.find(tool=>tool.slug===slug&&tool.domain==='electrical');
  if(groupB) return usPageMetadata({title:groupB.title,description:groupB.overview,path:`/us/tools/electrical/${slug}`});
  const groupC = GROUP_C_TOOLS.find(tool=>tool.slug===slug);
  if(groupC) return usPageMetadata({title:groupC.title,description:groupC.overview,path:`/us/tools/electrical/${slug}`});
  if(slug==='conduit-fill-physical') return usPageMetadata({title:'Conduit Fill (Physical Areas)',description:'User-supplied raceway and conductor areas only — not NEC table lookup.',path:`/us/tools/electrical/${slug}`});
  if (DEDICATED_ROUTES.has(slug)) return { robots: { index: false, follow: false } };
  const entry = getUsCalculatorByUsSlug(slug);
  const tool = buildUsToolPresentation(slug);
  if (!entry || !tool || !isUsCalculatorPublished(entry)) return { robots: { index: false, follow: false } };
  return usCalculatorMetadata(tool);
}

export async function generateStaticParams() {
  const { US_CALCULATOR_CATALOG } = await import("@/lib/us/calculator-catalog");
  const { getToolBySlug } = await import("@/lib/data/tools");
  const fromCatalog = US_CALCULATOR_CATALOG.filter((e) => isUsCalculatorPublished(e))
    .filter((e) => getToolBySlug(e.krSlug)?.domain === "electrical")
    .filter((e) => !DEDICATED_ROUTES.has(e.usSlug))
    .map((e) => ({ slug: e.usSlug }));
  const extra = [
    ...US_NEW_TOOLS.map((t) => t.slug),
    ...GROUP_B_TOOLS.filter((t) => t.domain === "electrical").map((t) => t.slug),
    ...US_CABLE_TOOLS.map((t) => t.slug),
    ...GROUP_C_TOOLS.map((t) => t.slug),
    'conduit-fill-physical',
  ];
  const seen = new Set(fromCatalog.map((p) => p.slug));
  return [...fromCatalog, ...extra.filter((slug) => !seen.has(slug)).map((slug) => ({ slug }))];
}

export default async function UsElectricalToolPage({ params }: Props) {
  const { slug } = await params;
  if (NEW_TOOL_SLUGS.has(slug)) return <UsNewToolPage slug={slug} />;
  if (slug === 'conduit-fill-physical') return <UsConduitFillPage />;
  if(US_CABLE_TOOLS.some(tool=>tool.slug===slug)) return <UsCablePage slug={slug}/>;
  const groupC = GROUP_C_TOOLS.find((tool) => tool.slug === slug);
  if (groupC) return <UsGroupCPage spec={groupC} />;
  const groupB = GROUP_B_TOOLS.find(tool=>tool.slug===slug&&tool.domain==='electrical');
  if(groupB) return <UsGroupBPage spec={groupB}/>;
  if (DEDICATED_ROUTES.has(slug)) notFound();
  const entry = getUsCalculatorByUsSlug(slug);
  const tool = buildUsToolPresentation(slug);
  if (!entry || !tool || tool.domain !== 'electrical' || !isUsCalculatorPublished(entry)) notFound();
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
