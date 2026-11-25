export type UsContentReference = {
  title: string;
  url: string;
  status: "pending" | "verified" | "partial";
  note: string;
  sourceId?: string;
};

export type UsWorkedExample = {
  title: string;
  narrative: string;
  expectedMetricLabel: string;
  expectedValueContains: string;
};

export type UsCalculatorFaq = {
  question: string;
  answer: string;
};

/** English guide body for a US Group A calculator (engine-neutral; no NEC compliance claims). */
export type UsCalculatorContent = {
  overview: string;
  howToUse: string[];
  workedExample: UsWorkedExample;
  understandingResults: string;
  practicalApplications: string;
  commonMistakes: string;
  limitations: string;
  faqs: UsCalculatorFaq[];
  references: UsContentReference[];
  /** Optional US-5 sections (also rendered on Group B/C pages when wired). */
  safetyNotes?: string;
  codeAndJurisdictionNotes?: string;
  relatedCalculatorSlugs?: string[];
  relatedGuideSlugs?: string[];
};