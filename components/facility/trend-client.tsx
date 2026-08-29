"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ResultPanel } from "@/components/calculators/result-panel";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { analyzeTrend, parseTrendText, type TrendPoint } from "@/lib/calculations/field-verify";
import { followUp } from "@/lib/calculations/handoff";
import { metric, review, roundTo, warning } from "@/lib/calculations/parse";
import { getFormulaById } from "@/lib/data/formulas";
import { pushRecentTool } from "@/lib/storage/local";
import type { CalculationResult } from "@/lib/types";

const SAMPLE = `# 시각,값  또는 값만 한 줄에 하나씩
2026-08-29T08:00:00, 218
2026-08-29T09:00:00, 221
2026-08-29T10:00:00, 215
2026-08-29T11:00:00, 219
2026-08-29T12:00:00, 224`;

function toResult(points: TrendPoint[], precision: number): CalculationResult {
  const stats = analyzeTrend(points);
  const metrics = [
    metric("avg", "평균", stats.avg, "", precision, { primary: true }),
    metric("n", "Count", stats.count, "개", 0),
    metric("min", "Minimum", stats.min, "", precision),
    metric("max", "Maximum", stats.max, "", precision),
    metric("range", "Range", stats.range, "", precision),
    metric("sd", "표본표준편차", stats.stdev, "", Math.max(precision, 3), { hint: "n−1" }),
    metric("pct", "전체기간 변화율 (첫→끝)", Number.isFinite(stats.pctChange) ? stats.pctChange : 0, "%", precision),
  ];
  if (stats.durationH > 0) {
    metrics.push(metric("dur", "관찰기간", stats.durationH, "h", Math.max(precision, 3)));
    if (Number.isFinite(stats.roc)) metrics.push(metric("roc", "평균 변화율", stats.roc, "/h", Math.max(precision, 3)));
  }
  metrics.push(metric("peak", "Peak 값", stats.peak.value, "", precision));
  const peakTime = stats.peak.label ?? (stats.peak.tMs ? new Date(stats.peak.tMs).toISOString() : "시각 없음");

  return {
    ok: true,
    metrics,
    inputSummary: [
      { label: "시료 수", value: `${stats.count}` },
      { label: "Peak 발생", value: peakTime },
    ],
    interpretation: `평균 ${roundTo(stats.avg, precision)}, 범위 ${roundTo(stats.range, precision)}, 표본표준편차 ${roundTo(stats.stdev, precision)}. BAS/BMS 분석 플랫폼이 아닙니다.`,
    warnings: [
      warning("info", "기초 통계", "표본표준편차(n−1)와 첫값→끝값 전체기간 변화율입니다. 회귀·이동평균이 아닙니다."),
      warning("info", "Peak 시각", "Peak는 입력 샘플 중 최댓값과 그 행의 시각입니다. 실제 피크가 그 순간에만 났다고 확대해석하지 마세요."),
    ],
    formulaUsed: "avg = Σx/n,  s = √(Σ(x−avg)²/(n−1)),  %Δ = (끝−처음)/|처음| × 100,  ROC = (끝−처음)/시간",
    steps: [
      `n = ${stats.count}`,
      `평균 = ${roundTo(stats.avg, precision)}`,
      `min ${roundTo(stats.min, precision)}, max ${roundTo(stats.max, precision)}, range ${roundTo(stats.range, precision)}`,
      `s = ${roundTo(stats.stdev, precision)}`,
      Number.isFinite(stats.pctChange) ? `% 변화 = ${roundTo(stats.pctChange, precision)} %` : "첫 값이 0이라 % 변화 생략",
      stats.durationH > 0 ? `관찰기간 = ${roundTo(stats.durationH, 3)} h` : "시각 열 없음 — 기간 생략",
    ],
    reviewStatus: review("check", "붙여넣은 숫자 통계입니다. 계측 품질·경보 판정이 아닙니다."),
    assumptionsUsed: ["각 행이 같은 물리량·같은 단위라고 가정합니다."],
    nextChecks: ["결측·이상치", "계측 단위", "운전 이벤트와 시각 정렬"],
    followUps: [
      followUp("설계값 vs 실측 비교", "/tools/facility/field-compare", {}),
      followUp("설비 가동률 (Runtime)", "/tools/facility/duty-cycle", {}),
    ],
  };
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length < 2) return null;
  const w = 400;
  const h = 160;
  const pad = 16;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const ys = values.map((v) => pad + (1 - (v - min) / span) * (h - pad * 2));
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full rounded-xl border border-border bg-surface" role="img" aria-label="측정값 선 그래프">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="2.5" className="fill-primary" />
      ))}
    </svg>
  );
}

export function TrendClient() {
  const formula = getFormulaById("formula-trend");
  const [text, setText] = useState(SAMPLE);
  const [parseErrors, setParseErrors] = useState<{ line: number; message: string }[]>([]);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [points, setPoints] = useState<TrendPoint[]>([]);

  useEffect(() => {
    pushRecentTool("tool-trend-analysis");
  }, []);

  const parsed = useMemo(() => parseTrendText(text), [text]);

  function run() {
    setParseErrors(parsed.errors);
    setPoints(parsed.points);
    if (parsed.points.length === 0) {
      setResult(null);
      return;
    }
    setResult(toResult(parsed.points, 2));
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = String(reader.result ?? "");
      setText(next);
      const parsedFile = parseTrendText(next);
      setParseErrors(parsedFile.errors);
      setPoints(parsedFile.points);
      setResult(parsedFile.points.length ? toResult(parsedFile.points, 2) : null);
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted">현장 검증</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Trend 기초 분석</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            BAS/BMS 로그를 빠르게 훑는 통계입니다. 값만, 또는 시각·값 CSV를 붙여 넣으세요. 복잡한 분석 플랫폼이 아닙니다.
          </p>
        </div>
        <FavoriteButton toolId="tool-trend-analysis" toolName="Trend 기초 분석" />
      </header>

      <div className="rounded-[16px] border border-border bg-card p-5 sm:p-6 lg:grid lg:grid-cols-2 lg:gap-10">
        <div>
          <label htmlFor="trend-text" className="text-sm font-medium">
            측정값 (한 줄에 값, 또는 시각,값)
          </label>
          <p className="mt-1 text-xs text-muted">쉼표·탭·세미콜론 구분. #으로 시작하는 줄은 무시합니다.</p>
          <textarea
            id="trend-text"
            rows={12}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm"
          />
          <label className="mt-3 block text-sm font-medium">
            CSV 가져오기
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              className="mt-1.5 block w-full text-sm"
              onChange={(event) => onFile(event.target.files?.[0])}
            />
          </label>
          {parseErrors.length > 0 ? (
            <p className="mt-2 text-sm text-danger-ink">
              {parseErrors.length}행을 건너뛰었습니다. 예: {parseErrors[0].line}행 {parseErrors[0].message}
            </p>
          ) : null}
          <button type="button" className="mt-4 h-12 w-full rounded-lg bg-primary text-base font-semibold text-white dark:text-ink" onClick={run}>
            통계 계산
          </button>
          <p className="mt-3 text-xs leading-5 text-muted">
            제어 한계·경보·설비 진단을 자동으로 하지 않습니다. 측정 이력 저장·PDF는 이후 Project 기능에서 연결할 예정입니다.
          </p>
        </div>
        <div>
          {result ? (
            <>
              <TrendChart points={points} />
              <ResultPanel result={result} split />
            </>
          ) : (
            <p className="text-sm leading-6 text-muted">값을 넣은 뒤 통계 계산을 누르면 결과가 여기에 표시됩니다.</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/tools/facility/field-compare" className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-medium text-primary">
          설계값 vs 실측 비교
        </Link>
        <Link href="/tools/facility/duty-cycle" className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-medium text-primary">
          설비 가동률 (Runtime)
        </Link>
        <Link href="/tools/facility/monthly-energy" className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm font-medium text-primary">
          월간 전력사용량 비교
        </Link>
      </div>
      {formula ? <TechnicalDisclosure formula={formula} /> : null}
    </div>
  );
}
