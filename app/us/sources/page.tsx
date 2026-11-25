import type { Metadata } from "next";
import { UsPolicyShell } from "@/components/us/policy-shell";
import { usPageMetadata } from "@/lib/seo-us";
import { US_TECHNICAL_SOURCES } from '@/lib/us/sources/technical-sources';

export const metadata: Metadata = usPageMetadata({
  title: "Sources",
  description: "Document-level engineering references, verified claim scopes, access limits and data-rights status for Ampory US.",
  path: "/us/sources",
});

export default function UsSourcesPage() {
  return (
    <UsPolicyShell title="Sources">
      <p>References support only the claims and conditions listed here. A verified unit factor does not verify an entire
        calculator or an installation. Numerical example checks, documentary review and data reuse rights are separate.</p>
      <ul className="mt-6 space-y-6">{US_TECHNICAL_SOURCES.map(source=><li key={source.sourceId}>
        <h2 className="font-semibold"><a className="text-primary underline" href={source.sourceUrl}>{source.documentTitle}</a></h2>
        <p className="mt-1 text-sm">{source.issuingOrganization} · {source.edition} · {source.verificationStatus}</p>
        <p className="mt-2">Reviewed scope: {source.verifiedClaim}</p><p className="mt-1 text-sm text-muted">{source.limitation}</p>
        <p className="mt-1 text-sm text-muted">Section: {source.verifiedSection}. Reuse status: {source.reusePermissionStatus}. Checked {source.accessedDate}.</p>
      </li>)}</ul>
    </UsPolicyShell>
  );
}
