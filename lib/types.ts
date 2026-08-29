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

export interface EngineeringWarning {
  level: "info" | "warning" | "error";
  title: string;
  message: string;
}

export interface CalculationResult {
  ok: true;
  metrics: ResultMetric[];
  inputSummary: { label: string; value: string }[];
  interpretation: string;
  warnings: EngineeringWarning[];
  formulaUsed: string;
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
    "부하전류, 전압강하, 변압기 부하율, 역률, UPS 백업시간 등 전기·시설관리 실무 계산기와 기술 참고자료를 제공하는 엔지니어링 유틸리티입니다.",
  url: "https://ampory.vercel.app",
} as const;
