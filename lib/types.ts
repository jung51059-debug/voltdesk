export type ToolDomain = "electrical" | "facility";

export type ToolStatus = "published" | "coming-soon";

export type Complexity = "basic" | "intermediate" | "advanced";

export type ThemePreference = "light" | "dark" | "system";

export type UnitSystem = "si" | "mixed";

export type LanguagePreference = "ko" | "en";

export interface ToolCategory {
  id: string;
  slug: string;
  domain: ToolDomain;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  order: number;
}

export interface CalculatorTool {
  id: string;
  slug: string;
  href: string;
  categoryId: string;
  domain: ToolDomain;
  name: string;
  nameEn: string;
  description: string;
  longDescription: string;
  formulaId: string;
  tags: string[];
  synonyms: string[];
  relatedToolIds: string[];
  relatedArticleIds: string[];
  complexity: Complexity;
  featured: boolean;
  recentlyAdded: boolean;
  status: ToolStatus;
  updatedAt: string;
  faqs: FaqItem[];
}

export interface FormulaVariable {
  symbol: string;
  name: string;
  unit: string;
  description: string;
}

export interface FormulaDefinition {
  id: string;
  title: string;
  formula: string;
  variables: FormulaVariable[];
  units: string[];
  assumptions: string[];
  warnings: string[];
  limitations: string[];
  example: {
    title: string;
    given: string;
    steps: string[];
    result: string;
  };
  referenceSources: ReferenceSource[];
  /** 실제로 어떤 계산 부분에 해당 기준을 참고했는지 */
  criteriaNotes?: { standard: string; appliesTo: string }[];
}

export interface ReferenceSource {
  id: string;
  title: string;
  publisher: string;
  note: string;
  url?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ReferenceArticle {
  id: string;
  slug: string;
  href: string;
  title: string;
  summary: string;
  categoryId: string;
  relatedToolIds: string[];
  tags: string[];
  synonyms: string[];
  updatedAt: string;
  keyConcept: string;
  formula?: string;
  practicalExample: string;
  limitations: string[];
  sourceNotes: string[];
  body: ArticleSection[];
  faqs?: FaqItem[];
}

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

export interface UserPreference {
  theme: ThemePreference;
  defaultVoltage: number;
  defaultFrequency: 50 | 60;
  unitSystem: UnitSystem;
  precision: number;
  language: LanguagePreference;
}

export interface CalculationHistory {
  id: string;
  toolId: string;
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  calculationIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResultMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  primary?: boolean;
  hint?: string;
}

export interface CorrectionFactor {
  id: string;
  label: string;
  value: string;
  note?: string;
}

export interface FollowUpLink {
  label: string;
  href: string;
}

export interface EngineeringWarning {
  level: "info" | "warning" | "error";
  title: string;
  message: string;
}

/** 규정 합격/불합격이 아닌 검토 상태. PASS 표현은 사용하지 않습니다. */
export type ReviewKind = "in-range" | "check" | "caution";

export interface ReviewStatus {
  kind: ReviewKind;
  label: string;
  note: string;
}

export interface CalculationResult {
  ok: true;
  metrics: ResultMetric[];
  inputSummary: { label: string; value: string }[];
  interpretation: string;
  warnings: EngineeringWarning[];
  formulaUsed: string;
  /** 사용자가 검산할 수 있는 단계별 계산 과정 */
  steps?: string[];
  reviewStatus?: ReviewStatus;
  assumptionsUsed?: string[];
  /** 온도·집합 등 사용자가 넣은 보정계수가 결과에 미친 영향 */
  corrections?: CorrectionFactor[];
  /** 다른 계산기로 숫자만 넘기는 연결 (허용 키만 URL에 포함) */
  followUps?: FollowUpLink[];
  /** 규정 합격이 아닌, 현장에서 이어서 확인할 항목 */
  nextChecks?: string[];
}

export interface CalculationFailure {
  ok: false;
  fieldErrors: Record<string, string>;
  formError?: string;
}

export type CalculationOutcome = CalculationResult | CalculationFailure;

export interface SearchHit {
  id: string;
  type: "calculator" | "article" | "category";
  title: string;
  description: string;
  href: string;
  badges: string[];
  score: number;
}

export const DEFAULT_PREFERENCES: UserPreference = {
  theme: "system",
  defaultVoltage: 380,
  defaultFrequency: 60,
  unitSystem: "si",
  precision: 2,
  language: "ko",
};

export const SITE = {
  name: "Ampory",
  nameKo: "앰포리",
  tagline: "전기·시설 엔지니어링 계산 도구",
  description:
    "한국 전기·시설관리 실무자를 위한 엔지니어링 계산 도구입니다. 부하전류, 케이블 검토, 변압기, 모터, 역률 개선, UPS, 발전기, 부하 스케줄 등 현장에서 바로 쓰는 계산과 실무 참고를 제공합니다.",
  url: "https://ampory.vercel.app",
} as const;
