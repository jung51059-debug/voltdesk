import type { ToolCategory } from "@/lib/types";

export const categories: ToolCategory[] = [
  {
    id: "cat-electrical-basics",
    slug: "electrical-basics",
    domain: "electrical",
    name: "전기 기본 계산",
    nameEn: "Electrical basics",
    description: "단상·3상 전류와 kW/kVA/HP 환산 등 현장에서 가장 먼저 쓰는 계산입니다.",
    icon: "Zap",
    order: 1,
  },
  {
    id: "cat-cable",
    slug: "cable",
    domain: "electrical",
    name: "케이블 / 배선",
    nameEn: "Cable and wiring",
    description: "굵기 1차 검토, 단일·경로 전압강하, 도체 저항, 병렬·허용전류 비교를 모았습니다.",
    icon: "Cable",
    order: 2,
  },
  {
    id: "cat-transformer",
    slug: "transformer",
    domain: "electrical",
    name: "변압기",
    nameEn: "Transformers",
    description: "필요 용량, 부하율, 1·2차 전류, 손실, 병렬 분담을 검토합니다.",
    icon: "Box",
    order: 3,
  },
  {
    id: "cat-motor",
    slug: "motor",
    domain: "electrical",
    name: "모터",
    nameEn: "Motors",
    description: "정격전류, 기동 계산, 가속시간 참고 계산입니다.",
    icon: "Cog",
    order: 4,
  },
  {
    id: "cat-breaker",
    slug: "protection",
    domain: "electrical",
    name: "보호 / 차단기",
    nameEn: "Protection and breakers",
    description: "차단기 정격 검토 참고와 보호계전기 IEC 반한시 동작시간입니다.",
    icon: "ToggleLeft",
    order: 5,
  },
  {
    id: "cat-generator",
    slug: "generator",
    domain: "facility",
    name: "발전기 / 비상전원",
    nameEn: "Generators",
    description: "비상발전기 용량 합산, 부하율, 연료, 기동 전압강하를 다룹니다.",
    icon: "Fuel",
    order: 1,
  },
  {
    id: "cat-ups",
    slug: "ups",
    domain: "facility",
    name: "UPS / 배터리",
    nameEn: "UPS and batteries",
    description: "UPS 용량·백업시간과 배터리 Ah 에너지 수지입니다.",
    icon: "BatteryCharging",
    order: 2,
  },
  {
    id: "cat-grounding",
    slug: "grounding",
    domain: "electrical",
    name: "접지 / 낙뢰",
    nameEn: "Grounding and SPD",
    description: "접지봉 간이 추정, 토양저항률, 접지도체 단열식, SPD 위치 안내입니다.",
    icon: "Earth",
    order: 6,
  },
  {
    id: "cat-power-quality",
    slug: "power-quality",
    domain: "electrical",
    name: "전력품질",
    nameEn: "Power quality",
    description: "역률, 콘덴서 보상, 전력 삼각형, THD, 필터 공진 차수 근사입니다.",
    icon: "Percent",
    order: 7,
  },
  {
    id: "cat-lighting",
    slug: "lighting",
    domain: "electrical",
    name: "조명",
    nameEn: "Lighting",
    description: "루멘법 조도와 조명 전력밀도, LED 교체 절감 참고입니다.",
    icon: "Lightbulb",
    order: 8,
  },
  {
    id: "cat-solar",
    slug: "solar",
    domain: "electrical",
    name: "태양광",
    nameEn: "Solar PV",
    description: "계통연계·독립형·하이브리드를 나눈 PV 에너지 수지입니다.",
    icon: "Sun",
    order: 9,
  },
  {
    id: "cat-facility-ops",
    slug: "facility-ops",
    domain: "facility",
    name: "시설관리",
    nameEn: "Facility operations",
    description: "설비 운전, 에너지 분석, 가동률, 정비 주기, 사용량 비교 등 운전 지표입니다.",
    icon: "BarChart3",
    order: 3,
  },
  {
    id: "cat-field-verify",
    slug: "field-verify",
    domain: "facility",
    name: "현장 검증",
    nameEn: "Field verification",
    description: "실측과 설계 비교, 상불평형, 센서 점검, Trend 통계 등 현장 확인용입니다.",
    icon: "ClipboardCheck",
    order: 4,
  },
  {
    id: "cat-power-system",
    slug: "power-system",
    domain: "electrical",
    name: "전력계통",
    nameEn: "Power systems",
    description: "3상 단락 간이 계산과 방사형 조류 해석입니다.",
    icon: "Network",
    order: 10,
  },
  {
    id: "cat-schedule",
    slug: "schedule",
    domain: "electrical",
    name: "설계 / Schedule",
    nameEn: "Design schedules",
    description: "부하·케이블·반 스케줄과 향후 단선도 데이터 구조입니다.",
    icon: "Table",
    order: 11,
  },
  {
    id: "cat-advanced",
    slug: "advanced",
    domain: "electrical",
    name: "고급 검토",
    nameEn: "Advanced tools",
    description: "아크플래시 검토 준비·낙뢰보호 검토 항목입니다. 입사에너지나 위험점수를 내지 않습니다.",
    icon: "Shield",
    order: 12,
  },
  {
    id: "cat-reference-dist",
    slug: "distribution",
    domain: "electrical",
    name: "수변전·배전",
    nameEn: "Electrical distribution",
    description: "수변전 설비, 절체 방식, 보호기기 개념을 정리한 참고 자료입니다.",
    icon: "Network",
    order: 90,
  },
  {
    id: "cat-reference-basics",
    slug: "basics",
    domain: "electrical",
    name: "전기 기초",
    nameEn: "Electrical fundamentals",
    description: "전력 단위, 전류, 역률 등 실무 기초 개념을 설명합니다.",
    icon: "BookOpen",
    order: 91,
  },
];

export function getCategoryById(id: string): ToolCategory | undefined {
  return categories.find((category) => category.id === id);
}

export function getCategoryBySlug(slug: string): ToolCategory | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getElectricalCategories(): ToolCategory[] {
  return categories
    .filter((category) => category.domain === "electrical" && category.order < 90)
    .sort((a, b) => a.order - b.order);
}

export function getFacilityCategories(): ToolCategory[] {
  return categories
    .filter((category) => category.domain === "facility")
    .sort((a, b) => a.order - b.order);
}

export function getHubCategories(): ToolCategory[] {
  return categories.filter((category) => category.order < 90).sort((a, b) => {
    if (a.domain !== b.domain) return a.domain === "electrical" ? -1 : 1;
    return a.order - b.order;
  });
}
