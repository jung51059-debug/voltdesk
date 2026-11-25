import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UsDevBanner } from "@/components/us/dev-banner";
import { UsRlcImpedancePage } from "@/components/calculators/us/us-rlc-page";
import { getUsCalculatorByUsSlug } from "@/lib/us/calculator-catalog";
import { isUsCalculatorPublished } from "@/lib/us/calculator-catalog";
import { buildUsToolPresentation } from "@/lib/us/tool-presentation";
import { usCalculatorMetadata } from "@/lib/us/seo-calculator";

export async function generateMetadata(): Promise<Metadata> {
  const entry = getUsCalculatorByUsSlug("rlc-impedance");
  const tool = buildUsToolPresentation("rlc-impedance");
  if (!entry || !tool || !isUsCalculatorPublished(entry)) return { robots: { index: false, follow: false } };
  return usCalculatorMetadata(tool);
}

export default function UsRlcRoute() {
  const entry = getUsCalculatorByUsSlug("rlc-impedance");
  if (!entry || !isUsCalculatorPublished(entry)) notFound();
  return (
    <div className="space-y-6">
      <UsDevBanner />
      <UsRlcImpedancePage />
    </div>
  );
}