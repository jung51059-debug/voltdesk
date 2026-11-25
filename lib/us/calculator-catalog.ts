import { getPublishedTools } from "@/lib/data/tools";
import { applyGroupAUsPublication, isUsCalculatorRoutable } from "@/lib/us/publication";
import { GROUP_B_TOOLS } from '@/lib/us/group-b-tools';
import { US_CABLE_TOOLS } from '@/lib/us/cable-tools';
import { GROUP_C_BLOCKED, GROUP_C_TOOLS } from '@/lib/us/group-c-tools';

export type MigrationGroup = "A" | "B" | "C" | "D";
export type UsPublicationStatus = "planned" | "in-development" | "review" | "blocked" | "published";

export type UsCalculatorEntry = {
  contentId: string;
  krSlug: string;
  usSlug: string;
  hrefKr: string;
  migrationGroup: MigrationGroup;
  engineId: string;
  developmentPhase: string;
  publicationStatus: UsPublicationStatus;
  indexable: boolean;
  regulationDependency: "none" | "kec" | "nec" | "mixed";
  sourceVerificationStatus: "pending" | "verified" | "blocked";
  technicalReviewStatus: "pending" | "in-progress" | "complete";
};

/** US-0 primary group assignment (A30 B28 C9 D4). */
const MIGRATION_GROUP: Record<string, MigrationGroup> = {
  "single-phase-current": "A",
  "three-phase-current": "A",
  "amp-to-kw": "A",
  "kw-kva-hp": "A",
  "power-factor": "A",
  "power-triangle": "A",
  "power-factor-correction": "A",
  thd: "A",
  "harmonic-filter": "A",
  "motor-slip": "A",
  "motor-acceleration": "A",
  "transformer-load": "A",
  "transformer-current": "A",
  "transformer-loss": "A",
  "transformer-parallel": "A",
  "transformer-impedance": "A",
  "rlc-impedance": "A",
  "ct-ratio": "A",
  "pt-ratio": "A",
  busbar: "A",
  lux: "A",
  "lighting-density": "A",
  "solar-pv": "A",
  "soil-resistivity": "A",
  "field-compare": "A",
  "duty-cycle": "A",
  "trend-analysis": "A",
  "retrofit-compare": "A",
  "equipment-load": "A",
  "energy-intensity": "A",
  "voltage-drop": "B",
  "path-voltage-drop": "B",
  "cable-resistance": "B",
  "cable-impedance": "B",
  "cable-parallel": "B",
  "motor-current": "B",
  "motor-starting": "B",
  "transformer-sizing": "B",
  "vfd-sizing": "B",
  "soft-starter": "B",
  "generator-sizing": "B",
  "generator-fuel": "B",
  "generator-start-vd": "B",
  "generator-load": "B",
  "ups-backup-time": "B",
  "ups-capacity": "B",
  "battery-capacity": "B",
  "monthly-energy": "B",
  "yoy-energy": "B",
  "pm-interval": "B",
  "energy-cost": "B",
  "load-schedule": "B",
  "cable-schedule": "B",
  "load-flow": "B",
  "phase-unbalance": "B",
  "generator-load-test": "B",
  "grounding-rod": "B",
  sld: "B",
  "cable-sizing": "C",
  "cable-ampacity": "C",
  "breaker-current": "C",
  "earth-conductor": "C",
  "contract-power-current": "C",
  "short-circuit": "C",
  "protection-relay": "C",
  "spd-helper": "C",
  "panel-schedule": "C",
  "power-strip-capacity": "D",
  "sensor-calibration": "D",
  "arc-flash": "D",
  "lightning-risk": "D",
};

const REGULATION: Record<MigrationGroup, UsCalculatorEntry["regulationDependency"]> = {
  A: "none",
  B: "mixed",
  C: "nec",
  D: "mixed",
};

function baseEntry(tool: ReturnType<typeof getPublishedTools>[number]): UsCalculatorEntry {
  const group = MIGRATION_GROUP[tool.slug] ?? "B";
  return {
    contentId: tool.id,
    krSlug: tool.slug,
    usSlug: tool.slug,
    hrefKr: tool.href,
    migrationGroup: group,
    engineId: tool.slug,
    developmentPhase: group === "A" ? "US-2" : group === "B" ? "US-3" : group === "C" ? "US-4" : "US-hold",
    publicationStatus: group === "D" ? "blocked" : "planned",
    indexable: false,
    regulationDependency: tool.slug === "voltage-drop" || tool.slug === "path-voltage-drop" ? "mixed" : REGULATION[group],
    sourceVerificationStatus: group === "C" ? "pending" : "pending",
    technicalReviewStatus: "pending",
  };
}

export const US_CALCULATOR_CATALOG: UsCalculatorEntry[] = getPublishedTools().map(baseEntry);

applyGroupAUsPublication(US_CALCULATOR_CATALOG);
const GROUP_B_WORKSPACE_BLOCKED = new Set(["load-flow", "sld", "load-schedule", "cable-schedule"]);
const GROUP_C_BLOCKED_SET = new Set<string>(GROUP_C_BLOCKED);
for (const entry of US_CALCULATOR_CATALOG) {
  if (GROUP_C_BLOCKED_SET.has(entry.krSlug)) {
    entry.publicationStatus = "blocked";
    entry.sourceVerificationStatus = "pending";
    entry.technicalReviewStatus = "pending";
    continue;
  }
  if (GROUP_B_WORKSPACE_BLOCKED.has(entry.krSlug)) {
    entry.publicationStatus = "blocked";
    entry.sourceVerificationStatus = "pending";
    entry.technicalReviewStatus = "pending";
    continue;
  }
  if (GROUP_B_TOOLS.some((tool) => tool.slug === entry.krSlug) || US_CABLE_TOOLS.some((tool) => tool.slug === entry.krSlug) || GROUP_C_TOOLS.some((tool) => tool.slug === entry.krSlug)) {
    entry.publicationStatus = "review";
    entry.technicalReviewStatus = "in-progress";
  }
}

/** US-only calculator candidates (not paired to KR published set). */
export type UsNewCalculatorCandidate = {
  candidateId: string;
  titleEn: string;
  usSlug: string;
  publicationStatus: UsPublicationStatus;
  indexable: boolean;
  priority: "P1" | "P2" | "P3";
  notes: string;
};

export const US_NEW_CALCULATOR_CANDIDATES: UsNewCalculatorCandidate[] = [
  { candidateId: "us-new-ohms-law", titleEn: "Ohm's Law Calculator", usSlug: "ohms-law", publicationStatus: "review", indexable: false, priority: "P1", notes: "No KR twin; unified wire-size-converter route for AWG/mm²/kcmil" },
  { candidateId: "us-new-wire-converter", titleEn: "AWG / mm² / kcmil Converter", usSlug: "wire-size-converter", publicationStatus: "review", indexable: false, priority: "P1", notes: "Single US page; supersedes split awg/mm²/kcmil candidate IDs for routing" },
  { candidateId: "us-new-awg-mm2", titleEn: "AWG to mm²", usSlug: "awg-to-mm2", publicationStatus: "planned", indexable: false, priority: "P1", notes: "Conversion only; no ampacity table" },
  { candidateId: "us-new-mm2-awg", titleEn: "mm² to AWG", usSlug: "mm2-to-awg", publicationStatus: "planned", indexable: false, priority: "P1", notes: "" },
  { candidateId: "us-new-kcmil-mm2", titleEn: "kcmil to mm²", usSlug: "kcmil-to-mm2", publicationStatus: "planned", indexable: false, priority: "P1", notes: "" },
  { candidateId: "us-new-kva-amps", titleEn: "kVA to Amps", usSlug: "kva-to-amps", publicationStatus: "planned", indexable: false, priority: "P1", notes: "Related to three-phase-current" },
  { candidateId: "us-new-watts-amps", titleEn: "Watts to Amps", usSlug: "watts-to-amps", publicationStatus: "planned", indexable: false, priority: "P1", notes: "" },
  { candidateId: "us-new-hp-amps", titleEn: "Horsepower to Amps", usSlug: "horsepower-to-amps", publicationStatus: "planned", indexable: false, priority: "P2", notes: "" },
  { candidateId: "us-new-conduit-fill", titleEn: "Conduit Fill", usSlug: "conduit-fill", publicationStatus: "blocked", indexable: false, priority: "P3", notes: "NEC Ch.9 tables — licensing" },
  { candidateId: "us-new-box-fill", titleEn: "Box Fill", usSlug: "box-fill", publicationStatus: "blocked", indexable: false, priority: "P3", notes: "NEC" },
  { candidateId: "us-new-motor-circuit", titleEn: "NEC Motor Circuit", usSlug: "motor-circuit-sizing", publicationStatus: "blocked", indexable: false, priority: "P3", notes: "" },
  { candidateId: "us-new-egc", titleEn: "Equipment Grounding Conductor", usSlug: "equipment-grounding-conductor", publicationStatus: "blocked", indexable: false, priority: "P3", notes: "" },
  { candidateId: "us-new-residential-load", titleEn: "Residential Load Calculator", usSlug: "residential-load", publicationStatus: "blocked", indexable: false, priority: "P3", notes: "NEC 220" },
];

const byUsSlug = new Map(US_CALCULATOR_CATALOG.map((e) => [e.usSlug, e]));
const byKrSlug = new Map(US_CALCULATOR_CATALOG.map((e) => [e.krSlug, e]));

export function getUsCalculatorByUsSlug(slug: string): UsCalculatorEntry | undefined {
  return byUsSlug.get(slug);
}

export function getUsCalculatorByKrSlug(slug: string): UsCalculatorEntry | undefined {
  return byKrSlug.get(slug);
}

/** Local US page may render when dev-complete (see `isUsCalculatorRoutable`). */
export function isUsCalculatorPublished(entry: UsCalculatorEntry): boolean {
  return isUsCalculatorRoutable(entry);
}

export function countUsCatalogByGroup(): Record<MigrationGroup, number> {
  const counts: Record<MigrationGroup, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const e of US_CALCULATOR_CATALOG) counts[e.migrationGroup] += 1;
  return counts;
}
