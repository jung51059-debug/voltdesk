import type { ToolCategory } from "@/lib/types";

export const categories: ToolCategory[] = [
  {
    id: "cat-load-current",
    slug: "load-current",
    domain: "electrical",
    name: "부하·전류 계산",
    nameEn: "Load and current",
    description: "단상·3상 부하전류와 설비 용량에 따른 전류를 계산합니다.",
    icon: "Zap",
    order: 1,
  },
  {
    id: "cat-voltage-drop",
    slug: "voltage-drop",
    domain: "electrical",
    name: "전압·전압강하",
    nameEn: "Voltage and voltage drop",
    description: "케이블 길이와 전류에 따른 전압강하와 전압강하율을 검토합니다.",
    icon: "Activity",
    order: 2,
  },
  {
    id: "cat-power-energy",
    slug: "power-energy",
    domain: "electrical",
    name: "전력·에너지",
    nameEn: "Power and energy",
    description: "유효전력, 피상전력, 전력량 단위를 변환하고 비교합니다.",
    icon: "Gauge",
    order: 3,
  },
  {
    id: "cat-transformer",
    slug: "transformer",
    domain: "electrical",
    name: "변압기 계산",
    nameEn: "Transformer calculations",
    description: "변압기 용량, 부하율, 여유 용량을 산정합니다.",
    icon: "Box",
    order: 4,
  },
  {
    id: "cat-power-factor",
    slug: "power-factor",
    domain: "electrical",
    name: "역률 계산",
    nameEn: "Power factor",
    description: "유효전력과 피상전력으로부터 역률과 무효전력을 구합니다.",
    icon: "Percent",
    order: 5,
  },
  {
    id: "cat-cable",
    slug: "cable",
    domain: "electrical",
    name: "케이블·도체",
    nameEn: "Cable and conductor",
    description: "도체 단면적, 재질, 길이를 반영한 저항 기반 검토 도구입니다.",
    icon: "Cable",
    order: 6,
  },
  {
    id: "cat-breaker",
    slug: "breaker",
    domain: "electrical",
    name: "차단기 계산",
    nameEn: "Circuit breaker",
    description: "부하전류를 기준으로 한 참고용 차단기 용량 검토입니다.",
    icon: "ToggleLeft",
    order: 7,
  },
  {
    id: "cat-conversion",
    slug: "conversion",
    domain: "electrical",
    name: "단위 환산",
    nameEn: "Unit conversions",
    description: "kW, kVA, HP 등 전기 실무에서 자주 쓰는 단위를 변환합니다.",
    icon: "ArrowLeftRight",
    order: 8,
  },
  {
    id: "cat-ups",
    slug: "ups",
    domain: "facility",
    name: "UPS·비상전원",
    nameEn: "UPS and backup power",
    description: "UPS 백업시간과 비상발전기 부하율을 산정합니다.",
    icon: "BatteryCharging",
    order: 1,
  },
  {
    id: "cat-facility-energy",
    slug: "facility-energy",
    domain: "facility",
    name: "수전·전력사용",
    nameEn: "Facility energy use",
    description: "월간 전력사용량 비교와 설비 부하 운영 지표를 제공합니다.",
    icon: "BarChart3",
    order: 2,
  },
  {
    id: "cat-equipment",
    slug: "equipment",
    domain: "facility",
    name: "설비 용량",
    nameEn: "Equipment capacity",
    description: "변압기, 발전기 등 주요 설비의 부하율과 여유율을 확인합니다.",
    icon: "Building2",
    order: 3,
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
