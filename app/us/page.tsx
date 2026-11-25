import type { Metadata } from "next";
import Link from "next/link";
import { UsDevBanner } from "@/components/us/dev-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { usPageMetadata, usWebSiteJsonLd } from "@/lib/seo-us";
import { US_SEARCH_INDEX } from "@/lib/us/search-index";
import { isUsProductionPublic } from "@/lib/us/release-seo";

const description =
  "Electrical power, wire geometry, motors, and energy calculators with worked examples, practical limits, and browser-local planning tools.";

export const metadata: Metadata = usPageMetadata({
  title: "Electrical engineering calculators and guides",
  description,
  path: "/us",
});

export default function UsHomePage() {
  const catalogCta = isUsProductionPublic() ? "Browse calculator catalog" : "Browse tool catalog (preview)";
  return (
    <div className="space-y-8">
      <JsonLd data={usWebSiteJsonLd(description)} />
      <UsDevBanner />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ampory United States</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Explore {US_SEARCH_INDEX.filter(item=>item.type==='calculator').length} calculators for electrical power, motors, wire geometry, and facility energy.
          Read each worked example and model limit before applying a result. Engineering estimates and your own criteria do not establish code compliance.
        </p>
      </div>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Start with the quantity you need</h2>
        <ul className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li><Link className="underline" href="/us/tools/electrical">Electrical power, motors, and cables</Link><p>Specify circuit connection, voltage, and units before comparing results.</p></li>
          <li><Link className="underline" href="/us/tools/facility">Facility energy and equipment</Link><p>Use your actual operating hours, prices, and equipment data.</p></li>
          <li><Link className="underline" href="/us/references">Technical guides</Link><p>Understand kW versus kVA, nominal wire geometry, and physical calculation limits.</p></li>
          <li><Link className="underline" href="/us/workspaces">Local planning workspaces</Link><p>Keep load lists, feeder inventories, and simple diagram drafts in this browser.</p></li>
        </ul>
        <Link href="/us/tools" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          {catalogCta}
        </Link>
      </section>
    </div>
  );
}
