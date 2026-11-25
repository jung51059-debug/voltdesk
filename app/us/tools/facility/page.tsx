import type { Metadata } from "next";
import { UsDevBanner } from "@/components/us/dev-banner";
import { usPageMetadata } from "@/lib/seo-us";
import Link from "next/link";
import { US_SEARCH_INDEX } from "@/lib/us/search-index";

export const metadata: Metadata = usPageMetadata({
  title: "Facility energy, generator, and UPS calculators",
  description: "Estimate equipment energy, operating cost, generator loading, and battery runtime using your own ratings, prices, and operating assumptions.",
  path: "/us/tools/facility",
});

export default function UsFacilityHubPage() {
  const ready = US_SEARCH_INDEX.filter(e => e.type === 'calculator' && e.href.startsWith('/us/tools/facility/'));
  return (
    <div className="space-y-8">
      <UsDevBanner />
      <h1 className="text-3xl font-semibold">Facility tools</h1>
      <p className="text-sm text-muted">Compare energy and operating scenarios using measured loads, operating hours, and prices. Battery discharge behavior and equipment sizing require manufacturer data beyond simple energy arithmetic.</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ready.map((entry) => {
          const pres = entry;
          return (
            <li key={entry.id}>
              <Link href={pres.href} className="block rounded-lg border border-border px-3 py-2 text-sm hover:border-primary">
                <span className="font-medium">{pres.title}</span>
                <p className="mt-1 text-xs text-muted line-clamp-2">{pres.description}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
