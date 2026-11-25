import { Breadcrumb } from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { UsGuidePanel } from "@/components/calculators/us/us-guide-panel";
import { RlcImpedanceClientUs } from "@/components/calculators/us/rlc-impedance-client-us";
import { getFormulaById } from "@/lib/data/formulas";
import { getUsCalculatorContent } from "@/lib/us/content/registry";
import { buildUsToolPresentation } from "@/lib/us/tool-presentation";
import { usCalculatorJsonLd, usCalculatorMetadata } from "@/lib/us/seo-calculator";
import { regionalPath } from "@/lib/region/config";

export function UsRlcImpedancePage() {
  const tool = buildUsToolPresentation("rlc-impedance")!;
  const formula = getFormulaById(tool.formulaId)!;
  const content = getUsCalculatorContent("rlc-impedance")!;
  const meta = usCalculatorMetadata(tool);

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0">
      <JsonLd data={usCalculatorJsonLd(tool)} />
      <Breadcrumb
        items={[
          { href: regionalPath("US", "/"), label: "Home" },
          { href: regionalPath("US", "/tools/electrical"), label: "Electrical" },
          { label: tool.pageHeading },
        ]}
        compact
      />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{tool.pageHeading}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{content.overview}</p>
      </header>
      <RlcImpedanceClientUs />
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
      <p className="sr-only">{meta.description}</p>
    </div>
  );
}