export type SelectOption = { value: string; label: string };

export type FieldDef = {
  id: string;
  label: string;
  hint?: string;
  kind: "number" | "select";
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

export const formSchemas: Record<string, FormSchema> = {
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
    defaults: { ratedKva: "1000", loadMode: "kw", loadKw: "720", loadKva: "800", pf: "0.9" },
    fields: [
      { id: "ratedKva", label: "정격 용량 kVA", kind: "number", required: true, min: 0, step: "any" },
      {
        id: "loadMode",
        label: "부하 입력",
        kind: "select",
        options: [
          { value: "kw", label: "유효전력 kW + 역률" },
          { value: "kva", label: "피상전력 kVA" },
        ],
      },
      { id: "loadKw", label: "부하 유효전력 kW", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["kw"] } },
      { id: "pf", label: "역률 PF", kind: "number", min: 0, max: 1, step: "0.01", visibleWhen: { field: "loadMode", values: ["kw"] } },
      { id: "loadKva", label: "부하 kVA", kind: "number", min: 0, step: "any", visibleWhen: { field: "loadMode", values: ["kva"] } },
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
        label: "편도 길이",
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
      },
      { id: "voltage", label: "기준 전압", kind: "number", required: true, min: 0, step: "any", unitField: "voltageUnit", units: voltageUnits },
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
    defaults: { current: "87", margin: "1.25" },
    fields: [
      { id: "current", label: "부하전류 A", kind: "number", required: true, min: 0, step: "any" },
      { id: "margin", label: "여유율", kind: "number", min: 1, max: 3, step: "0.05", hint: "연속 부하에 1.25를 쓰는 실무가 있으나 규정이 아닙니다." },
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
    ],
  },
  "ups-capacity": {
    slug: "ups-capacity",
    layout: "simple",
    defaults: { loadKw: "40", pf: "0.9", growth: "0.2", outputPf: "0.9" },
    fields: [
      { id: "loadKw", label: "부하 유효전력 kW", kind: "number", required: true, min: 0, step: "any" },
      { id: "pf", label: "부하 역률", kind: "number", min: 0, max: 1, step: "0.01" },
      { id: "growth", label: "장래 여유 (소수)", kind: "number", min: 0, max: 2, step: "0.05", hint: "20%면 0.2" },
      { id: "outputPf", label: "UPS 정격 출력 역률", kind: "number", min: 0, max: 1, step: "0.01", advanced: true },
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
