import { CalculatorFaq } from "@/components/calculators/calculator-faq";
import { CalculatorExplain } from "@/components/calculators/calculator-explain";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import {
  PathVoltageDropPageShell,
  PathVoltageDropPanelFallback,
} from "@/components/calculators/path-voltage-drop-page-shell";
import type { Metadata } from "next";
import { Suspense } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { RelatedResources } from "@/components/calculators/related-resources";
import { PathVoltageDropClient } from "@/components/calculators/path-voltage-drop-client";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { getRelatedArticles } from "@/lib/data/articles";
import { getCategoryById } from "@/lib/data/categories";
import { getFormulaById } from "@/lib/data/formulas";
import { getRelatedTools, getToolBySlug } from "@/lib/data/tools";
import { breadcrumbJsonLd, calculatorBreadcrumbItems, calculatorJsonLd, faqJsonLd, toolMetadata } from "@/lib/seo";

const tool = getToolBySlug("path-voltage-drop");

export const metadata: Metadata = tool
  ? toolMetadata(tool)
  : {
      title: "경로 전압강하 계산기",
      description: "인입구부터 최종 부하까지 여러 배선 구간의 누적 전압강하를 검토하는 Ampory 계산기입니다.",
      alternates: { canonical: "/tools/electrical/path-voltage-drop" },
    };

export default function PathVoltageDropPage() {
  const pageTool = getToolBySlug("path-voltage-drop");
  const articles = getRelatedArticles(pageTool?.relatedArticleIds ?? []);
  const related = pageTool ? getRelatedTools(pageTool) : [];
  const category = pageTool ? getCategoryById(pageTool.categoryId) : undefined;
  const formula = getFormulaById("formula-path-voltage-drop");
  const description = pageTool?.metaDescription ?? pageTool?.longDescription ?? pageTool?.description ?? "";

  return (
  <>
      <JsonLd
        data={breadcrumbJsonLd(
          pageTool
            ? calculatorBreadcrumbItems(pageTool)
            : [
                { name: "홈", href: "/" },
                { name: "전기", href: "/tools/electrical" },
                { name: "케이블 / 배선", href: "/tools/categories/cable" },
                { name: "경로 전압강하 계산기", href: "/tools/electrical/path-voltage-drop" },
              ],
        )}
      />
      {pageTool ? <JsonLd data={calculatorJsonLd(pageTool, { description })} /> : null}
      {pageTool ? <JsonLd data={faqJsonLd(pageTool.faqs)} /> : null}
      <div className="mx-auto w-full max-w-5xl">
        <PathVoltageDropPageShell
          actions={<FavoriteButton toolId="tool-path-voltage-drop" toolName="경로 전압강하 계산기" />}
        />
        <Suspense fallback={<PathVoltageDropPanelFallback />}>
          <PathVoltageDropClient />
        </Suspense>
        {formula ? (
          <>
            <CalculatorExplain slug="path-voltage-drop" formula={formula} />
            <TechnicalDisclosure formula={formula} slug="path-voltage-drop" variant="compact" />
          </>
        ) : null}
        <RelatedResources
          related={related}
          articles={articles}
          sourceToolSlug="path-voltage-drop"
          category={category?.slug}
        />
      </div>
      {pageTool ? <CalculatorFaq faqs={pageTool.faqs} /> : null}
    </>
  );
}