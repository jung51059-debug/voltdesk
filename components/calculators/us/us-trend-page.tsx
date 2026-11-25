import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { UsTrendClient } from "@/components/calculators/us/us-trend-client";
import { getFormulaById } from "@/lib/data/formulas";
import { getUsCalculatorContent } from "@/lib/us/content/registry";
import { buildUsToolPresentation } from "@/lib/us/tool-presentation";
import { usCalculatorJsonLd } from "@/lib/us/seo-calculator";
import { UsGuidePanel } from "@/components/calculators/us/us-guide-panel";
import { regionalPath } from "@/lib/region/config";

export function UsTrendAnalysisPage() {
  const tool = buildUsToolPresentation("trend-analysis")!;
  const formula = getFormulaById(tool.formulaId)!;
  const content = getUsCalculatorContent("trend-analysis")!;

  return (
    <>
      <JsonLd data={usCalculatorJsonLd(tool)} />
      <Breadcrumb
        items={[
          { href: regionalPath("US", "/"), label: "Home" },
          { href: regionalPath("US", "/tools/facility"), label: "Facility" },
          { label: "Trend analysis" },
        ]}
      />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{tool.pageHeading}</h1>
        <p className="mt-2 text-sm text-muted">{content.overview}</p>
      </header>
      <UsTrendClient />
      <UsGuidePanel content={content} formula={formula} />
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">FAQ</h2>
        <dl className="mt-3 space-y-4">
          {content.faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="text-sm font-medium">{faq.question}</dt>
              <dd className="mt-1 text-sm leading-6 text-muted">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}