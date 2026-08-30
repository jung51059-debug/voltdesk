"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ResultPanel } from "@/components/calculators/result-panel";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { StandardStatusBadge, StandardStatusNote } from "@/components/calculators/standard-badge";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { parseHandoff } from "@/lib/calculations/handoff";
import {
  KEC_VOLTAGE_DROP_MIXED,
  KEC_VOLTAGE_DROP_START,
  KEC_VOLTAGE_DROP_STARTING,
  type KecPathStartKind,
  type KecVoltageDropDuty,
  type KecVoltageDropLoad,
  type KecVoltageDropSupply,
} from "@/lib/calculations/kec-review";
import {
  calculatePathVoltageDrop,
  emptyPathSegment,
  insertPathSegment,
  movePathSegment,
  removePathSegment,
  startLabelForKind,
  type PathVoltageDropInput,
  type PathVoltageDropSegmentInput,
} from "@/lib/calculations/path-voltage-drop";
import { getFormulaById } from "@/lib/data/formulas";
import { getStandardBasisBySlug } from "@/lib/data/standard-basis";
import { usePreferences } from "@/components/providers/preferences-provider";
import { pushRecentTool } from "@/lib/storage/local";
import { persist } from "@/lib/storage/persist";
import { roundTo } from "@/lib/math/round";

type Draft = PathVoltageDropInput;

const store = persist<Draft>("voltdesk:path-voltage-drop", {
  startKind: "meter-2nd",
  startLabel: "계량기 2차",
  kecReview: true,
  kecScope: "utility",
  kecSupply: "lv",
  kecLoad: "other",
  kecDuty: "normal",
  segments: [
    { ...emptyPathSegment(0), lengthM: 40, currentA: 80 },
    { ...emptyPathSegment(1), lengthM: 60, currentA: 60, name: "DB" },
    { ...emptyPathSegment(2), lengthM: 60, currentA: 40, name: "최종 부하" },
  ],
});

function numOr(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function draftFromHandoff(params: Record<string, string>): Draft | null {
  if (!params.current && !params.length && !params.voltage) return null;
  const first: PathVoltageDropSegmentInput = {
    ...emptyPathSegment(0),
    name: "구간 1",
    phase: params.phase === "1" ? "1" : "3",
    voltageV: numOr(params.voltage, 380),
    currentA: numOr(params.current, 80),
    lengthM: numOr(params.length, 40),
    rMode: params.rMode === "size" ? "size" : "ohm",
    resistanceOhmKm: numOr(params.resistance, 0.727),
    material: params.material === "al" ? "al" : "cu",
    areaMm2: numOr(params.area, 35),
  };
  return {
    startKind: (params.startKind as KecPathStartKind) || "meter-2nd",
    startLabel: startLabelForKind((params.startKind as KecPathStartKind) || "meter-2nd"),
    kecReview: params.kecReview ? params.kecReview === "on" : true,
    kecScope: params.kecScope === "island" ? "island" : "utility",
    kecSupply: (params.kecSupply as KecVoltageDropSupply) || "lv",
    kecLoad: (params.kecLoad as KecVoltageDropLoad) || "other",
    kecDuty: params.kecDuty === "starting" ? "starting" : "normal",
    segments: [first],
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputClass = "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm";

export function PathVoltageDropClient() {
  const searchParams = useSearchParams();
  const { prefs } = usePreferences();
  const formula = getFormulaById("formula-path-voltage-drop");
  const basis = getStandardBasisBySlug("path-voltage-drop");
  const [draft, setDraft] = useState<Draft>(() => store.load());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    pushRecentTool("tool-path-voltage-drop");
    const handed = draftFromHandoff(parseHandoff(searchParams));
    if (handed) setDraft(handed);
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (hydrated) store.save(draft);
  }, [draft, hydrated]);

  const outcome = useMemo(
    () => calculatePathVoltageDrop(draft, prefs.precision),
    [draft, prefs.precision],
  );

  function patch(partial: Partial<Draft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function patchSeg(index: number, partial: Partial<PathVoltageDropSegmentInput>) {
    setDraft((prev) => {
      const segments = prev.segments.map((seg, i) => (i === index ? { ...seg, ...partial } : seg));
      return { ...prev, segments };
    });
  }

  const startHint =
    draft.kecReview && draft.kecSupply === "hv-plus"
      ? KEC_VOLTAGE_DROP_START["hv-plus"]
      : KEC_VOLTAGE_DROP_START.lv;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Breadcrumb
        items={[
          { href: "/", label: "홈" },
          { href: "/tools/electrical", label: "전기" },
          { href: "/tools/categories/cable", label: "케이블 / 배선" },
          { label: "경로 전압강하 계산기" },
        ]}
        compact
      />
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted">케이블 / 배선</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">경로 전압강하 계산기</h1>
          {basis ? (
            <div className="mt-2 space-y-1.5">
              <StandardStatusBadge status={basis.standardStatus} />
              <StandardStatusNote status={basis.standardStatus} />
            </div>
          ) : null}
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            인입구부터 최종 부하까지 여러 배선 구간의 누적 전압강하를 검토합니다. 한 케이블만 계산하려면{" "}
            <Link href="/tools/electrical/voltage-drop" className="text-primary hover:underline">
              전압강하 계산기
            </Link>
            를 쓰세요.
          </p>
        </div>
        <FavoriteButton toolId="tool-path-voltage-drop" toolName="경로 전압강하 계산기" />
      </header>

      <div className="rounded-[16px] border border-border bg-card p-5 sm:p-6 lg:grid lg:grid-cols-2 lg:gap-10">
        <div className="space-y-4">
          <Field label="KEC 232.3.9 기준 검토">
            <select className={inputClass} value={draft.kecReview ? "on" : "off"} onChange={(e) => patch({ kecReview: e.target.value === "on" })}>
              <option value="off">하지 않음 (누적 계산만)</option>
              <option value="on">검토 (수전 수용가 · 표 232.3-1)</option>
            </select>
          </Field>
          {draft.kecReview ? (
            <>
              <Field label="적용 대상">
                <select className={inputClass} value={draft.kecScope} onChange={(e) => patch({ kecScope: e.target.value as Draft["kecScope"] })}>
                  <option value="utility">전력공급자로부터 수전하는 수용가</option>
                  <option value="island">독립 자가발전기</option>
                </select>
              </Field>
              <Field label="수전방식">
                <select
                  className={inputClass}
                  value={draft.kecSupply}
                  onChange={(e) => patch({ kecSupply: e.target.value as KecVoltageDropSupply })}
                >
                  <option value="lv">저압 수전</option>
                  <option value="hv-plus">고압 이상 수전</option>
                </select>
                <p className="mt-1 text-xs text-muted">{startHint}</p>
              </Field>
              <Field label="부하종류">
                <select className={inputClass} value={draft.kecLoad} onChange={(e) => patch({ kecLoad: e.target.value as KecVoltageDropLoad })}>
                  <option value="lighting">조명</option>
                  <option value="other">기타</option>
                  <option value="mixed">혼합 / 별도 검토</option>
                </select>
                {draft.kecLoad === "mixed" ? <p className="mt-1 text-xs text-muted">{KEC_VOLTAGE_DROP_MIXED}</p> : null}
              </Field>
              <Field label="검토 상태">
                <select
                  className={inputClass}
                  value={draft.kecDuty}
                  onChange={(e) => patch({ kecDuty: e.target.value as KecVoltageDropDuty })}
                >
                  <option value="normal">정상 운전</option>
                  <option value="starting">전동기 기동 / 큰 돌입전류</option>
                </select>
                {draft.kecDuty === "starting" ? <p className="mt-1 text-xs text-muted">{KEC_VOLTAGE_DROP_STARTING}</p> : null}
              </Field>
            </>
          ) : null}

          <Field label="경로 기준점">
            <select
              className={inputClass}
              value={draft.startKind}
              onChange={(e) => {
                const startKind = e.target.value as KecPathStartKind;
                patch({ startKind, startLabel: startLabelForKind(startKind, draft.startLabel) });
              }}
            >
              <option value="meter-2nd">계량기 2차측</option>
              <option value="transformer-2nd">변압기 2차측</option>
              <option value="custom">직접 입력</option>
            </select>
          </Field>
          {draft.startKind === "custom" ? (
            <Field label="기준점 이름">
              <input className={inputClass} value={draft.startLabel} onChange={(e) => patch({ startLabel: e.target.value })} />
            </Field>
          ) : null}
          <p className="text-xs text-muted">
            전압강하율 기준전압을 계산 종류와 맞추세요. 저압은 계량기 2차측, 고압 이상은 변압기 2차측입니다. 3상 선간 ΔV%는 선간전압(예: 380 V), 단상·상전압 ΔV%는 그 회로 전압(예: 220 V)입니다. 3상4선 220/380 V에서 결과적인 %는 같습니다.
          </p>

          <div className="space-y-3">
            {draft.segments.map((seg, index) => {
              const row = outcome.ok ? outcome.path.segments[index] : undefined;
              const prefix = `seg${index}`;
              const errors = !outcome.ok ? outcome.fieldErrors : {};
              return (
                <article key={seg.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">구간 {index + 1}</p>
                    <div className="flex gap-1">
                      <button type="button" className="h-8 rounded-lg px-2 text-xs text-muted hover:text-ink" onClick={() => patch({ segments: movePathSegment(draft.segments, index, index - 1) })} disabled={index === 0}>
                        위로
                      </button>
                      <button type="button" className="h-8 rounded-lg px-2 text-xs text-muted hover:text-ink" onClick={() => patch({ segments: movePathSegment(draft.segments, index, index + 1) })} disabled={index === draft.segments.length - 1}>
                        아래로
                      </button>
                      <button type="button" className="h-8 rounded-lg px-2 text-xs text-danger-ink" onClick={() => patch({ segments: removePathSegment(draft.segments, index) })} disabled={draft.segments.length <= 1}>
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Field label="구간명">
                      <input className={inputClass} value={seg.name} onChange={(e) => patchSeg(index, { name: e.target.value })} />
                    </Field>
                    <Field label="상 / 배선">
                      <select className={inputClass} value={seg.phase} onChange={(e) => patchSeg(index, { phase: e.target.value as "1" | "3" })}>
                        <option value="3">3상</option>
                        <option value="1">단상</option>
                      </select>
                    </Field>
                    <Field label="전압강하율 기준전압 V">
                      <input className={inputClass} inputMode="decimal" value={String(seg.voltageV)} onChange={(e) => patchSeg(index, { voltageV: Number(e.target.value) })} />
                    </Field>
                    <Field label="부하전류 A">
                      <input className={inputClass} inputMode="decimal" value={String(seg.currentA)} onChange={(e) => patchSeg(index, { currentA: Number(e.target.value) })} />
                    </Field>
                    <Field label="역률 (기록용 — 현재 전압강하 계산에는 사용되지 않음)">
                      <input className={inputClass} inputMode="decimal" value={String(seg.pf ?? "")} onChange={(e) => patchSeg(index, { pf: Number(e.target.value) })} />
                    </Field>
                    <Field label="편도 길이 m">
                      <input className={inputClass} inputMode="decimal" value={String(seg.lengthM)} onChange={(e) => patchSeg(index, { lengthM: Number(e.target.value) })} />
                    </Field>
                    <Field label="저항 입력">
                      <select className={inputClass} value={seg.rMode} onChange={(e) => patchSeg(index, { rMode: e.target.value as "ohm" | "size" })}>
                        <option value="ohm">Ω/km 직접 입력</option>
                        <option value="size">재질·단면적 근사</option>
                      </select>
                    </Field>
                    {seg.rMode === "ohm" ? (
                      <Field label="도체 저항 Ω/km">
                        <input className={inputClass} inputMode="decimal" value={String(seg.resistanceOhmKm ?? "")} onChange={(e) => patchSeg(index, { resistanceOhmKm: Number(e.target.value) })} />
                      </Field>
                    ) : (
                      <>
                        <Field label="재질">
                          <select className={inputClass} value={seg.material ?? "cu"} onChange={(e) => patchSeg(index, { material: e.target.value as "cu" | "al" })}>
                            <option value="cu">구리</option>
                            <option value="al">알루미늄</option>
                          </select>
                        </Field>
                        <Field label="단면적 mm²">
                          <input className={inputClass} inputMode="decimal" value={String(seg.areaMm2 ?? "")} onChange={(e) => patchSeg(index, { areaMm2: Number(e.target.value) })} />
                        </Field>
                      </>
                    )}
                  </div>
                  {errors[`${prefix}.current`] || errors[`${prefix}.length`] || errors[`${prefix}.voltage`] || errors[`${prefix}.resistance`] || errors[`${prefix}.name`] ? (
                    <p className="mt-2 text-xs text-danger-ink">
                      {errors[`${prefix}.name`] || errors[`${prefix}.current`] || errors[`${prefix}.length`] || errors[`${prefix}.voltage`] || errors[`${prefix}.resistance`]}
                    </p>
                  ) : null}
                  {row ? (
                    <p className="mt-3 text-sm tabular-nums">
                      구간 ΔV {roundTo(row.dropV, prefs.precision)} V ({roundTo(row.dropPct, prefs.precision)}%) · 누적{" "}
                      {roundTo(row.cumulativePct, prefs.precision)}%
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
          <button
            type="button"
            className="h-11 w-full rounded-xl border border-border text-sm font-medium text-primary hover:bg-info"
            onClick={() => patch({ segments: insertPathSegment(draft.segments, draft.segments.length) })}
          >
            구간 추가
          </button>
        </div>

        <div className="mt-6 space-y-4 border-t border-border pt-5 lg:mt-0 lg:border-t-0 lg:pt-0">
          {outcome.ok ? (
            <>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-medium tracking-wide text-muted uppercase">전체 경로</p>
                <ol className="mt-3 space-y-2 text-sm">
                  <li className="text-muted">{outcome.path.startLabel}</li>
                  {outcome.path.segments.map((row) => (
                    <li key={row.id} className="flex items-baseline justify-between gap-3">
                      <span>→ {row.name}</span>
                      <span className="tabular-nums font-medium">
                        {roundTo(row.dropPct, prefs.precision)}%
                        <span className="ml-2 text-muted">누적 {roundTo(row.cumulativePct, prefs.precision)}%</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <ResultPanel result={outcome} split />
            </>
          ) : (
            <p className="text-sm leading-6 text-muted">구간 입력을 확인하면 누적 결과가 여기에 표시됩니다.</p>
          )}
        </div>
      </div>

      {formula ? <TechnicalDisclosure formula={formula} /> : null}

      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm">
        <Link href="/tools/electrical/voltage-drop" className="text-muted hover:text-primary">
          전압강하 계산기
        </Link>
        <Link href="/tools/electrical/cable-sizing" className="text-muted hover:text-primary">
          케이블 굵기
        </Link>
      </nav>
    </div>
  );
}
