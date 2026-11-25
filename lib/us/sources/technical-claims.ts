import { US_FORMULA_REVIEWS } from './formula-review';
export type TechnicalClaim = {
  claimId: string;
  slug: string;
  kind: 'formula' | 'safety' | 'units';
  claim: string;
  sourceId: string;
  status: 'VERIFIED' | 'PARTIAL' | 'PENDING' | 'BLOCKED_LICENSE';
};

export const US_TECHNICAL_CLAIMS: TechnicalClaim[] = [
  { claimId: 'claim-ohm-power', slug: 'ohms-law', kind: 'formula', claim: 'P = V × I for DC resistive load', sourceId: 'openstax-up2-power', status: 'VERIFIED' },
  { claimId: 'claim-3ph-current', slug: 'three-phase-current', kind: 'formula', claim: 'Balanced RMS I₃ = P / (√3 V_L PF η), with user supplied efficiency', sourceId: 'doe-ac-power', status: 'VERIFIED' },
  { claimId: 'claim-motor-hp', slug: 'motor-current', kind: 'units', claim: 'Mechanical hp converted to W before applying efficiency and RMS current relationship', sourceId: 'nist-sp811-2024', status: 'VERIFIED' },
  { claimId: 'claim-ampacity-user', slug: 'cable-ampacity', kind: 'formula', claim: 'Iz′ = user Iz × user factors; no NEC table value or acceptance inferred', sourceId: 'arithmetic-definition', status: 'VERIFIED' },
  { claimId: 'claim-vdrop-rx', slug: 'voltage-drop', kind: 'formula', claim: 'First-order R/X phasor drop; full model and coefficient scope still partial', sourceId: 'openstax-series-rlc', status: 'PARTIAL' },
  { claimId: 'claim-awg-area', slug: 'wire-size-converter', kind: 'units', claim: 'AWG geometric progression and nominal circular area; no ampacity', sourceId: 'nist-awg-circular-mil', status: 'VERIFIED' },
  { claimId: 'claim-conduit-physical', slug: 'conduit-fill-physical', kind: 'formula', claim: 'Physical area fraction = sum(insulated area × count) / raceway internal area', sourceId: 'arithmetic-definition', status: 'VERIFIED' },
  {
    claimId: 'claim-safety-deenergize',
    slug: 'motor-current',
    kind: 'safety',
    claim: 'Covered electrical work: deenergization exceptions, electrical lockout/tagging and qualified-person absence-of-voltage verification under 1910.333; 1910.147 has a different scope',
    sourceId: 'osha-electrical-work-practices',
    status: 'VERIFIED',
  },
  {
    claimId: 'claim-radial-distflow',
    slug: 'load-flow',
    kind: 'formula',
    claim: 'Radial DistFlow-style V² drop: V²_to ≈ V²_from − 2(RP+XQ)',
    sourceId: 'doe-ac-power',
    status: 'PARTIAL',
  },
];
for(const review of US_FORMULA_REVIEWS) US_TECHNICAL_CLAIMS.push({claimId:`claim-us7-${review.slug}`,slug:review.slug,kind:'formula',claim:`${review.basis} Scope: ${review.limitation}`,sourceId:review.sourceIds.join(';'),status:review.status});
