import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { LoadFlowClient } from "@/components/schedules/load-flow-client";
import { breadcrumbJsonLd, calculatorJsonLd, faqJsonLd } from "@/lib/seo";
import { getToolBySlug } from "@/lib/data/tools";
import { toolMetadata } from "@/lib/seo";
import { getFormulaById } from "@/lib/data/formulas";
import { CalculatorExplain } from "@/components/calculators/calculator-explain";

const pageTool = getToolBySlug("load-flow")!;
const description = pageTool.metaDescription ?? pageTool.description;

export const metadata: Metadata = toolMetadata(pageTool);

export default function LoadFlowPage() {
  const tool = getToolBySlug("load-flow");
  const formula = getFormulaById("formula-load-flow");
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", href: "/" },
          { name: "전기", href: "/tools/electrical" },
          { name: "조류 계산", href: "/tools/electrical/load-flow" },
        ])}
      />
      {tool ? <JsonLd data={calculatorJsonLd(tool, { name: "방사형 조류 계산", description })} /> : null}
      {tool ? <JsonLd data={faqJsonLd(tool.faqs)} /> : null}
      <Breadcrumb items={[{ href: "/", label: "홈" }, { href: "/tools/electrical", label: "전기" }, { label: "조류 계산" }]} />
      <LoadFlowClient />
      {formula ? <CalculatorExplain slug="load-flow" formula={formula} /> : null}
      <section className="mt-8 space-y-4" aria-labelledby="load-flow-faq">
        <h2 id="load-flow-faq" className="text-lg font-semibold">자주 묻는 질문</h2>
        {tool?.faqs.map((faq) => (
          <details key={faq.question} className="rounded-lg border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium">{faq.question}</summary>
            <p className="mt-3 text-sm leading-7 text-muted">{faq.answer}</p>
          </details>
        ))}
      </section>
    </>
  );
}
