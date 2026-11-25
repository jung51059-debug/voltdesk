import { REGION_US } from "@/lib/region/config";
import { usPageMetadata } from "@/lib/seo-us";
import { SITE } from "@/lib/types";
import type { UsToolPresentation } from "@/lib/us/tool-presentation";

export function usCalculatorMetadata(tool: UsToolPresentation) {
  return usPageMetadata({
    title: tool.pageHeading,
    description: tool.metaDescription,
    path: tool.href,
  });
}

export function usCalculatorJsonLd(tool: UsToolPresentation) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.pageHeading,
    applicationCategory: "EngineeringApplication",
    operatingSystem: "Web",
    url: `${SITE.url}${tool.href}`,
    inLanguage: REGION_US.jsonLdInLanguage,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}