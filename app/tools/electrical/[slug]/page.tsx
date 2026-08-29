import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorWorkspace } from "@/components/calculators/calculator-workspace";
import { JsonLd } from "@/components/seo/json-ld";
import { getRelatedArticles } from "@/lib/data/articles";
import { getFormulaById } from "@/lib/data/formulas";
import { getPublishedTools, getRelatedTools, getToolBySlug, isElectricalWorkspaceTool } from "@/lib/data/tools";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPublishedTools()
    .filter(isElectricalWorkspaceTool)
    .map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || !isElectricalWorkspaceTool(tool)) return {};
  return {
    title: tool.name,
    description: tool.longDescription,
    alternates: { canonical: tool.href },
    openGraph: { title: tool.name, description: tool.description },
  };
}

export default async function ElectricalToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || !isElectricalWorkspaceTool(tool)) notFound();
  const formula = getFormulaById(tool.formulaId);
  if (!formula) notFound();
  const related = getRelatedTools(tool);
  const articles = getRelatedArticles(tool.relatedArticleIds);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", href: "/" },
          { name: "전기 계산기", href: "/tools/electrical" },
          { name: tool.name, href: tool.href },
        ])}
      />
      <JsonLd data={faqJsonLd(tool.faqs)} />
      <CalculatorWorkspace tool={tool} formula={formula} related={related} articles={articles} />
    </>
  );
}
