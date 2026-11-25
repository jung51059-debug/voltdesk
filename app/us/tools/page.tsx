import type { Metadata } from "next";
import Link from "next/link";
import { UsDevBanner } from "@/components/us/dev-banner";
import { usPageMetadata } from "@/lib/seo-us";
import { US_SEARCH_INDEX } from "@/lib/us/search-index";
import { FavoriteButton } from "@/components/ui/favorite-button";

export const metadata: Metadata = usPageMetadata({
  title: "Electrical and facility calculators",
  description: "Find electrical power, wire geometry, motor, cable, and energy calculators with formulas, worked examples, and model limits.",
  path: "/us/tools",
});

export default function UsToolsHubPage() {
  return (
    <div className="space-y-8">
      <UsDevBanner />
      <h1 className="text-3xl font-semibold">All calculators</h1>
      <p className="text-muted">Choose a calculator by the quantity you need. Each tool explains its inputs, worked example, and limits. These engineering estimates do not establish code compliance.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {US_SEARCH_INDEX.filter(entry => entry.type === 'calculator').map((entry) => {
          return (
            <li key={entry.id} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <div className="flex items-start justify-between gap-2"><p className="font-medium text-ink"><Link href={entry.href} className="underline underline-offset-2">{entry.title}</Link></p><FavoriteButton toolId={entry.id} toolName={entry.title} /></div>
              <p className="mt-1 text-xs text-muted">
                {entry.description}
              </p>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-4 text-sm">
        <Link href="/us/tools/electrical" className="text-primary hover:underline">
          Electrical
        </Link>
        <Link href="/us/tools/facility" className="text-primary hover:underline">
          Facility
        </Link>
      </div>
    </div>
  );
}
