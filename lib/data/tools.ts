import type { CalculatorTool } from "@/lib/types";
import { extraTools } from "@/lib/data/tools-extra";
import { formSchemas } from "@/lib/calculations/schemas";

export const baseTools: CalculatorTool[] = [
  {
    id: "tool-single-phase-current",
    slug: "single-phase-current",
    href: "/tools/electrical/single-phase-current",
    categoryId: "cat-electrical-basics",
    domain: "electrical",
    name: "단상 부하전류 계산기",
    nameEn: "Single-phase load current calculator",
    description: "단상 유효전력, 전압, 역률, 효율로 부하전류를 계산합니다.",
    longDescription:
      "단상 전열, 조명, 소형 동력의 정상 운전 전류를 산정합니다. 결과는 참고용 부하전류이며 차단기나 케이블 선정의 최종 기준이 아닙니다.",
    formulaId: "formula-single-phase-current",
    tags: ["단상", "전류", "부하", "A", "kW"],
    synonyms: ["단상전류", "single phase current", "1상 전류", "load current", "I=P/V"],
    relatedToolIds: [
      "tool-three-phase-current",
      "tool-power-factor",
      "tool-voltage-drop",
      "tool-kw-kva-hp",
    ],
    relatedArticleIds: ["art-single-vs-three", "art-kw-vs-kva"],
    complexity: "basic",
    featured: true,
    recentlyAdded: false,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "역률을 모르면 어떻게 하나요?",
        answer:
          "저항성 전열·백열 부하는 1.0에 가깝습니다. 모터나 전자식 부하는 명판 역률을 사용하세요. 모르면 0.8~0.85를 가정하되, 결과를 설계 확정값으로 쓰지 마세요.",
      },
      {
        question: "효율은 언제 입력하나요?",
        answer:
          "모터처럼 기계 출력을 입력하는 경우에만 효율을 반영합니다. 전기 입력 전력을 이미 알고 있으면 효율은 1.0으로 두세요.",
      },
    ],
  },
  {
    id: "tool-three-phase-current",
    slug: "three-phase-current",
    href: "/tools/electrical/three-phase-current",
    categoryId: "cat-electrical-basics",
    domain: "electrical",
    name: "3상 부하전류 계산기",
    nameEn: "Three-phase load current calculator",
    description: "3상 선간전압과 유효전력으로 선전류를 계산합니다.",
    longDescription:
      "3상 평형 부하의 선전류 I = P / (√3 × V × PF × η)를 계산합니다. 변압기, 모터, 수전반 부하 검토의 출발점으로 사용합니다.",
    formulaId: "formula-three-phase-current",
    tags: ["3상", "전류", "선전류", "380V", "440V"],
    synonyms: [
      "삼상전류",
      "3상 전류",
      "three phase current",
      "선전류",
      "부하전류",
      "load current",
    ],
    relatedToolIds: [
      "tool-single-phase-current",
      "tool-transformer-load",
      "tool-voltage-drop",
      "tool-power-factor",
    ],
    relatedArticleIds: ["art-single-vs-three", "art-transformer-load"],
    complexity: "basic",
    featured: true,
    recentlyAdded: false,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "380 V와 400 V 중 무엇을 넣나요?",
        answer:
          "실제 사용 선간전압을 넣습니다. 한국 저압 동력은 380 V가 흔하고, IEC 공칭은 400 V인 경우가 있습니다.",
      },
    ],
  },
  {
    id: "tool-kw-kva-hp",
    slug: "kw-kva-hp",
    href: "/tools/electrical/kw-kva-hp",
    categoryId: "cat-electrical-basics",
    domain: "electrical",
    name: "kW / kVA / HP 환산기",
    nameEn: "kW / kVA / HP converter",
    description: "유효전력, 피상전력, 마력을 역률과 함께 변환합니다.",
    longDescription:
      "kW, kVA, HP 사이의 단위 환산을 수행합니다. 1 HP = 0.746 kW(기계적 마력)를 사용하며, 역률을 입력하면 피상전력을 함께 계산합니다.",
    formulaId: "formula-kw-kva-hp",
    tags: ["kW", "kVA", "HP", "환산", "마력"],
    synonyms: ["킬로와트", "킬로볼트암페어", "마력", "horsepower", "converter", "단위변환"],
    relatedToolIds: ["tool-power-factor", "tool-three-phase-current", "tool-transformer-load"],
    relatedArticleIds: ["art-kw-vs-kva", "art-power-factor-poor"],
    complexity: "basic",
    featured: true,
    recentlyAdded: false,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "모터 10 HP는 전기 용량이 얼마인가요?",
        answer:
          "출력 10 HP ≈ 7.46 kW입니다. 입력 kW는 효율로 나누고, 변압기·MCC 용량은 역률을 나눈 kVA를 검토해야 합니다.",
      },
    ],
  },
  {
    id: "tool-power-factor",
    slug: "power-factor",
    href: "/tools/electrical/power-factor",
    categoryId: "cat-power-quality",
    domain: "electrical",
    name: "역률 계산기",
    nameEn: "Power factor calculator",
    description: "kW와 kVA, 또는 전압·전류로부터 역률과 무효전력을 구합니다.",
    longDescription:
      "유효전력과 피상전력의 비로 역률을 계산하고, 무효전력 크기를 함께 표시합니다. 전력량계 값 또는 전압·전류 측정값으로 계산할 수 있습니다.",
    formulaId: "formula-power-factor",
    tags: ["역률", "PF", "무효전력", "kvar"],
    synonyms: ["power factor", "cosφ", "코사인파이", "역률개선", "무효전력"],
    relatedToolIds: ["tool-kw-kva-hp", "tool-transformer-load", "tool-three-phase-current"],
    relatedArticleIds: ["art-power-factor-poor", "art-kw-vs-kva"],
    complexity: "basic",
    featured: true,
    recentlyAdded: false,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "좋은 역률의 기준은 무엇인가요?",
        answer:
          "사업장과 계약 조건에 따라 다릅니다. 많은 수전 설비에서 0.9 이상을 목표로 하며, 과보상(진상)도 문제가 됩니다.",
      },
    ],
  },
  {
    id: "tool-transformer-load",
    slug: "transformer-load",
    href: "/tools/electrical/transformer-load",
    categoryId: "cat-transformer",
    domain: "electrical",
    name: "변압기 용량·부하율 계산기",
    nameEn: "Transformer capacity and load ratio calculator",
    description: "정격 kVA 대비 설계 부하 또는 현장 측정 전압·전류로 부하율과 여유 용량을 산정합니다.",
    longDescription:
      "설계 계산(kW 또는 kVA)과 현장 측정(전압·전류) 모드를 제공합니다. R/S/T가 있으면 평균전류 기반 추정 부하와 최대상 전류를 보여 줍니다. 온도·고조파 derating은 포함하지 않습니다.",
    formulaId: "formula-transformer-load",
    tags: ["변압기", "부하율", "kVA", "TR"],
    synonyms: ["변압기 부하율", "transformer load", "변압기용량", "TR 부하", "부하율 계산"],
    relatedToolIds: [
      "tool-three-phase-current",
      "tool-transformer-sizing",
      "tool-field-compare",
      "tool-phase-unbalance",
      "tool-load-schedule",
    ],
    relatedArticleIds: ["art-transformer-load", "art-kw-vs-kva"],
    complexity: "intermediate",
    featured: true,
    recentlyAdded: false,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "적정 부하율은 얼마인가요?",
        answer:
          "프로젝트 운영기준과 제조사·냉각조건을 확인하세요. Ampory가 부하율 구간을 합격/경고로 나누지 않습니다.",
      },
    ],
  },
  {
    id: "tool-voltage-drop",
    slug: "voltage-drop",
    href: "/tools/electrical/voltage-drop",
    categoryId: "cat-cable",
    domain: "electrical",
    name: "전압강하 계산기",
    nameEn: "Voltage drop calculator",
    description: "전류, 길이, 도체 저항으로 단상·3상 전압강하를 근사 계산합니다.",
    longDescription:
      "저항 기반 근사식으로 전압강하(V)와 전압강하율(%)을 계산합니다. 단면적·재질 입력 또는 Ω/km 직접 입력을 지원합니다.",
    formulaId: "formula-voltage-drop",
    tags: ["전압강하", "케이블", "VD", "전선"],
    synonyms: ["voltage drop", "전압 강하", "선로전압강하", "케이블 전압강하", "VD%"],
    relatedToolIds: [
      "tool-three-phase-current",
      "tool-single-phase-current",
      "tool-cable-resistance",
    ],
    relatedArticleIds: ["art-voltage-drop", "art-cable-sizing"],
    complexity: "intermediate",
    featured: true,
    recentlyAdded: false,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "전압강하 허용치는 얼마인가요?",
        answer:
          "기본 계산은 허용 %를 강제하지 않습니다. 수전 수용가면 KEC 232.3.9 검토를 켠 뒤 수전방식·부하종류를 넣을 수 있습니다. 계산 구간이 인입구→기기 전체 경로와 같을 때만 구간 ΔV%와 표 232.3-1 허용 참고값을 비교합니다. 구간만 계산한 경우에는 비교하지 않습니다. 독립 자가발전기에는 해당하지 않습니다. 적합 판정이 아닙니다.",
      },
    ],
  },
  {
    id: "tool-cable-resistance",
    slug: "cable-resistance",
    href: "/tools/electrical/cable-resistance",
    categoryId: "cat-cable",
    domain: "electrical",
    name: "도체 저항 계산기",
    nameEn: "Conductor resistance calculator",
    description: "재질, 단면적, 길이로 도체 저항과 km당 저항을 계산합니다.",
    longDescription:
      "구리·알루미늄의 20°C 저항률 근사값으로 도체 저항을 계산합니다. 전압강하 계산의 입력값(Ω/km)을 준비할 때 사용합니다.",
    formulaId: "formula-cable-resistance",
    tags: ["케이블", "저항", "단면적", "구리", "알루미늄"],
    synonyms: ["전선 저항", "conductor resistance", "Ω/km", "케이블 사이즈"],
    relatedToolIds: ["tool-voltage-drop", "tool-three-phase-current"],
    relatedArticleIds: ["art-cable-sizing", "art-voltage-drop"],
    complexity: "basic",
    featured: false,
    recentlyAdded: true,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "이 값으로 케이블을 선정해도 되나요?",
        answer:
          "안 됩니다. 허용전류, 단락, 전압강하, 포설 방법, 온도를 함께 봐야 합니다. 이 계산은 저항 근사값만 제공합니다.",
      },
    ],
  },
  {
    id: "tool-breaker-current",
    slug: "breaker-current",
    href: "/tools/electrical/breaker-current",
    categoryId: "cat-breaker",
    domain: "electrical",
    name: "차단기 정격 참고 계산기",
    nameEn: "Breaker rating reference calculator",
    description: "임의 여유율 참고값과, 선택 입력 시 Ib / In / Iz / I₂ 숫자만 보여 줍니다.",
    longDescription:
      "기본은 부하전류 × 임의 여유율입니다. KEC 적합 판정이 아닙니다. In·Iz를 넣으면 숫자만 나란히 표시합니다. I₂는 제조사 기술사양 또는 제품표준에서 확인한 값만 받으며, 없으면 I₂ 조건은 미검토입니다.",
    formulaId: "formula-breaker-ref",
    tags: ["차단기", "MCCB", "정격전류", "In"],
    synonyms: ["MCCB", "ELB", "NFB", "breaker", "차단기 용량"],
    relatedToolIds: ["tool-three-phase-current", "tool-single-phase-current"],
    relatedArticleIds: ["art-mccb-vs-elb", "art-cable-sizing"],
    complexity: "intermediate",
    featured: false,
    recentlyAdded: true,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "계산 결과의 차단기를 그대로 선정해도 되나요?",
        answer:
          "아니요. 임의 여유율은 KEC 212.4.1 협조 조건이 아닙니다. 단락전류, 선택차단, Iz, 제조사 특성곡선을 확인하세요.",
      },
    ],
  },
  {
    id: "tool-ups-backup-time",
    slug: "ups-backup-time",
    href: "/tools/facility/ups-backup-time",
    categoryId: "cat-ups",
    domain: "facility",
    name: "UPS 백업시간 계산기",
    nameEn: "UPS backup time calculator",
    description: "배터리 전압·용량과 부하전력으로 추정 백업시간을 계산합니다.",
    longDescription:
      "배터리 공칭 에너지에 효율과 방전심도를 곱해 일정한 전력 부하에 대한 백업시간을 추정합니다. 제조사 런타임 테이블을 대체하지 않습니다.",
    formulaId: "formula-ups-backup",
    tags: ["UPS", "배터리", "백업시간", "Ah"],
    synonyms: ["UPS 시간", "battery runtime", "비상전원 시간", "축전지", "방전시간"],
    relatedToolIds: ["tool-ups-capacity", "tool-generator-load"],
    relatedArticleIds: ["art-ups-vs-generator", "art-transformer-load"],
    complexity: "intermediate",
    featured: true,
    recentlyAdded: false,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "DOD는 얼마로 넣나요?",
        answer:
          "연축전지는 0.5~0.8, 리튬은 제조사 권고를 따릅니다. 수명과 온도를 고려해 보수적으로 넣는 것이 안전합니다.",
      },
    ],
  },
  {
    id: "tool-ups-capacity",
    slug: "ups-capacity",
    href: "/tools/facility/ups-capacity",
    categoryId: "cat-ups",
    domain: "facility",
    name: "UPS 용량 계산기",
    nameEn: "UPS capacity calculator",
    description: "부하 kW, 역률, 여유율로 필요 UPS kVA를 산정합니다.",
    longDescription:
      "IT·설비 부하의 유효전력과 역률, 장래 여유, 출력 역률을 반영해 필요 UPS 용량(kVA)을 계산합니다. N+1 구성은 모듈 대수를 별도로 검토하세요.",
    formulaId: "formula-ups-capacity",
    tags: ["UPS", "kVA", "용량", "여유율"],
    synonyms: ["UPS 용량", "UPS sizing", "무정전전원", "인버터 용량"],
    relatedToolIds: ["tool-ups-backup-time", "tool-kw-kva-hp", "tool-power-factor"],
    relatedArticleIds: ["art-ups-vs-generator", "art-kw-vs-kva"],
    complexity: "intermediate",
    featured: false,
    recentlyAdded: true,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "역률이 낮은 부하는 왜 kVA가 커지나요?",
        answer:
          "UPS는 전류(피상전력)를 감당해야 합니다. 같은 kW라도 역률이 낮으면 필요 kVA가 커집니다.",
      },
    ],
  },
  {
    id: "tool-generator-load",
    slug: "generator-load",
    href: "/tools/facility/generator-load",
    categoryId: "cat-generator",
    domain: "facility",
    name: "발전기 부하율 계산기",
    nameEn: "Generator load ratio calculator",
    description: "발전기 정격 대비 실부하 비율과 운전 구간 해석을 제공합니다.",
    longDescription:
      "프라임 또는 스탠바이 정격 kW와 실제 부하로 부하율을 계산합니다. 저부하와 과부하 구간에 대한 실무 주의를 함께 표시합니다.",
    formulaId: "formula-generator-load",
    tags: ["발전기", "부하율", "비상발전기", "kW"],
    synonyms: ["generator load", "비상발전기", "GEN 부하", "디젤발전기", "부하율"],
    relatedToolIds: ["tool-transformer-load", "tool-generator-load-test", "tool-generator-sizing"],
    relatedArticleIds: ["art-ups-vs-generator", "art-transformer-load"],
    complexity: "basic",
    featured: true,
    recentlyAdded: false,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "스탠바이와 프라임 정격의 차이는 무엇인가요?",
        answer:
          "스탠바이는 정전 시 제한 시간 운전용, 프라임은 변동 부하의 장시간 주전원용입니다. 정격 kW 값이 다르므로 명판 종류를 구분해 입력하세요.",
      },
    ],
  },
  {
    id: "tool-monthly-energy",
    slug: "monthly-energy",
    href: "/tools/facility/monthly-energy",
    categoryId: "cat-facility-ops",
    domain: "facility",
    name: "월간 전력사용량 비교",
    nameEn: "Monthly electricity consumption comparison",
    description: "두 달의 kWh, 최대수요, 추정 요금을 비교합니다.",
    longDescription:
      "기준 월과 비교 월의 전력량·최대수요를 비교하고, 선택적으로 일수 보정과 평균 단가를 적용합니다. 한전 요금 계산기가 아닙니다.",
    formulaId: "formula-monthly-energy",
    tags: ["전력량", "kWh", "요금", "비교", "EMS"],
    synonyms: [
      "전기사용량",
      "월간 비교",
      "전력소비",
      "electricity consumption",
      "에너지 비교",
      "검침",
    ],
    relatedToolIds: ["tool-energy-cost", "tool-retrofit-compare", "tool-trend-analysis"],
    relatedArticleIds: ["art-kw-vs-kva", "art-power-factor-poor"],
    complexity: "basic",
    featured: true,
    recentlyAdded: false,
    status: "published",
    updatedAt: "2026-08-20",
    faqs: [
      {
        question: "일수 보정은 언제 쓰나요?",
        answer:
          "검침 주기가 28일과 31일처럼 다를 때 사용합니다. 30일 기준으로 환산해 사용 강도 비교가 쉬워집니다.",
      },
    ],
  },
];

export const tools: CalculatorTool[] = [...baseTools, ...extraTools];

export function isElectricalWorkspaceTool(tool: { href: string; slug: string; domain: string }): boolean {
  return tool.domain === "electrical" && tool.href === `/tools/electrical/${tool.slug}` && Boolean(formSchemas[tool.slug]);
}

export function isFacilityWorkspaceTool(tool: { href: string; slug: string; domain: string }): boolean {
  return tool.domain === "facility" && tool.href === `/tools/facility/${tool.slug}` && Boolean(formSchemas[tool.slug]);
}

export function getToolById(id: string): CalculatorTool | undefined {
  return tools.find((tool) => tool.id === id);
}

export function getToolBySlug(slug: string): CalculatorTool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolByHref(href: string): CalculatorTool | undefined {
  return tools.find((tool) => tool.href === href);
}

export function getPublishedTools(): CalculatorTool[] {
  return tools.filter((tool) => tool.status === "published");
}

export function getFeaturedTools(): CalculatorTool[] {
  return getPublishedTools().filter((tool) => tool.featured);
}

export function getRecentlyAddedTools(): CalculatorTool[] {
  return getPublishedTools().filter((tool) => tool.recentlyAdded);
}

export function getToolsByDomain(domain: CalculatorTool["domain"]): CalculatorTool[] {
  return getPublishedTools().filter((tool) => tool.domain === domain);
}

export function getToolsByCategory(categoryId: string): CalculatorTool[] {
  return getPublishedTools().filter((tool) => tool.categoryId === categoryId);
}

export function getRelatedTools(tool: CalculatorTool): CalculatorTool[] {
  return tool.relatedToolIds
    .map((id) => getToolById(id))
    .filter((item): item is CalculatorTool => Boolean(item));
}
