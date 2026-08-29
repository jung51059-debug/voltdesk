import { SQRT_3 } from "@/lib/math/units";
import { roundTo } from "@/lib/math/round";

/** 표준 분류. 알 수 없는 값은 Summary에서 기타로 묶습니다. */
export const LOAD_CATEGORIES = ["조명", "콘센트", "냉방", "모터", "UPS", "기타"] as const;
export type LoadCategory = (typeof LOAD_CATEGORIES)[number];

export type LoadRow = {
  id: string;
  name: string;
  category: string;
  qty: number;
  unitKw: number;
  efficiency: number;
  pf: number;
  demand: number;
  coincidence: number;
  voltage: number;
  phase: "1" | "3";
  pole: "R" | "S" | "T" | "RST";
  panel: string;
  remark: string;
};

export type LoadSummary = {
  connectedKw: number;
  inputKw: number;
  demandKw: number;
  demandKva: number;
  demandKvar: number;
  pf: number;
  currentA: number;
};

export type LoadEquipment = {
  transformerKva: number;
  generatorKw: number;
};

/** localStorage 문서. 예전 LoadRow[] 도 읽습니다. 프로젝트 저장은 아직 넣지 않습니다. */
export type LoadScheduleDocument = {
  version: 1;
  rows: LoadRow[];
  equipment: LoadEquipment;
};

export type CsvImportError = { line: number; message: string };
export type CsvImportResult = { rows: LoadRow[]; errors: CsvImportError[] };

export type GroupSummary = LoadSummary & { key: string; count: number };

export function emptyLoadRow(): LoadRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "모터",
    qty: 1,
    unitKw: 0,
    efficiency: 1,
    pf: 0.85,
    demand: 1,
    coincidence: 1,
    voltage: 380,
    phase: "3",
    pole: "RST",
    panel: "MCC-1",
    remark: "",
  };
}

export function normalizeLoadRow(raw: unknown): LoadRow {
  const base = emptyLoadRow();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const phase = String(r.phase ?? "3") === "1" ? "1" : "3";
  const poleRaw = String(r.pole ?? (phase === "1" ? "R" : "RST")).toUpperCase();
  const pole = poleRaw === "R" || poleRaw === "S" || poleRaw === "T" ? poleRaw : "RST";
  return {
    ...base,
    id: typeof r.id === "string" && r.id ? r.id : base.id,
    name: String(r.name ?? ""),
    category: String(r.category ?? "모터") || "모터",
    qty: numOr(r.qty, 1),
    unitKw: numOr(r.unitKw, 0),
    efficiency: numOr(r.efficiency, 1),
    pf: numOr(r.pf, 0.85),
    demand: numOr(r.demand, 1),
    coincidence: numOr(r.coincidence, 1),
    voltage: numOr(r.voltage, 380),
    phase,
    pole: phase === "3" ? "RST" : pole,
    panel: String(r.panel ?? "MCC-1") || "MCC-1",
    remark: String(r.remark ?? ""),
  };
}

export function parseLoadScheduleDocument(raw: unknown): LoadScheduleDocument {
  const emptyEq = { transformerKva: 0, generatorKw: 0 };
  if (Array.isArray(raw)) {
    return { version: 1, rows: raw.map(normalizeLoadRow), equipment: emptyEq };
  }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const rows = Array.isArray(obj.rows) ? obj.rows.map(normalizeLoadRow) : [];
    const eq = obj.equipment && typeof obj.equipment === "object" ? (obj.equipment as Record<string, unknown>) : {};
    return {
      version: 1,
      rows,
      equipment: {
        transformerKva: numOr(eq.transformerKva, 0),
        generatorKw: numOr(eq.generatorKw, 0),
      },
    };
  }
  return { version: 1, rows: [], equipment: emptyEq };
}

function numOr(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function canonicalCategory(raw: string): LoadCategory | string {
  const t = raw.trim();
  if ((LOAD_CATEGORIES as readonly string[]).includes(t)) return t;
  const key = t.toLowerCase();
  const aliases: Record<string, LoadCategory> = {
    동력: "모터",
    motor: "모터",
    lighting: "조명",
    light: "조명",
    receptacle: "콘센트",
    outlet: "콘센트",
    hvac: "냉방",
    cooling: "냉방",
    에어컨: "냉방",
    ups: "UPS",
    other: "기타",
    etc: "기타",
  };
  return aliases[t] ?? aliases[key] ?? t;
}

export function categoryBucket(raw: string): LoadCategory {
  const c = canonicalCategory(raw);
  return (LOAD_CATEGORIES as readonly string[]).includes(c) ? (c as LoadCategory) : "기타";
}

export function rowPowers(row: LoadRow): LoadSummary {
  const connectedKw = Math.max(0, row.qty) * Math.max(0, row.unitKw);
  const eta = row.efficiency > 0 && row.efficiency <= 1 ? row.efficiency : 1;
  const inputKw = connectedKw / eta;
  const demandKw = inputKw * clamp01(row.demand) * clamp01(row.coincidence);
  const pf = row.pf > 0 && row.pf <= 1 ? row.pf : 1;
  const demandKva = demandKw / pf;
  const demandKvar = Math.sqrt(Math.max(demandKva * demandKva - demandKw * demandKw, 0));
  const currentA =
    row.voltage > 0
      ? row.phase === "1"
        ? (demandKva * 1000) / row.voltage
        : (demandKva * 1000) / (SQRT_3 * row.voltage)
      : 0;
  return { connectedKw, inputKw, demandKw, demandKva, demandKvar, pf, currentA };
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

export function summarizeLoads(rows: LoadRow[]): LoadSummary & { count: number } {
  const acc = rows.reduce(
    (sum, row) => {
      const p = rowPowers(row);
      return {
        connectedKw: sum.connectedKw + p.connectedKw,
        inputKw: sum.inputKw + p.inputKw,
        demandKw: sum.demandKw + p.demandKw,
        demandKva: sum.demandKva + p.demandKva,
        demandKvar: sum.demandKvar + p.demandKvar,
        currentA: 0,
        pf: 1,
      };
    },
    { connectedKw: 0, inputKw: 0, demandKw: 0, demandKva: 0, demandKvar: 0, currentA: 0, pf: 1 },
  );
  const pf = acc.demandKva > 0 ? acc.demandKw / acc.demandKva : 0;
  const feeder = estimatedMaxCurrentA(rows);
  return { ...acc, pf, currentA: feeder.currentA, count: rows.length };
}

export function summarizeByCategory(rows: LoadRow[]): GroupSummary[] {
  return LOAD_CATEGORIES.map((key) => {
    const group = rows.filter((row) => categoryBucket(row.category) === key);
    return { key, ...summarizeLoads(group) };
  });
}

export function summarizeByPanel(rows: LoadRow[]): GroupSummary[] {
  const names = [...new Set(rows.map((row) => row.panel.trim() || "(미지정)"))];
  return names
    .map((key) => {
      const group = rows.filter((row) => (row.panel.trim() || "(미지정)") === key);
      return { key, ...summarizeLoads(group) };
    })
    .sort((a, b) => a.key.localeCompare(b.key, "ko"));
}

export function estimatedMaxCurrentA(rows: LoadRow[]): { currentA: number; voltage: number; mixed: boolean } {
  const groups = new Map<number, LoadRow[]>();
  for (const row of rows) {
    const v = row.voltage > 0 ? row.voltage : 0;
    const list = groups.get(v) ?? [];
    list.push(row);
    groups.set(v, list);
  }
  let currentA = 0;
  let voltage = 0;
  for (const [v, group] of groups) {
    if (v <= 0) continue;
    const s = group.reduce(
      (sum, row) => {
        const p = rowPowers(row);
        return { kva: sum.kva + p.demandKva, three: sum.three || row.phase === "3" };
      },
      { kva: 0, three: false },
    );
    const i = s.three ? (s.kva * 1000) / (SQRT_3 * v) : (s.kva * 1000) / v;
    if (i >= currentA) {
      currentA = i;
      voltage = v;
    }
  }
  return { currentA, voltage, mixed: [...groups.keys()].filter((v) => v > 0).length > 1 };
}

export function equipmentLoadRatios(
  summary: LoadSummary,
  equipment: LoadEquipment,
): { transformerPct: number | null; generatorPct: number | null } {
  return {
    transformerPct: equipment.transformerKva > 0 ? (summary.demandKva / equipment.transformerKva) * 100 : null,
    generatorPct: equipment.generatorKw > 0 ? (summary.demandKw / equipment.generatorKw) * 100 : null,
  };
}

export type PhaseAnalysis = {
  kw: { r: number; s: number; t: number };
  amp: { r: number; s: number; t: number };
  imbalanceKwPct: number;
  imbalanceAmpPct: number;
  maxPhase: "R" | "S" | "T";
  minPhase: "R" | "S" | "T";
};

function pickExtreme(r: number, s: number, t: number, mode: "max" | "min"): "R" | "S" | "T" {
  if (mode === "max") {
    if (r >= s && r >= t) return "R";
    if (s >= t) return "S";
    return "T";
  }
  if (r <= s && r <= t) return "R";
  if (s <= t) return "S";
  return "T";
}

export function phaseAnalysis(rows: LoadRow[]): PhaseAnalysis {
  const kw = { r: 0, s: 0, t: 0 };
  const amp = { r: 0, s: 0, t: 0 };
  for (const row of rows) {
    const p = rowPowers(row);
    const pole = row.pole ?? (row.phase === "1" ? "R" : "RST");
    if (row.phase === "3" || pole === "RST") {
      kw.r += p.demandKw / 3;
      kw.s += p.demandKw / 3;
      kw.t += p.demandKw / 3;
      amp.r += p.currentA;
      amp.s += p.currentA;
      amp.t += p.currentA;
    } else if (pole === "R") {
      kw.r += p.demandKw;
      amp.r += p.currentA;
    } else if (pole === "S") {
      kw.s += p.demandKw;
      amp.s += p.currentA;
    } else {
      kw.t += p.demandKw;
      amp.t += p.currentA;
    }
  }
  const avgKw = (kw.r + kw.s + kw.t) / 3;
  const avgA = (amp.r + amp.s + amp.t) / 3;
  const imbalanceKwPct =
    avgKw === 0 ? 0 : (Math.max(Math.abs(kw.r - avgKw), Math.abs(kw.s - avgKw), Math.abs(kw.t - avgKw)) / avgKw) * 100;
  const imbalanceAmpPct =
    avgA === 0 ? 0 : (Math.max(Math.abs(amp.r - avgA), Math.abs(amp.s - avgA), Math.abs(amp.t - avgA)) / avgA) * 100;
  return {
    kw,
    amp,
    imbalanceKwPct,
    imbalanceAmpPct,
    maxPhase: pickExtreme(kw.r, kw.s, kw.t, "max"),
    minPhase: pickExtreme(kw.r, kw.s, kw.t, "min"),
  };
}

export function phaseDemandKw(rows: LoadRow[]): { r: number; s: number; t: number; imbalancePct: number } {
  const a = phaseAnalysis(rows);
  return { r: a.kw.r, s: a.kw.s, t: a.kw.t, imbalancePct: a.imbalanceKwPct };
}

/** 단상 부하만 가장 가벼운 상으로 옮기는 추천. 확정 배치가 아닙니다. */
export function suggestPhasePlacement(rows: LoadRow[]): { rows: LoadRow[]; changed: number } {
  const next = rows.map((row) => ({ ...row }));
  const kw = { R: 0, S: 0, T: 0 };
  for (const row of next) {
    if (row.phase === "1") continue;
    const p = rowPowers(row);
    kw.R += p.demandKw / 3;
    kw.S += p.demandKw / 3;
    kw.T += p.demandKw / 3;
  }
  const singles = next.filter((row) => row.phase === "1").sort((a, b) => rowPowers(b).demandKw - rowPowers(a).demandKw);
  let changed = 0;
  for (const row of singles) {
    const lightest: "R" | "S" | "T" = kw.R <= kw.S && kw.R <= kw.T ? "R" : kw.S <= kw.T ? "S" : "T";
    if (row.pole !== lightest) changed += 1;
    row.pole = lightest;
    kw[lightest] += rowPowers(row).demandKw;
  }
  return { rows: next, changed };
}

export function generatorHandoffFromLoads(rows: LoadRow[]): { staticKw: number; motorKw: number; upsKw: number; pf: number } {
  const motor = summarizeLoads(rows.filter((row) => categoryBucket(row.category) === "모터"));
  const ups = summarizeLoads(rows.filter((row) => categoryBucket(row.category) === "UPS"));
  const rest = summarizeLoads(
    rows.filter((row) => {
      const b = categoryBucket(row.category);
      return b !== "모터" && b !== "UPS";
    }),
  );
  const all = summarizeLoads(rows);
  return { staticKw: rest.demandKw, motorKw: motor.demandKw, upsKw: ups.demandKw, pf: all.pf };
}

export function rowHandoff(row: LoadRow) {
  const p = rowPowers(row);
  return {
    phase: row.phase,
    power: roundTo(p.connectedKw, 4),
    powerUnit: "kW" as const,
    voltage: roundTo(row.voltage, 4),
    pf: roundTo(row.pf, 4),
    efficiency: roundTo(row.efficiency, 4),
    current: roundTo(p.currentA, 4),
  };
}

export function panelHandoff(group: GroupSummary, sampleVoltage: number, samplePhase: "1" | "3") {
  return {
    phase: samplePhase,
    power: roundTo(group.demandKw, 4),
    powerUnit: "kW" as const,
    voltage: roundTo(sampleVoltage, 4),
    pf: roundTo(group.pf, 4),
    current: roundTo(group.currentA, 4),
  };
}

const INPUT_HEADERS = [
  "name",
  "category",
  "qty",
  "unitKw",
  "efficiency",
  "pf",
  "demand",
  "coincidence",
  "voltage",
  "phase",
  "pole",
  "panel",
  "remark",
];

export function exportLoadScheduleCsv(rows: LoadRow[], equipment: LoadEquipment): string {
  const summary = summarizeLoads(rows);
  const cats = summarizeByCategory(rows);
  const panels = summarizeByPanel(rows);
  const phases = phaseAnalysis(rows);
  const ratios = equipmentLoadRatios(summary, equipment);
  const input = toCsv(
    INPUT_HEADERS,
    rows.map((row) => [
      row.name,
      row.category,
      String(row.qty),
      String(row.unitKw),
      String(row.efficiency),
      String(row.pf),
      String(row.demand),
      String(row.coincidence),
      String(row.voltage),
      row.phase,
      row.pole ?? "RST",
      row.panel,
      row.remark,
    ]),
  );
  const computed = toCsv(
    ["name", "panel", "connectedKw", "inputKw", "demandKw", "demandKva", "demandKvar", "currentA"],
    rows.map((row) => {
      const p = rowPowers(row);
      return [
        row.name,
        row.panel,
        String(p.connectedKw),
        String(p.inputKw),
        String(p.demandKw),
        String(p.demandKva),
        String(p.demandKvar),
        String(p.currentA),
      ];
    }),
  );
  const summaryRows: string[][] = [
    ["total", "", String(summary.connectedKw), String(summary.demandKw), String(summary.demandKva), String(summary.currentA), String(summary.pf)],
    ...cats.map((c) => ["category", c.key, String(c.connectedKw), String(c.demandKw), String(c.demandKva), String(c.currentA), String(c.pf)]),
    ...panels.map((c) => ["panel", c.key, String(c.connectedKw), String(c.demandKw), String(c.demandKva), String(c.currentA), String(c.pf)]),
    ["phase", "R", "", String(phases.kw.r), "", String(phases.amp.r), ""],
    ["phase", "S", "", String(phases.kw.s), "", String(phases.amp.s), ""],
    ["phase", "T", "", String(phases.kw.t), "", String(phases.amp.t), ""],
    ["imbalanceKwPct", "", "", String(phases.imbalanceKwPct), "", "", ""],
    ["transformerKva", "", String(equipment.transformerKva), "", "", "", ""],
    ["generatorKw", "", String(equipment.generatorKw), "", "", "", ""],
    ["transformerLoadPct", "", ratios.transformerPct == null ? "" : String(ratios.transformerPct), "", "", "", ""],
    ["generatorLoadPct", "", ratios.generatorPct == null ? "" : String(ratios.generatorPct), "", "", "", ""],
  ];
  const summaryCsv = toCsv(["kind", "key", "connectedKw", "demandKw", "demandKva", "currentA", "pf"], summaryRows);
  return ["# Ampory Load Schedule", "# SECTION:INPUT", input, "# SECTION:COMPUTED", computed, "# SECTION:SUMMARY", summaryCsv].join("\n");
}

function headerKind(header: string[]): "input" | "computed" | "summary" | "unknown" {
  const h = header.map((x) => x.trim().toLowerCase());
  if (h.includes("kind") && h.includes("key")) return "summary";
  if (h.includes("unitkw") || h.includes("qty")) return "input";
  if (h.includes("connectedkw") || h.includes("inputkw")) return "computed";
  return "unknown";
}

export function loadRowsFromCsv(text: string): CsvImportResult {
  const errors: CsvImportError[] = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  let inComputed = false;
  let inSummary = false;
  let header: string[] | null = null;
  const rows: LoadRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const raw = lines[i];
    if (!raw.trim()) continue;
    if (raw.trim().startsWith("#")) {
      const mark = raw.trim().toUpperCase();
      if (mark.includes("SECTION:COMPUTED")) {
        inComputed = true;
        inSummary = false;
        header = null;
      } else if (mark.includes("SECTION:SUMMARY")) {
        inSummary = true;
        inComputed = false;
        header = null;
      } else if (mark.includes("SECTION:INPUT")) {
        inComputed = false;
        inSummary = false;
        header = null;
      }
      continue;
    }
    if (inComputed || inSummary) continue;
    const cols = parseCsv(raw)[0] ?? [];
    if (!header) {
      const kind = headerKind(cols);
      if (kind === "computed") {
        inComputed = true;
        continue;
      }
      if (kind === "summary") {
        inSummary = true;
        continue;
      }
      header = cols.map((h) => h.trim().toLowerCase());
      continue;
    }
    const idx = (name: string) => header!.indexOf(name);
    const get = (name: string, fallback = "") => {
      const iCol = idx(name);
      return iCol >= 0 ? (cols[iCol] ?? fallback).trim() : fallback;
    };
    const fieldErrors: string[] = [];
    const readNum = (name: string, fallback: number, label: string, opts?: { min?: number; max?: number; gt?: number }) => {
      const rawVal = get(name);
      if (rawVal === "") return fallback;
      const n = Number(rawVal);
      if (!Number.isFinite(n)) {
        fieldErrors.push(`${label}이(가) 숫자가 아닙니다`);
        return fallback;
      }
      if (opts?.gt !== undefined && !(n > opts.gt)) fieldErrors.push(`${label}은(는) ${opts.gt}보다 커야 합니다`);
      if (opts?.min !== undefined && n < opts.min) fieldErrors.push(`${label}은(는) ${opts.min} 이상이어야 합니다`);
      if (opts?.max !== undefined && n > opts.max) fieldErrors.push(`${label}은(는) ${opts.max} 이하여야 합니다`);
      return n;
    };
    const qty = readNum("qty", 1, "수량", { min: 0 });
    const unitKw = readNum("unitkw", 0, "단위용량", { min: 0 });
    const efficiency = readNum("efficiency", 1, "효율", { gt: 0, max: 1 });
    const pf = readNum("pf", 0.85, "역률", { gt: 0, max: 1 });
    const demand = readNum("demand", 1, "수용률", { gt: 0, max: 1 });
    const coincidence = readNum("coincidence", 1, "동시사용률", { gt: 0, max: 1 });
    const voltage = readNum("voltage", 380, "전압", { gt: 0 });
    const phaseRaw = get("phase", "3");
    if (phaseRaw && phaseRaw !== "1" && phaseRaw !== "3") fieldErrors.push("상은 1 또는 3이어야 합니다");
    const phase = phaseRaw === "1" ? "1" : "3";
    const poleRaw = get("pole", phase === "1" ? "R" : "RST").toUpperCase();
    if (poleRaw && !["R", "S", "T", "RST", "L1", "L2", "L3"].includes(poleRaw)) {
      fieldErrors.push("극은 R/S/T/RST 또는 L1/L2/L3이어야 합니다");
    }
    const poleMap: Record<string, LoadRow["pole"]> = { L1: "R", L2: "S", L3: "T" };
    const pole = poleMap[poleRaw] ?? (poleRaw === "S" || poleRaw === "T" || poleRaw === "R" ? poleRaw : "RST");
    if (fieldErrors.length) errors.push({ line: lineNo, message: fieldErrors.join(". ") });
    rows.push({
      id: crypto.randomUUID(),
      name: get("name"),
      category: get("category", "모터") || "모터",
      qty,
      unitKw,
      efficiency,
      pf,
      demand,
      coincidence,
      voltage,
      phase,
      pole: phase === "3" ? "RST" : pole,
      panel: get("panel", "MCC-1") || "MCC-1",
      remark: get("remark"),
    });
  }

  return { rows, errors };
}

export type CableRow = {
  id: string;
  tag: string;
  from: string;
  to: string;
  load: string;
  voltage: number;
  current: number;
  cableType: string;
  cores: string;
  size: string;
  length: number;
  vdPct: number;
  route: string;
  remark: string;
};

export type PanelRow = {
  id: string;
  circuit: string;
  name: string;
  phase: "R" | "S" | "T" | "RST";
  kw: number;
  current: number;
  breaker: string;
  cable: string;
  remark: string;
  panel?: string;
  sourceLoadId?: string;
  voltage?: number;
};

export function panelRowsFromLoads(loads: LoadRow[], panelFilter?: string): PanelRow[] {
  const source = panelFilter ? loads.filter((row) => row.panel === panelFilter) : loads;
  return source.map((row, index) => {
    const p = rowPowers(row);
    const phase: PanelRow["phase"] =
      row.phase === "3" ? "RST" : row.pole === "S" || row.pole === "T" || row.pole === "R" ? row.pole : "R";
    return {
      id: crypto.randomUUID(),
      circuit: String(index + 1).padStart(2, "0"),
      name: row.name || `부하 ${index + 1}`,
      phase,
      kw: roundTo(p.demandKw, 4),
      current: roundTo(p.currentA, 3),
      breaker: "",
      cable: "",
      remark: row.remark || "정격 검토 참고 — 추가 확인 필요",
      panel: row.panel,
      sourceLoadId: row.id,
      voltage: row.voltage,
    };
  });
}

export function cableRowsFromLoads(loads: LoadRow[], panelFilter?: string): CableRow[] {
  const source = panelFilter ? loads.filter((row) => row.panel === panelFilter) : loads;
  return source.map((row, index) => {
    const p = rowPowers(row);
    return {
      id: crypto.randomUUID(),
      tag: `C-${String(index + 1).padStart(2, "0")}`,
      from: row.panel,
      to: row.name || `부하 ${index + 1}`,
      load: row.name || `부하 ${index + 1}`,
      voltage: row.voltage,
      current: roundTo(p.currentA, 3),
      cableType: "CV",
      cores: row.phase === "1" ? "2C+E" : "3C+E",
      size: "",
      length: 0,
      vdPct: 0,
      route: "",
      remark: "검토 케이블 — 굵기 미확정",
    };
  });
}

export function phaseImbalance(rows: PanelRow[]): { ir: number; is: number; it: number; imbalancePct: number } {
  let ir = 0;
  let is_ = 0;
  let it = 0;
  for (const row of rows) {
    if (row.phase === "R") ir += row.current;
    else if (row.phase === "S") is_ += row.current;
    else if (row.phase === "T") it += row.current;
    else {
      const third = row.current;
      ir += third;
      is_ += third;
      it += third;
    }
  }
  const avg = (ir + is_ + it) / 3;
  const imbalancePct = avg === 0 ? 0 : (Math.max(Math.abs(ir - avg), Math.abs(is_ - avg), Math.abs(it - avg)) / avg) * 100;
  return { ir, is: is_, it, imbalancePct };
}

export type FlowBus = { id: string; loadKw: number; loadKvar: number };
export type FlowBranch = { from: string; to: string; r: number; x: number };

export type FlowResult = {
  ok: true;
  buses: { id: string; vPu: number; vPct: number; pKw: number; qKvar: number }[];
  branches: { from: string; to: string; iA: number; lossKw: number }[];
  totalLossKw: number;
} | { ok: false; error: string };

/**
 * 방사형 1개 소스(첫 버스)  DistFlow 근사.
 * V_to² ≈ V_from² − 2(R P + X Q), I ≈ S / (√3 V)
 */
export function radialLoadFlow(buses: FlowBus[], branches: FlowBranch[], vBaseV: number): FlowResult {
  if (buses.length === 0) return { ok: false, error: "버스를 한 개 이상 입력하세요." };
  if (vBaseV <= 0) return { ok: false, error: "기준 전압이 필요합니다." };
  const byId = new Map(buses.map((b) => [b.id, b]));
  const children = new Map<string, FlowBranch[]>();
  const incoming = new Set<string>();
  for (const br of branches) {
    if (!byId.has(br.from) || !byId.has(br.to)) {
      return { ok: false, error: `분기 ${br.from}→${br.to}의 버스가 없습니다.` };
    }
    if (br.from === br.to) return { ok: false, error: "자기 루프는 지원하지 않습니다." };
    const list = children.get(br.from) ?? [];
    list.push(br);
    children.set(br.from, list);
    incoming.add(br.to);
  }
  const roots = buses.filter((b) => !incoming.has(b.id));
  if (roots.length !== 1) {
    return { ok: false, error: "방사형만 지원합니다. 소스 버스가 정확히 하나여야 합니다." };
  }
  const root = roots[0].id;
  const parent = new Map<string, string>();
  const order: string[] = [];
  const stack = [root];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) return { ok: false, error: "루프가 있어 방사형 조류를 풀 수 없습니다." };
    seen.add(id);
    order.push(id);
    for (const br of children.get(id) ?? []) {
      parent.set(br.to, id);
      stack.push(br.to);
    }
  }
  if (seen.size !== buses.length) {
    return { ok: false, error: "소스에서 도달하지 않는 버스가 있습니다." };
  }

  const pFlow = new Map<string, number>();
  const qFlow = new Map<string, number>();
  for (const id of [...order].reverse()) {
    const bus = byId.get(id)!;
    let p = bus.loadKw;
    let q = bus.loadKvar;
    for (const br of children.get(id) ?? []) {
      p += pFlow.get(br.to) ?? 0;
      q += qFlow.get(br.to) ?? 0;
    }
    pFlow.set(id, p);
    qFlow.set(id, q);
  }

  const v = new Map<string, number>();
  v.set(root, vBaseV);
  const branchesRes: { from: string; to: string; iA: number; lossKw: number }[] = [];
  let totalLoss = 0;
  for (const id of order) {
    for (const br of children.get(id) ?? []) {
      const vf = v.get(br.from) ?? vBaseV;
      const p = (pFlow.get(br.to) ?? 0) * 1000;
      const q = (qFlow.get(br.to) ?? 0) * 1000;
      const v2 = Math.max(vf * vf - 2 * (br.r * p + br.x * q), (0.5 * vBaseV) ** 2);
      const vt = Math.sqrt(v2);
      v.set(br.to, vt);
      const s = Math.hypot(p, q);
      const i = vf > 0 ? s / (SQRT_3 * vf) : 0;
      const loss = ((i * i * br.r) / 1000);
      totalLoss += loss;
      branchesRes.push({ from: br.from, to: br.to, iA: i, lossKw: loss });
    }
  }

  return {
    ok: true,
    buses: buses.map((b) => {
      const vv = v.get(b.id) ?? vBaseV;
      return { id: b.id, vPu: vv / vBaseV, vPct: (vv / vBaseV) * 100, pKw: b.loadKw, qKvar: b.loadKvar };
    }),
    branches: branchesRes,
    totalLossKw: totalLoss,
  };
}

export function toCsv(headers: string[], rows: string[][]): string {
  const esc = (c: string) => {
    if (/[",\n]/.test(c)) return `"${c.replace(/"/g, '""')}"`;
    return c;
  };
  return [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
}

export function parseCsv(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  });
}
