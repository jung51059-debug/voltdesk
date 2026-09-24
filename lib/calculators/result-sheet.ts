import type { CalculationResult } from "@/lib/types";

export type SiteNotes = {
  site?: string;
  equipment?: string;
  memo?: string;
};

export type ResultLine = { label: string; value: string };

/** 화면 메트릭을 그대로 결과 줄로 만듭니다. 다시 계산하지 않습니다. */
export function resultLines(result: CalculationResult): ResultLine[] {
  const ordered = [...result.metrics].sort((left, right) => Number(Boolean(right.primary)) - Number(Boolean(left.primary)));
  return ordered.map((metric) => ({
    label: metric.label,
    value: [metric.value, metric.unit].filter((part) => part !== undefined && part !== "").join(" "),
  }));
}

export function resultCopyText(input: {
  title: string;
  pageUrl: string;
  inputs: ResultLine[];
  results: ResultLine[];
  formula?: string;
}): string {
  const formula = input.formula?.trim() ?? "";
  const lines = [
    input.title,
    "",
    "입력값",
    ...input.inputs.map((row) => `${row.label}: ${row.value}`),
    "",
    "계산 결과",
    ...input.results.map((row) => `${row.label}: ${row.value}`),
  ];
  if (formula) {
    lines.push("", formula.includes("=") ? "계산식:" : "계산 기준:", formula);
  }
  lines.push("", "Ampory", input.pageUrl);
  return lines.join("\n");
}

export function copyTextFromResult(result: CalculationResult, title: string, pageUrl: string): string {
  return resultCopyText({
    title,
    pageUrl,
    inputs: result.inputSummary,
    results: resultLines(result),
    formula: result.formulaUsed,
  });
}

/** 비어 있는 현장명·설비명·메모는 결과서에 넣지 않습니다. */
export function filledSiteNotes(notes: SiteNotes): ResultLine[] {
  return [
    { label: "현장명", value: notes.site?.trim() ?? "" },
    { label: "설비명", value: notes.equipment?.trim() ?? "" },
    { label: "메모", value: notes.memo?.trim() ?? "" },
  ].filter((row) => row.value.length > 0);
}

export function formatResultStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function resultPdfFilename(title: string, date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const safe = title.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "") || "계산결과";
  return `Ampory_${safe}_${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.pdf`;
}
