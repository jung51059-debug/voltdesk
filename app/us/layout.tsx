import type { Metadata } from "next";
import { RegionDocument } from "@/components/layout/region-document";
import { US_DEFAULT_ROBOTS } from "@/lib/region/feature-flags";
import { SITE } from "@/lib/types";
import "./accessibility.css";
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {default: "Ampory US | Engineering Calculators", template: "%s | Ampory US"},
  description: "Electrical and facility engineering calculators with formulas and worked examples.",
  robots: US_DEFAULT_ROBOTS,
  openGraph: {locale: "en_US", siteName: "Ampory US", type: "website"},
};
export default function UsLayout({children}: {children: React.ReactNode}) {
  return <RegionDocument region="US">{children}</RegionDocument>;
}
