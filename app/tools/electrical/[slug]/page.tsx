import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorWorkspace } from "@/components/calculators/calculator-workspace";
import { JsonLd } from "@/components/seo/json-ld";
import { getRelatedArticles } from "@/lib/data/articles";
import { getFormulaById } from "@/lib/data/formulas";
import { getPublishedTools, getRelatedTools, getToolBySlug, isElectricalWorkspaceTool } from "@/lib/data/tools";
import { breadcrumbJsonLd, calculatorBreadcrumbItems, calculatorJsonLd, faqJsonLd, toolMetadata } from "@/lib/seo";

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
  return toolMetadata(tool);
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
      <JsonLd data={breadcrumbJsonLd(calculatorBreadcrumbItems(tool))} />
      <JsonLd data={calculatorJsonLd(tool)} />
      <JsonLd data={faqJsonLd(tool.faqs)} />
      <CalculatorWorkspace tool={tool} formula={formula} related={related} articles={articles} />
    </>
  );
}
