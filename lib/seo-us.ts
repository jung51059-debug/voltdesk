import type { Metadata } from "next";
import { SITE } from "@/lib/types";
import { US_DEFAULT_ROBOTS } from "@/lib/region/feature-flags";
import { REGION_US } from "@/lib/region/config";
import { hreflangLanguagesForUsPath, isUsProductionPublic, resolveUsPageIndexable } from "@/lib/us/release-seo";

const US_SITE_NAME = `${SITE.name} US`;

export function usPageMetadata(params: {
  title: string;
  description: string;
  path: string;
  indexable?: boolean;
}): Metadata {
  const canonical = params.path.startsWith("/us") ? params.path : `/us${params.path}`;
  const indexable = resolveUsPageIndexable(canonical, params.indexable);
  const languages = indexable ? hreflangLanguagesForUsPath(canonical) : null;
  return {
    title: params.title,
    description: params.description,
    alternates: languages ? { canonical, languages } : { canonical },
    openGraph: {
      type: "website",
      locale: REGION_US.openGraphLocale,
      siteName: US_SITE_NAME,
      title: params.title,
      description: params.description,
    },
    robots: indexable ? { index: true, follow: true } : US_DEFAULT_ROBOTS,
  };
}

/** Footer / region switch: public US is live on Production public builds and explicit QA flags. */
export function shouldShowUsDevBanner(): boolean {
  return !isUsProductionPublic();
}

export function usWebSiteJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: US_SITE_NAME,
    url: `${SITE.url}/us`,
    description,
    inLanguage: REGION_US.jsonLdInLanguage,
  };
}