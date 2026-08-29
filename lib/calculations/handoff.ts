/** 계산기 간 전달·공유에 넣을 수 있는 입력 키. 부하명·프로젝트명은 넣지 않습니다. */
export const HANDOFF_KEYS = new Set([
  "phase",
  "power",
  "powerUnit",
  "voltage",
  "voltageUnit",
  "pf",
  "efficiency",
  "length",
  "lengthUnit",
  "current",
  "allowPct",
  "material",
  "parallel",
  "demandKw",
  "loadKw",
  "staticKw",
  "motorKw",
  "upsKw",
  "nonlinKw",
  "diversity",
  "margin",
  "ratedKw",
  "ratedKva",
  "loadKva",
  "growth",
  "outputPf",
  "trKva",
  "trZpct",
  "cFactor",
  "includeTr",
  "hours",
  "dcV",
  "loadW",
  "ah",
  "designCurrent",
  "iz",
  "load",
  "loadUnit",
  "batteryV",
  "vSecondary",
  "vPrimary",
  "mode",
  "motorKva",
  "genKva",
  "xd",
  "unit",
  "designValue",
  "measuredValue",
  "tolerancePct",
  "loadMode",
  "powerKw",
  "hoursPerDay",
  "daysPerMonth",
  "loadFactor",
  "energyPrice",
  "baselineKw",
  "proposedKw",
  "vr",
  "vs",
  "vt",
  "ir",
  "is",
  "it",
  "designKva",
  "frequency",
  "toleranceMode",
  "toleranceAbs",
  "unbalanceMethod",
  "vaMag",
  "vaAng",
  "vbMag",
  "vbAng",
  "vcMag",
  "vcAng",
  "ratedCurrent",
  "inRated",
  "izCorrected",
  "i2Conv",
  "kecReview",
  "kecScope",
  "kecSupply",
  "kecLoad",
  "kecPathSame",
  "kecPathLength",
]);

const VALUE = /^[0-9A-Za-z._+\-]+$/;

function sanitizeValue(raw: string): string | null {
  const s = raw.trim();
  if (!s || s.length > 24) return null;
  if (!VALUE.test(s)) return null;
  return s;
}

export function parseHandoff(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    if (!HANDOFF_KEYS.has(key)) return;
    const safe = sanitizeValue(value);
    if (safe) out[key] = safe;
  });
  return out;
}

export function buildHandoffHref(pathname: string, raw: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (!HANDOFF_KEYS.has(key) || value === undefined || value === null) continue;
    const safe = sanitizeValue(String(value));
    if (!safe) continue;
    params.set(key, safe);
    if ([...params.keys()].length >= 20) break;
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function followUp(label: string, pathname: string, values: Record<string, string | number | undefined | null>) {
  return { label, href: buildHandoffHref(pathname, values) };
}
