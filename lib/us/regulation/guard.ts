import type { RegionCode } from "@/lib/region/config";
import { isKecReviewAllowed } from "@/lib/region/regulation";

/** Returns false for US routes; unverified NEC tables must not activate. */
export function isNecTableEmbedAllowed(edition: string): boolean {
  void edition;
  return false;
}

export function assertRegionRegulationLayer(region: RegionCode): void {
  if (region === "US" && isKecReviewAllowed("US")) {
    throw new Error("KEC review must not be enabled for US region");
  }
}

export type CodeRuleActivation = {
  ruleId: string;
  verificationStatus: string;
  dataLicenseStatus: string;
  active: boolean;
};

export function necRuleActivation(ruleId: string, verification: string, license: string): CodeRuleActivation {
  const active = verification === "VERIFIED" && license === "ALLOWED_PUBLIC" && isNecTableEmbedAllowed("any");
  return { ruleId, verificationStatus: verification, dataLicenseStatus: license, active };
}