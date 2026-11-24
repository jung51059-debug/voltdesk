import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CalculatorExplain } from "./calculator-explain";
import { CalculatorFaq } from "./calculator-faq";
import { RelatedResources } from "./related-resources";
import { CableImpedanceClient, RlcImpedanceClient } from "./impedance-client";
import { JsonLd } from "@/components/seo/json-ld";
import { getToolBySlug, getRelatedTools } from "@/lib/data/tools";
import { getFormulaById } from "@/lib/data/formulas";
import { breadcrumbJsonLd, calculatorBreadcrumbItems, calculatorJsonLd, faqJsonLd } from "@/lib/seo";
export function ImpedancePage({slug}:{slug:"cable-impedance"|"rlc-impedance"}) {
  const tool=getToolBySlug(slug)!,formula=getFormulaById(tool.formulaId)!;
  return <div className="mx-auto w-full max-w-5xl min-w-0">
    <JsonLd data={breadcrumbJsonLd(calculatorBreadcrumbItems(tool))}/><JsonLd data={calculatorJsonLd(tool)}/><JsonLd data={faqJsonLd(tool.faqs)}/>
    <Breadcrumb items={[{href:"/",label:"홈"},{href:"/tools/electrical",label:"전기"},{label:tool.name}]} compact/>
    <header className="mb-6"><h1 className="text-2xl font-semibold">{tool.name}</h1><p className="mt-3 text-sm leading-7 text-muted">{tool.longDescription}</p></header>
    {slug==="cable-impedance"?<CableImpedanceClient/>:<RlcImpedanceClient/>}
    <CalculatorExplain slug={slug} formula={formula}/><CalculatorFaq faqs={tool.faqs}/><RelatedResources related={getRelatedTools(tool)} articles={[]} sourceToolSlug={slug}/>
  </div>;
}
