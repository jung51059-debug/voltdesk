import type { SourceRecord } from '@/lib/us/regulation/types';
import { US_REGULATION_SOURCES } from '@/lib/us/regulation/nec-sources';
import { applyUs7SourceReview } from './us7-reviewed-sources';
import { formulaReviewFor } from './formula-review';

/** US-5 technical source registry (physics + public references; NEC tables remain license-gated). */
const LEGACY_TECHNICAL_SOURCES: SourceRecord[] = [
  ...US_REGULATION_SOURCES,
  {
    sourceId: 'openstax-up2-ac',
    documentTitle: 'OpenStax University Physics Vol. 2 — AC Circuits',
    issuingOrganization: 'OpenStax',
    edition: '',
    publicationDate: '',
    sourceUrl: 'https://openstax.org/books/university-physics-volume-2/pages/15-4-power-in-an-ac-circuit',
    accessedDate: '2026-11-24',
    verifiedSection: 'Ch. 15 AC power / RMS relationships',
    verifiedClaim: 'Real, reactive, apparent power triangle; √3 relations for balanced three-phase',
    applicability: 'Group A/B power and motor tools',
    verificationStatus: 'VERIFIED',
    reusePermissionStatus: 'ALLOWED_CITATION_ONLY',
    limitation: 'Conceptual; not equipment selection tables',
    relatedCalculators: 'power-factor,three-phase-current,motor-current',
  },
  {
    sourceId: 'nist-awg-circular-mil',
    documentTitle: 'NIST SP 811 — area and circular mil definitions',
    issuingOrganization: 'NIST',
    edition: 'SP 811',
    publicationDate: '',
    sourceUrl: 'https://www.nist.gov/pml/special-publication-811',
    accessedDate: '2026-11-24',
    verifiedSection: 'Customary electrical conductor size units (circular mil)',
    verifiedClaim: 'mm² ↔ kcmil conversion practice for engineering communication',
    applicability: 'wire-size-converter, cable tools',
    verificationStatus: 'PARTIAL',
    reusePermissionStatus: 'ALLOWED_PUBLIC',
    limitation: 'Does not replace manufacturer conductor areas or NEC tables',
    relatedCalculators: 'wire-size-converter,voltage-drop',
  },
  {
    sourceId: 'osha-loto-overview',
    documentTitle: 'OSHA — Control of hazardous energy (Lockout/Tagout overview)',
    issuingOrganization: 'OSHA (U.S. Department of Labor)',
    edition: '29 CFR 1910.147 (overview page)',
    publicationDate: '',
    sourceUrl: 'https://www.osha.gov/control-hazardous-energy',
    accessedDate: '2026-11-24',
    verifiedSection: 'Public LOTO program overview',
    verifiedClaim: 'Hazardous energy must be controlled before servicing electrical equipment',
    applicability: 'Motor, maintenance, and safety notes on US calculators',
    verificationStatus: 'PARTIAL',
    reusePermissionStatus: 'ALLOWED_PUBLIC',
    limitation: 'Summary only; not a substitute for employer program or qualified person rules',
    relatedCalculators: 'motor-current,motor-starting,short-circuit',
  },
  {
    sourceId: 'ieee-std-141-brown-book',
    documentTitle: 'IEEE Std 141 (Brown Book) — commercial building power',
    issuingOrganization: 'IEEE',
    edition: '',
    publicationDate: '',
    sourceUrl: 'https://standards.ieee.org/standard/141-1993_r2007.html',
    accessedDate: '2026-11-24',
    verifiedSection: 'Landing / scope only (full text not verified in US-5)',
    verifiedClaim: 'Voltage system naming 208Y/120, 480Y/277 discussed in industry practice',
    applicability: 'us-voltage-systems guide',
    verificationStatus: 'PENDING',
    reusePermissionStatus: 'BLOCKED_LICENSE',
    limitation: 'Full standard not body-verified; guide stays educational',
    relatedCalculators: 'three-phase-current,voltage-drop',
  },
];
export const US_TECHNICAL_SOURCES = applyUs7SourceReview(LEGACY_TECHNICAL_SOURCES);

export function sourcesForCalculator(slug: string): SourceRecord[] {
  const mapped = formulaReviewFor(slug)?.sourceIds ?? [];
  return US_TECHNICAL_SOURCES.filter((s) => {
    const list = s.relatedCalculators?.split(',') ?? [];
    return mapped.includes(s.sourceId) || list.includes(slug) || list.includes('us-*');
  });
}
