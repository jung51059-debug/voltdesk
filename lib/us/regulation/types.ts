/** US regulation layer — separate from KEC; no compliance claims without verified sources. */
export type SourceVerificationStatus =
  | "VERIFIED"
  | "PARTIAL"
  | "PENDING"
  | "BLOCKED_ACCESS"
  | "BLOCKED_LICENSE"
  | "NOT_APPLICABLE";

export type ReusePermissionStatus =
  | "ALLOWED_PUBLIC"
  | "ALLOWED_CITATION_ONLY"
  | "USER_INPUT_ONLY"
  | "BLOCKED_LICENSE"
  | "UNKNOWN";

export type RegulationStandard = "NONE" | "NEC" | "IEEE" | "IEC" | "OSHA" | "NIST" | "UL" | "MIXED";

export type SourceRecord = {
  sourceId: string;
  documentTitle: string;
  issuingOrganization: string;
  edition: string;
  publicationDate: string;
  sourceUrl: string;
  accessedDate: string;
  verifiedSection: string;
  verifiedClaim: string;
  applicability: string;
  verificationStatus: SourceVerificationStatus;
  reusePermissionStatus: ReusePermissionStatus;
  limitation: string;
  relatedCalculators: string;
};

export type GroupCImplementationType =
  | "TYPE1_ENGINEERING"
  | "TYPE2_USER_SUPPLIED"
  | "TYPE3_VERIFIED_CODE"
  | "TYPE4_BLOCKED";

export type JurisdictionRecord = {
  jurisdictionId: string;
  region: string;
  adoptedEdition: string;
  adoptionStatus: "UNKNOWN" | "CONFIRMED_PARTIAL";
  effectiveDate: string;
  localAmendments: string;
  sourceUrl: string;
  accessedDate: string;
  notes: string;
};