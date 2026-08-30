import { extraFormSchemas } from "@/lib/calculations/schemas-extra";

export type SelectOption = { value: string; label: string };

export type FieldDef = {
  id: string;
  label: string;
  hint?: string;
  kind: "number" | "select" | "textarea" | "text";
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
  unitField?: string;
  units?: SelectOption[];
  options?: SelectOption[];
  advanced?: boolean;
  visibleWhen?: { field: string; values: string[] };
};

export type FormSchema = {
  slug: string;
  /** simple: 중앙 단일 패널(720–840px). complex: 입력 좌 / 결과 우 */
  layout: "simple" | "complex";
  fields: FieldDef[];
  defaults: Record<string, string>;
};

const powerUnits = [
  { value: "kW", label: "kW" },
  { value: "W", label: "W" },
  { value: "MW", label: "MW" },
  { value: "HP", label: "HP" },
];

const voltageUnits = [
  { value: "V", label: "V" },
  { value: "kV", label: "kV" },
];

export const baseFormSchemas: Record<string, FormSchema> = {
  "single-phase-current": {
    slug: "single-phase-current",
    layout: "simple",
    defaults: {
      power: "3",
      powerUnit: "kW",
      voltage: "220",
      voltageUnit: "V",
      pf: "1",
      efficiency: "1",
    },
    fields: [
      { id: "power", label: "유효전력", kind: "number", required: true, min: 0, step: "any", unitField: "powerUnit", units: powerUnits },
      { id: "voltage", label: "전압", kind: "number", required: true, min: 0, step: "any", unitField: "voltageUnit", units: voltageUnits },
      { id: "pf", label: "역률 PF", kind: "number", min: 0, max: 1, step: "0.01", hint: "모르면 전열 1.0, 모터 0.8~0.85" },
      { id: "efficiency", label: "효율 η", kind: "number", min: 0, max: 1, step: "0.01", advanced: true, hint: "전기 입력을 알고 있으면 1.0" },
    ],
  },
  "three-phase-current": {
    slug: "three-phase-current",
    layout: "simple",
    defaults: {
      power: "45",
      powerUnit: "kW",
      voltage: "380",
      voltageUnit: "V",
      pf: "0.85",
      efficiency: "0.92",
    },
    fields: [
      { id: "power", label: "유효전력", kind: "number", required: true, min: 0, step: "any", unitField: "powerUnit", units: powerUnits },
      { id: "voltage", label: "선간전압", kind: "number", required: true, min: 0, step: "any", unitField: "voltageUnit", units: voltageUnits, hint: "3상 선간전압 (예: 380 V)" },
      { id: "pf", label: "역률 PF", kind: "number", min: 0, max: 1, step: "0.01" },
      { id: "efficiency", label: "효율 η", kind: "number", min: 0, max: 1, step: "0.01", advanced: true },
    ],
  },
  "kw-kva-hp": {
    slug: "kw-kva-hp",
    layout: "simple",
    defaults: { mode: "from-kw", power: "30", powerUnit: "kW", kva: "37.5", hp: "40", pf: "0.8" },
    fields: [
      {
        id: "mode",
        label: "입력 기준",
        kind: "select",
        options: [
          { value: "from-kw", label: "유효전력(kW)에서 환산" },
          { value: "from-kva", label: "피상전력(kVA)에서 환산" },
          { value: "from-hp", label: "마력(HP)에서 환산" },
        ],
      },
      { id: "power", label: "유효전력", kind: "number", min: 0, step: "any", unitField: "powerUnit", units: powerUnits, visibleWhen: { field: "mode", values: ["from-kw"] } },
      { id: "kva", label: "피상전력 kVA", kind: "number", min: 0, step: "any", visibleWhen: { field: "mode", values: ["from-kva"] } },
      { id: "hp", label: "마력 HP", kind: "number", min: 0, step: "any", visibleWhen: { field: "mode", values: ["from-hp"] } },
      { id: "pf", label: "역률 PF", kind: "number", min: 0, max: 1, step: "0.01" },
    ],
  },
  "power-factor": {
    slug: "power-factor",
    layout: "complex",
    defaults: { mode: "from-power", kw: "80", kva: "100", phase: "3", voltage: "380", voltageUnit: "V", current: "160" },
    fields: [
      {
        id: "mode",
        label: "계산 방식",
        kind: "select",
        options: [
          { value: "from-power", label: "kW와 kVA" },
          { value: "from-vi", label: "유효전력과 전압·전류" },
        ],
      },
      { id: "kw", label: "유효전력 kW", kind: "number", required: true, min: 0, step: "any" },
      { id: "kva", label: "피상전력 kVA", kind: "number", min: 0, step: "any", visibleWhen: { field: "mode", values: ["from-power"] } },
      {
        id: "phase",
        label: "상",
        kind: "select",
        options: [
          { value: "3", label: "3상" },
          { value: "1", label: "단상" },
        ],
        visibleWhen: { field: "mode", values: ["from-vi"] },
      },
      { id: "voltage", label: "전압", kind: "number", min: 0, step: "any", unitField: "voltageUnit", units: voltageUnits, visibleWhen: { field: "mode", values: ["from-vi"] } },
      { id: "current", label: "전류 A", kind: "number", min: 0, step: "any", visibleWhen: { field: "mode", values: ["from-vi"] } },
    ],
  },
  "transformer-load": {
    slug: "transformer-load",
    layout: "complex",
    defaults: { ratedKva: "1000", loadMode: "kw", loadKw: "720", loadKva: "800", pf: "0.9", phase: "3", voltage: "380", current: "800", ir: "", is: "", it: "", ratedCurrent: "", designKva: "" },
    fields: [
      { id: "ratedKva", label: "정격 용량 kVA", kind: "number", required: true, min: 0, step: "any" },
      {
        id: "loadMode",
        label: "부하 입력",
        kind: "select",
        options: [
          { value: "kw", label: "설계 계산 · kW + 역률" },
          { value: "kva", label: "설계 계산 · kVA" },
          { value: "measured", label: "현장 측정 · 전압·전류" },
        ],
      },
      { id: "loadKw", label: "부하 유효전력 kW", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["kw"] } },
      { id: "pf", label: "역률 PF", kind: "number", min: 0, max: 1, step: "0.01", visibleWhen: { field: "loadMode", values: ["kw", "measured"] }, hint: "측정 모드에서 비우면 kW는 추정하지 않습니다." },
      { id: "loadKva", label: "부하 kVA", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["kva"] } },
      {
        id: "phase",
        label: "상",
        kind: "select",
        visibleWhen: { field: "loadMode", values: ["measured"] },
        options: [
          { value: "3", label: "3상" },
          { value: "1", label: "단상" },
        ],
      },
      { id: "voltage", label: "선간전압 V", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["measured"] }, hint: "3상은 선간전압. 상전압을 넣지 마세요." },
      { id: "current", label: "선전류 A (균형 가정)", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["measured"] }, hint: "상이 다르면 아래 R/S/T를 넣으세요." },
      { id: "ir", label: "R 상전류 A", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["measured"] } },
      { id: "is", label: "S 상전류 A", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["measured"] } },
      { id: "it", label: "T 상전류 A", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["measured"] } },
      { id: "ratedCurrent", label: "명판 정격전류 A (선택)", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["measured"] }, hint: "넣으면 최대상 전류 / 정격전류만 보여 줍니다. 자동 한도 판정이 아닙니다." },
      { id: "designKva", label: "부하표 예상 kVA (선택 비교)", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["measured"] }, hint: "Load Schedule 수요 kVA를 넣어 실측과 비교합니다." },
    ],
  },
  "voltage-drop": {
    slug: "voltage-drop",
    layout: "complex",
    defaults: {
      phase: "3",
      current: "80",
      length: "80",
      lengthUnit: "m",
      voltage: "380",
      voltageUnit: "V",
      rMode: "ohm",
      resistance: "0.727",
      resistanceUnit: "ohm/km",
      material: "cu",
      area: "35",
      kecReview: "off",
      kecScope: "utility",
      kecSupply: "lv",
      kecLoad: "other",
      kecPathSame: "yes",
      kecPathLength: "",
    },
    fields: [
      {
        id: "phase",
        label: "회로",
        kind: "select",
        options: [
          { value: "3", label: "3상" },
          { value: "1", label: "단상" },
        ],
      },
      { id: "current", label: "부하전류 A", kind: "number", required: true, min: 0, step: "any" },
      {
        id: "length",
        label: "계산 구간 편도 길이",
        kind: "number",
        required: true,
        min: 0,
        step: "any",
        unitField: "lengthUnit",
        units: [
          { value: "m", label: "m" },
          { value: "km", label: "km" },
          { value: "ft", label: "ft" },
        ],
        hint: "이 케이블 구간의 편도 길이. ΔV 계산에만 씁니다.",
      },
      {
        id: "voltage",
        label: "전압강하율 기준전압",
        kind: "number",
        required: true,
        min: 0,
        step: "any",
        unitField: "voltageUnit",
        units: voltageUnits,
        hint: "ΔV% 분모. 저압 수용가는 계량기 2차측, 고압 이상은 변압기 2차측. 3상 선간 계산은 선간전압(예: 380 V), 단상·상전압 계산은 그 회로 전압(예: 220 V).",
      },
      {
        id: "rMode",
        label: "저항 입력",
        kind: "select",
        options: [
          { value: "ohm", label: "Ω/km 직접 입력" },
          { value: "size", label: "재질·단면적으로 근사" },
        ],
      },
      {
        id: "resistance",
        label: "도체 저항",
        kind: "number",
        min: 0,
        step: "any",
        unitField: "resistanceUnit",
        units: [
          { value: "ohm/km", label: "Ω/km" },
          { value: "ohm/m", label: "Ω/m" },
        ],
        visibleWhen: { field: "rMode", values: ["ohm"] },
      },
      {
        id: "material",
        label: "도체 재질",
        kind: "select",
        options: [
          { value: "cu", label: "구리" },
          { value: "al", label: "알루미늄" },
        ],
        visibleWhen: { field: "rMode", values: ["size"] },
      },
      { id: "area", label: "단면적 mm²", kind: "number", min: 0, step: "any", visibleWhen: { field: "rMode", values: ["size"] } },
      { id: "allowPct", label: "사용자 허용 전압강하 % (선택)", kind: "number", min: 0, step: "any", hint: "비우면 사용자 허용과 비교하지 않습니다. KEC 표와는 별개입니다." },
      {
        id: "kecReview",
        label: "KEC 232.3.9 기준 검토",
        kind: "select",
        options: [
          { value: "off", label: "하지 않음 (전압강하만 계산)" },
          { value: "on", label: "검토 (수전 수용가 · 표 232.3-1)" },
        ],
        hint: "기본은 계산만 합니다. 3%·5%를 자동으로 붙이지 않습니다.",
      },
      {
        id: "kecScope",
        label: "적용 대상",
        kind: "select",
        options: [
          { value: "utility", label: "전력공급자로부터 수전하는 수용가" },
          { value: "island", label: "독립 자가발전기" },
        ],
        visibleWhen: { field: "kecReview", values: ["on"] },
        hint: "독립 자가발전기에는 KEC 232.3.9가 해당하지 않습니다.",
      },
      {
        id: "kecSupply",
        label: "수전방식",
        kind: "select",
        options: [
          { value: "lv", label: "저압 수전" },
          { value: "hv-plus", label: "고압 이상 수전" },
        ],
        visibleWhen: { field: "kecReview", values: ["on"] },
        hint: "고압 이상: 가능한 한 최종회로 내 전압강하는 저압 수전 유형의 값을 넘지 않도록 하는 것이 바람직합니다.",
      },
      {
        id: "kecLoad",
        label: "부하종류",
        kind: "select",
        options: [
          { value: "lighting", label: "조명" },
          { value: "other", label: "기타" },
          { value: "mixed", label: "혼합 / 별도 검토" },
        ],
        visibleWhen: { field: "kecReview", values: ["on"] },
        hint: "혼합은 조명·기타 중 하나를 자동으로 고르지 않습니다. 경로를 나눈다면 최종 조명 경로와 최종 기타 경로를 각각 검토하고, 공통 간선 ΔV는 양쪽에 넣습니다. 협회 문구를 바탕으로 한 구현 해석입니다.",
      },
      {
        id: "kecPathSame",
        label: "KEC 검토 경로 길이",
        kind: "select",
        options: [
          { value: "yes", label: "계산 구간 길이와 동일 (단일 구간)" },
          { value: "no", label: "인입구→기기 전체 경로를 따로 입력" },
        ],
        visibleWhen: { field: "kecReview", values: ["on"] },
        hint: "구간이 인입구→기기 전체와 같을 때만 구간 ΔV%와 허용 참고값을 비교합니다. 다르면 허용 %는 참고만 하고 비교하지 않습니다.",
      },
      {
        id: "kecPathLength",
        label: "KEC 검토 경로 길이 (인입구→기기)",
        kind: "number",
        min: 0,
        step: "any",
        visibleWhen: { field: "kecPathSame", values: ["no"] },
        hint: "수용가 설비 인입구부터 해당 기기까지. ΔV용 구간 길이와 다를 수 있습니다. 단위는 m.",
      },
    ],
  },
  "cable-resistance": {
    slug: "cable-resistance",
    layout: "simple",
    defaults: { material: "cu", area: "35", length: "100", lengthUnit: "m" },
    fields: [
      {
        id: "material",
        label: "재질",
        kind: "select",
        options: [
          { value: "cu", label: "구리" },
          { value: "al", label: "알루미늄" },
        ],
      },
      { id: "area", label: "단면적 mm²", kind: "number", required: true, min: 0, step: "any" },
      {
        id: "length",
        label: "편도 길이",
        kind: "number",
        required: true,
        min: 0,
        step: "any",
        unitField: "lengthUnit",
        units: [
          { value: "m", label: "m" },
          { value: "km", label: "km" },
        ],
      },
    ],
  },
  "breaker-current": {
    slug: "breaker-current",
    layout: "simple",
    defaults: { current: "87", margin: "1.25", loadType: "mixed", inRated: "", izCorrected: "", i2Conv: "", iscKa: "", icuKa: "" },
    fields: [
      { id: "current", label: "설계전류 Ib A", kind: "number", required: true, min: 0, step: "any", hint: "회로 설계전류. 아래 In·Iz와 비교할 때 씁니다." },
      { id: "margin", label: "임의 여유율 (참고)", kind: "number", min: 1, max: 3, step: "0.05", hint: "I×k 참고값입니다. KEC Ib≤In≤Iz와 같은 조건이 아닙니다." },
      { id: "inRated", label: "차단기 정격/설정전류 In A (선택)", kind: "number", min: 0, step: "any", hint: "넣으면 Ib/In/Iz 관계만 표시합니다. 적합 판정이 아닙니다." },
      { id: "izCorrected", label: "보정 후 도체 허용전류 Iz A (선택)", kind: "number", min: 0, step: "any", hint: "적용 표에서 확인한 값. 내장 표 없음." },
      {
        id: "i2Conv",
        label: "규약동작전류 I₂ A (선택)",
        kind: "number",
        min: 0,
        step: "any",
        hint: "보호장치가 규약시간 이내에 유효하게 동작하는 것을 보장하는 전류. 제조사 기술사양 또는 적용 제품표준에서 확인. 트립곡선으로 추정하지 마세요.",
      },
      {
        id: "loadType",
        label: "부하 종류",
        kind: "select",
        options: [
          { value: "mixed", label: "일반 혼합" },
          { value: "motor", label: "모터" },
          { value: "heater", label: "전열" },
          { value: "it", label: "IT/비선형" },
        ],
      },
      { id: "iscKa", label: "단락전류 kA (선택)", kind: "number", min: 0, step: "any", hint: "차단용량 비교용. 없으면 생략" },
      { id: "icuKa", label: "차단기 Icu kA (선택)", kind: "number", min: 0, step: "any" },
    ],
  },
  "ups-backup-time": {
    slug: "ups-backup-time",
    layout: "complex",
    defaults: {
      mode: "battery",
      batteryV: "384",
      ah: "100",
      energy: "38.4",
      energyUnit: "kWh",
      load: "20",
      loadUnit: "kW",
      efficiency: "0.92",
      dod: "0.8",
      aging: "1",
    },
    fields: [
      {
        id: "mode",
        label: "배터리 입력",
        kind: "select",
        options: [
          { value: "battery", label: "전압 × Ah" },
          { value: "energy", label: "에너지 kWh" },
        ],
      },
      { id: "batteryV", label: "배터리 공칭전압 V", kind: "number", min: 0, step: "any", visibleWhen: { field: "mode", values: ["battery"] } },
      { id: "ah", label: "용량 Ah", kind: "number", min: 0, step: "any", visibleWhen: { field: "mode", values: ["battery"] } },
      {
        id: "energy",
        label: "배터리 에너지",
        kind: "number",
        min: 0,
        step: "any",
        unitField: "energyUnit",
        units: [
          { value: "kWh", label: "kWh" },
          { value: "Wh", label: "Wh" },
        ],
        visibleWhen: { field: "mode", values: ["energy"] },
      },
      {
        id: "load",
        label: "부하전력",
        kind: "number",
        required: true,
        min: 0,
        step: "any",
        unitField: "loadUnit",
        units: [
          { value: "kW", label: "kW" },
          { value: "W", label: "W" },
        ],
      },
      { id: "efficiency", label: "변환 효율", kind: "number", min: 0, max: 1, step: "0.01" },
      { id: "dod", label: "방전심도 DOD", kind: "number", min: 0, max: 1, step: "0.01", hint: "연축전지 0.5~0.8 범위가 흔합니다." },
      { id: "aging", label: "노화 보정 (선택)", kind: "number", min: 0, max: 1, step: "0.01", advanced: true },
    ],
  },
  "ups-capacity": {
    slug: "ups-capacity",
    layout: "complex",
    defaults: { mode: "basic", loadKw: "40", pf: "0.9", growth: "0.2", outputPf: "0.9", efficiency: "0.92", dcV: "384", hours: "0.25", cellV: "12", moduleAh: "100", dod: "0.8", aging: "0.8" },
    fields: [
      { id: "mode", label: "계산 모드", kind: "select", options: [{ value: "basic", label: "기본 계산" }, { value: "detailed", label: "상세 계산" }] },
      { id: "loadKw", label: "부하 유효전력 kW", kind: "number", required: true, min: 0, step: "any" },
      { id: "pf", label: "부하 역률", kind: "number", min: 0, max: 1, step: "0.01" },
      { id: "growth", label: "장래 여유 (소수)", kind: "number", min: 0, max: 2, step: "0.05", hint: "20%면 0.2" },
      { id: "outputPf", label: "UPS 정격 출력 역률", kind: "number", min: 0, max: 1, step: "0.01", advanced: true },
      { id: "efficiency", label: "인버터 효율 (배터리 수지)", kind: "number", min: 0, max: 1, step: "0.01", advanced: true },
      { id: "dcV", label: "DC 전압 V", kind: "number", min: 0, step: "any", advanced: true },
      { id: "hours", label: "목표 백업 h", kind: "number", min: 0, step: "any", advanced: true, hint: "에너지 수지. 제조사 곡선이 아님" },
      { id: "dod", label: "DOD", kind: "number", min: 0, max: 1, step: "0.01", advanced: true },
      { id: "aging", label: "노화 보정", kind: "number", min: 0, max: 1, step: "0.01", advanced: true },
      { id: "cellV", label: "셀(모듈) 전압 V", kind: "number", min: 0, step: "any", advanced: true },
      { id: "moduleAh", label: "모듈 Ah", kind: "number", min: 0, step: "any", advanced: true },
    ],
  },
  "generator-load": {
    slug: "generator-load",
    layout: "complex",
    defaults: { ratingType: "prime", ratedMode: "kw", ratedKw: "500", ratedKva: "625", pf: "0.8", loadKw: "320" },
    fields: [
      {
        id: "ratingType",
        label: "정격 종류",
        kind: "select",
        options: [
          { value: "prime", label: "프라임 / 연속" },
          { value: "standby", label: "스탠바이" },
        ],
      },
      {
        id: "ratedMode",
        label: "정격 입력",
        kind: "select",
        options: [
          { value: "kw", label: "kW" },
          { value: "kva", label: "kVA + 역률" },
        ],
      },
      { id: "ratedKw", label: "정격 출력 kW", kind: "number", min: 0, step: "any", visibleWhen: { field: "ratedMode", values: ["kw"] } },
      { id: "ratedKva", label: "정격 kVA", kind: "number", min: 0, step: "any", visibleWhen: { field: "ratedMode", values: ["kva"] } },
      { id: "pf", label: "정격 역률", kind: "number", min: 0, max: 1, step: "0.01" },
      { id: "loadKw", label: "실부하 kW", kind: "number", required: true, min: 0, step: "any" },
    ],
  },
  "monthly-energy": {
    slug: "monthly-energy",
    layout: "complex",
    defaults: {
      energy1: "12000",
      days1: "31",
      energy2: "15000",
      days2: "28",
      price: "140",
      demand1: "85",
      demand2: "92",
      normalize: "yes",
    },
    fields: [
      { id: "energy1", label: "기준 월 사용량 kWh", kind: "number", required: true, min: 0, step: "any" },
      { id: "days1", label: "기준 월 일수", kind: "number", min: 1, max: 31, step: "1" },
      { id: "energy2", label: "비교 월 사용량 kWh", kind: "number", required: true, min: 0, step: "any" },
      { id: "days2", label: "비교 월 일수", kind: "number", min: 1, max: 31, step: "1" },
      {
        id: "normalize",
        label: "일수 보정",
        kind: "select",
        options: [
          { value: "yes", label: "30일 기준으로 환산" },
          { value: "no", label: "원시 검침값 비교" },
        ],
      },
      { id: "price", label: "평균 단가 원/kWh", kind: "number", min: 0, step: "any", hint: "선택. 기본요금은 포함하지 않습니다." },
      { id: "demand1", label: "기준 월 최대수요 kW", kind: "number", min: 0, step: "any", advanced: true },
      { id: "demand2", label: "비교 월 최대수요 kW", kind: "number", min: 0, step: "any", advanced: true },
    ],
  },
};

export const formSchemas: Record<string, FormSchema> = {
  ...baseFormSchemas,
  ...extraFormSchemas,
};
