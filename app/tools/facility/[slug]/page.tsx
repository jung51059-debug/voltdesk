import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorWorkspace } from "@/components/calculators/calculator-workspace";
import { JsonLd } from "@/components/seo/json-ld";
import { getRelatedArticles } from "@/lib/data/articles";
import { getFormulaById } from "@/lib/data/formulas";
import { getPublishedTools, getRelatedTools, getToolBySlug } from "@/lib/data/tools";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPublishedTools()
    .filter((tool) => tool.domain === "facility")
    .map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.domain !== "facility") return {};
  return {
    title: tool.name,
    description: tool.longDescription,
    alternates: { canonical: tool.href },
    openGraph: { title: tool.name, description: tool.description },
  };
}

export default async function FacilityToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.domain !== "facility") notFound();
  const formula = getFormulaById(tool.formulaId);
  if (!formula) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", href: "/" },
          { name: "시설 관리", href: "/tools/facility" },
          { name: tool.name, href: tool.href },
        ])}
      />
      <JsonLd data={faqJsonLd(tool.faqs)} />
      <CalculatorWorkspace
        tool={tool}
        formula={formula}
        related={getRelatedTools(tool)}
        articles={getRelatedArticles(tool.relatedArticleIds)}
      />
    </>
  );
}
