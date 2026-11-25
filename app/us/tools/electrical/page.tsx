import type { Metadata } from "next";
import { UsDevBanner } from "@/components/us/dev-banner";
import { usPageMetadata } from "@/lib/seo-us";
import Link from "next/link";
import { US_SEARCH_INDEX } from "@/lib/us/search-index";

export const metadata: Metadata = usPageMetadata({
  title: "Electrical power, motor, and cable calculators",
  description: "Calculate electrical current, transformer ratios, motor performance, nominal wire geometry, and cable estimates with explicit inputs and model limits.",
  path: "/us/tools/electrical",
});

export default function UsElectricalHubPage() {
  const ready = US_SEARCH_INDEX.filter(e => e.type === 'calculator' && e.href.startsWith('/us/tools/electrical/'));
  return (
    <div className="space-y-8">
      <UsDevBanner />
      <h1 className="text-3xl font-semibold">Electrical calculators</h1>
      {ready.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold">Choose a calculation</h2>
          <p className="mt-2 text-sm text-muted">Use the voltage across the actual load and distinguish nominal conductor area from insulated outside diameter. Read the formula and limitations for each tool.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
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
        </section>
      ) : null}
    </div>
  );
}
