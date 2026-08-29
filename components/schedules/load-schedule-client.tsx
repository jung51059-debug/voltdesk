"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EngineeringDisclaimer } from "@/components/calculators/engineering-disclaimer";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { buildHandoffHref } from "@/lib/calculations/handoff";
import {
  LOAD_CATEGORIES,
  cableRowsFromLoads,
  emptyLoadRow,
  equipmentLoadRatios,
  estimatedMaxCurrentA,
  exportLoadScheduleCsv,
  generatorHandoffFromLoads,
  loadRowsFromCsv,
  panelHandoff,
  panelRowsFromLoads,
  parseLoadScheduleDocument,
  phaseAnalysis,
  rowHandoff,
  rowPowers,
  suggestPhasePlacement,
  summarizeByCategory,
  summarizeByPanel,
  summarizeLoads,
  type CsvImportError,
  type LoadEquipment,
  type LoadRow,
  type LoadScheduleDocument,
} from "@/lib/calculations/schedules";
import { getFormulaById } from "@/lib/data/formulas";
import { pushRecentTool, readJson, writeJson } from "@/lib/storage/local";
import { downloadText, persist } from "@/lib/storage/persist";

const LOAD_KEY = "voltdesk:load-schedule";
const panelStore = persist("voltdesk:panel-schedule", [] as unknown[]);
const cableStore = persist("voltdesk:cable-schedule", [] as unknown[]);

const computedCell = "bg-info px-2 py-2 tabular-nums text-muted";
const inputCell = "h-9 w-full min-w-[4.5rem] rounded border border-border bg-surface px-1";

function ReviewLinks({
  power,
  voltage,
  phase,
  pf,
  efficiency,
  current,
}: {
  power: number;
  voltage: number;
  phase: "1" | "3";
  pf: number;
  efficiency: number;
  current: number;
}) {
  const cable = buildHandoffHref("/tools/electrical/cable-sizing", {
    phase,
    power,
    powerUnit: "kW",
    voltage,
    pf,
    efficiency,
    current,
  });
  const drop = buildHandoffHref("/tools/electrical/voltage-drop", { phase, current, voltage });
  const breaker = buildHandoffHref("/tools/electrical/breaker-current", { current });
  const cls = "inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-primary";
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap">
      <Link href={cable} className={cls}>
        케이블 굵기 검토
      </Link>
      <Link href={drop} className={cls}>
        전압강하 계산
      </Link>
      <Link href={breaker} className={cls}>
        차단기 정격 검토
      </Link>
    </div>
  );
}

export function LoadScheduleClient() {
  const [rows, setRows] = useState<LoadRow[]>([]);
  const [equipment, setEquipment] = useState<LoadEquipment>({ transformerKva: 0, generatorKw: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelFilter, setPanelFilter] = useState("");
  const [importErrors, setImportErrors] = useState<CsvImportError[]>([]);
  const [phaseNote, setPhaseNote] = useState("");
  const formula = getFormulaById("formula-load-schedule");

  useEffect(() => {
    const doc = parseLoadScheduleDocument(readJson<unknown>(LOAD_KEY, []));
    setRows(doc.rows.length ? doc.rows : [emptyLoadRow()]);
    setEquipment(doc.equipment);
    pushRecentTool("tool-load-schedule");
  }, []);

  useEffect(() => {
    if (!rows.length) return;
    const doc: LoadScheduleDocument = { version: 1, rows, equipment };
    writeJson(LOAD_KEY, doc);
  }, [rows, equipment]);

  const visible = useMemo(() => (panelFilter ? rows.filter((row) => row.panel === panelFilter) : rows), [rows, panelFilter]);
  const allSummary = useMemo(() => summarizeLoads(rows), [rows]);
  const cats = useMemo(() => summarizeByCategory(visible), [visible]);
  const panels = useMemo(() => summarizeByPanel(rows), [rows]);
  const phases = useMemo(() => phaseAnalysis(visible), [visible]);
  const feeder = useMemo(() => estimatedMaxCurrentA(visible), [visible]);
  const ratios = useMemo(() => equipmentLoadRatios(allSummary, equipment), [allSummary, equipment]);
  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const panelNames = useMemo(() => [...new Set(rows.map((row) => row.panel).filter(Boolean))], [rows]);
  const gen = generatorHandoffFromLoads(visible);
  const upsDemand = cats.find((c) => c.key === "UPS")?.demandKw ?? 0;

  function patch(id: string, key: keyof LoadRow, value: string) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        if (key === "phase") {
          const phase = value === "1" ? "1" : "3";
          return { ...row, phase, pole: phase === "3" ? "RST" : row.pole === "RST" ? "R" : row.pole };
        }
        if (key === "pole") return { ...row, pole: value === "R" || value === "S" || value === "T" ? value : "RST" };
        if (key === "category" || key === "name" || key === "panel" || key === "remark") return { ...row, [key]: value };
        return { ...row, [key]: Number(value) };
      }),
    );
  }

  function writePanelSchedule() {
    const next = panelRowsFromLoads(rows, panelFilter || undefined);
    if (!next.length) return;
    if (panelStore.load().length && !window.confirm("기존 Panel Schedule을 이 부하로 다시 채울까요? 차단기·케이블 칸은 비워 두고 검토용으로만 만듭니다.")) {
      return;
    }
    writeJson("voltdesk:panel-schedule", next);
    window.location.href = "/tools/schedules/panel";
  }

  function writeCableSchedule() {
    const next = cableRowsFromLoads(rows, panelFilter || undefined);
    if (!next.length) return;
    if (cableStore.load().length && !window.confirm("기존 Cable Schedule을 이 부하로 다시 채울까요? 굵기는 비워 두고 검토 행만 만듭니다.")) {
      return;
    }
    writeJson("voltdesk:cable-schedule", next);
    window.location.href = "/tools/schedules/cable";
  }

  const selectedPanelGroup = panelFilter ? panels.find((p) => p.key === panelFilter) : null;
  const sampleRow = visible[0];

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">설계 / Schedule</p>
          <h1 className="mt-1 text-2xl font-semibold">부하 스케줄 작성</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            입력칸과 자동 계산칸을 구분해 수요·전류를 집계합니다. 케이블·차단기는 확정하지 않고 검토 계산기로 넘깁니다.
          </p>
        </div>
        <FavoriteButton toolId="tool-load-schedule" toolName="부하 스케줄 작성" />
      </header>

      <section className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
        <p>
          총 설비용량
          <strong className="mt-1 block text-2xl tabular-nums">{allSummary.connectedKw.toFixed(2)} kW</strong>
        </p>
        <p>
          예상 수요부하
          <strong className="mt-1 block text-2xl tabular-nums">{allSummary.demandKw.toFixed(2)} kW</strong>
        </p>
        <p>
          총 피상전력
          <strong className="mt-1 block text-2xl tabular-nums">{allSummary.demandKva.toFixed(2)} kVA</strong>
        </p>
        <p>
          예상 전체 PF
          <strong className="mt-1 block text-2xl tabular-nums">{allSummary.pf.toFixed(3)}</strong>
        </p>
        <p>
          예상 최대전류
          <strong className="mt-1 block text-2xl tabular-nums">{feeder.currentA.toFixed(1)} A</strong>
          <span className="text-xs text-muted">
            {feeder.voltage ? `${feeder.voltage} V 군` : ""} {feeder.mixed ? "· 전압이 섞여 최댓값을 표시" : ""} · 수전 주회로 확정이 아님
          </span>
        </p>
        <p>
          입력 kW 합
          <strong className="mt-1 block text-2xl tabular-nums">{allSummary.inputKw.toFixed(2)} kW</strong>
        </p>
      </section>

      <section className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <label className="text-sm">
          보유 변압기 정격 kVA
          <input
            inputMode="decimal"
            className="mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3"
            value={equipment.transformerKva || ""}
            placeholder="입력 시에만 부하율 계산"
            onChange={(e) => setEquipment((c) => ({ ...c, transformerKva: Number(e.target.value) || 0 }))}
          />
          <strong className="mt-2 block text-lg tabular-nums">
            {ratios.transformerPct == null ? "변압기 예상 부하율 — 정격 미입력" : `${ratios.transformerPct.toFixed(1)} %`}
          </strong>
        </label>
        <label className="text-sm">
          보유 발전기 정격 kW
          <input
            inputMode="decimal"
            className="mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3"
            value={equipment.generatorKw || ""}
            placeholder="입력 시에만 부하율 계산"
            onChange={(e) => setEquipment((c) => ({ ...c, generatorKw: Number(e.target.value) || 0 }))}
          />
          <strong className="mt-2 block text-lg tabular-nums">
            {ratios.generatorPct == null ? "발전기 예상 부하율 — 정격 미입력" : `${ratios.generatorPct.toFixed(1)} %`}
          </strong>
        </label>
      </section>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="text-sm">
          Panel 필터
          <select
            className="ml-2 h-11 rounded-lg border border-border bg-surface px-2"
            value={panelFilter}
            onChange={(e) => setPanelFilter(e.target.value)}
          >
            <option value="">전체</option>
            {panelNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted">테두리 있는 칸은 입력, 색 있는 칸은 자동 계산입니다.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="min-w-[1380px] w-full text-sm">
          <thead className="bg-info text-left text-xs">
            <tr>
              {[
                "선택",
                "부하명",
                "분류",
                "수량",
                "단위kW",
                "연결kW",
                "η",
                "입력kW",
                "PF",
                "수용률",
                "동시",
                "V",
                "상",
                "극",
                "Panel",
                "수요kW",
                "kVA",
                "kvar",
                "A",
                "비고",
                "",
              ].map((h) => (
                <th key={h} className="px-2 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const p = rowPowers(row);
              return (
                <tr key={row.id} className={`border-t border-border ${selectedId === row.id ? "bg-info/40" : ""}`}>
                  <td className="p-1 text-center">
                    <input type="radio" name="load-row" checked={selectedId === row.id} onChange={() => setSelectedId(row.id)} aria-label={`${row.name || "부하"} 선택`} />
                  </td>
                  <td className="p-1">
                    <input className={inputCell} value={row.name} onChange={(e) => patch(row.id, "name", e.target.value)} />
                  </td>
                  <td className="p-1">
                    <select className="h-9 rounded border border-border bg-surface" value={row.category} onChange={(e) => patch(row.id, "category", e.target.value)}>
                      {LOAD_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      {!((LOAD_CATEGORIES as readonly string[]).includes(row.category)) && row.category ? (
                        <option value={row.category}>{row.category}</option>
                      ) : null}
                    </select>
                  </td>
                  {(["qty", "unitKw"] as const).map((key) => (
                    <td key={key} className="p-1">
                      <input inputMode="decimal" className={inputCell} value={row[key]} onChange={(e) => patch(row.id, key, e.target.value)} />
                    </td>
                  ))}
                  <td className={computedCell}>{p.connectedKw.toFixed(2)}</td>
                  <td className="p-1">
                    <input inputMode="decimal" className={inputCell} value={row.efficiency} onChange={(e) => patch(row.id, "efficiency", e.target.value)} />
                  </td>
                  <td className={computedCell}>{p.inputKw.toFixed(2)}</td>
                  {(["pf", "demand", "coincidence", "voltage"] as const).map((key) => (
                    <td key={key} className="p-1">
                      <input inputMode="decimal" className={inputCell} value={row[key]} onChange={(e) => patch(row.id, key, e.target.value)} />
                    </td>
                  ))}
                  <td className="p-1">
                    <select className="h-9 rounded border border-border bg-surface" value={row.phase} onChange={(e) => patch(row.id, "phase", e.target.value)}>
                      <option value="3">3상</option>
                      <option value="1">단상</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <select
                      className="h-9 rounded border border-border bg-surface"
                      value={row.pole ?? "RST"}
                      disabled={row.phase === "3"}
                      onChange={(e) => patch(row.id, "pole", e.target.value)}
                    >
                      <option value="RST">RST</option>
                      <option value="R">R / L1</option>
                      <option value="S">S / L2</option>
                      <option value="T">T / L3</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <input className={inputCell} value={row.panel} onChange={(e) => patch(row.id, "panel", e.target.value)} />
                  </td>
                  <td className={computedCell}>{p.demandKw.toFixed(2)}</td>
                  <td className={computedCell}>{p.demandKva.toFixed(2)}</td>
                  <td className={computedCell}>{p.demandKvar.toFixed(2)}</td>
                  <td className={computedCell}>{p.currentA.toFixed(1)}</td>
                  <td className="p-1">
                    <input className={inputCell} value={row.remark} onChange={(e) => patch(row.id, "remark", e.target.value)} />
                  </td>
                  <td className="p-1">
                    <button type="button" className="text-xs text-danger-ink" onClick={() => setRows((c) => c.filter((r) => r.id !== row.id))}>
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="mt-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">선택 부하 검토</p>
          <p className="mt-1 text-xs text-muted">
            {selected.name || "(이름 없음)"} · {rowPowers(selected).connectedKw.toFixed(2)} kW · {selected.voltage} V · {selected.phase === "1" ? "단상" : "3상"} · PF {selected.pf} · η {selected.efficiency}
          </p>
          <div className="mt-2">
            <ReviewLinks {...rowHandoff(selected)} />
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">행을 선택하면 케이블·전압강하·차단기 검토로 값을 넘깁니다.</p>
      )}

      {selectedPanelGroup && sampleRow ? (
        <div className="mt-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-medium">선택 Panel {selectedPanelGroup.key} 검토</p>
          <div className="mt-2">
            <ReviewLinks {...panelHandoff(selectedPanelGroup, sampleRow.voltage, sampleRow.phase)} efficiency={1} />
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white dark:text-ink" onClick={() => setRows((c) => [...c, emptyLoadRow()])}>
          부하 행 추가
        </button>
        <button
          type="button"
          className="h-11 rounded-xl border border-border px-4 text-sm"
          onClick={() => downloadText("ampory-load-schedule.csv", exportLoadScheduleCsv(rows, equipment))}
        >
          CSV 내보내기
        </button>
        <label className="inline-flex h-11 cursor-pointer items-center rounded-xl border border-border px-4 text-sm">
          CSV 가져오기
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file.text().then((text) => {
                const imported = loadRowsFromCsv(text);
                setImportErrors(imported.errors);
                if (imported.rows.length) setRows(imported.rows);
              });
              event.target.value = "";
            }}
          />
        </label>
        <button type="button" className="h-11 rounded-xl border border-border px-4 text-sm" onClick={writePanelSchedule}>
          Panel Schedule 만들기
        </button>
        <button type="button" className="h-11 rounded-xl border border-border px-4 text-sm" onClick={writeCableSchedule}>
          Cable Schedule 검토 목록 만들기
        </button>
      </div>

      {importErrors.length > 0 ? (
        <div className="mt-3 rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-medium">CSV 가져오기 경고</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {importErrors.map((err) => (
              <li key={`${err.line}-${err.message}`}>
                {err.line}행: {err.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <h2 className="mt-8 text-lg font-semibold">분류별 Summary</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-info text-left text-xs">
            <tr>
              {["분류", "Connected", "Demand", "kVA", "Current", "행"].map((h) => (
                <th key={h} className="px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.key} className="border-t border-border">
                <td className="px-3 py-2">{c.key}</td>
                <td className="px-3 py-2 tabular-nums">{c.connectedKw.toFixed(2)} kW</td>
                <td className="px-3 py-2 tabular-nums">{c.demandKw.toFixed(2)} kW</td>
                <td className="px-3 py-2 tabular-nums">{c.demandKva.toFixed(2)}</td>
                <td className="px-3 py-2 tabular-nums">{c.currentA.toFixed(1)} A</td>
                <td className="px-3 py-2 tabular-nums">{c.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Panel / DB별 Summary</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-info text-left text-xs">
            <tr>
              {["Panel", "Connected", "Demand", "kVA", "Current", "행"].map((h) => (
                <th key={h} className="px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {panels.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-muted" colSpan={6}>
                  Panel 이름이 있는 행이 없습니다.
                </td>
              </tr>
            ) : (
              panels.map((c) => (
                <tr key={c.key} className="border-t border-border">
                  <td className="px-3 py-2">{c.key}</td>
                  <td className="px-3 py-2 tabular-nums">{c.connectedKw.toFixed(2)} kW</td>
                  <td className="px-3 py-2 tabular-nums">{c.demandKw.toFixed(2)} kW</td>
                  <td className="px-3 py-2 tabular-nums">{c.demandKva.toFixed(2)}</td>
                  <td className="px-3 py-2 tabular-nums">{c.currentA.toFixed(1)} A</td>
                  <td className="px-3 py-2 tabular-nums">{c.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold">상별 부하 분석</h2>
      <section className="mt-3 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-3">
        <p>
          Phase A / R / L1
          <strong className="block text-xl tabular-nums">
            {phases.kw.r.toFixed(2)} kW · {phases.amp.r.toFixed(1)} A
          </strong>
        </p>
        <p>
          Phase B / S / L2
          <strong className="block text-xl tabular-nums">
            {phases.kw.s.toFixed(2)} kW · {phases.amp.s.toFixed(1)} A
          </strong>
        </p>
        <p>
          Phase C / T / L3
          <strong className="block text-xl tabular-nums">
            {phases.kw.t.toFixed(2)} kW · {phases.amp.t.toFixed(1)} A
          </strong>
        </p>
        <p>
          최대상
          <strong className="block text-xl">{phases.maxPhase}</strong>
        </p>
        <p>
          최소상
          <strong className="block text-xl">{phases.minPhase}</strong>
        </p>
        <p>
          Phase Imbalance
          <strong className="block text-xl tabular-nums">{phases.imbalanceKwPct.toFixed(1)} %</strong>
          <span className="text-xs text-muted">수요 kW 기준 · 전류 {phases.imbalanceAmpPct.toFixed(1)} %</span>
        </p>
      </section>
      <button
        type="button"
        className="mt-3 h-11 rounded-xl border border-border px-4 text-sm"
        onClick={() => {
          const out = suggestPhasePlacement(rows);
          setRows(out.rows);
          setPhaseNote(
            out.changed === 0
              ? "단상 부하가 없거나 이미 가벼운 상에 있습니다. 추천 배치를 확정으로 쓰지 마세요."
              : `단상 ${out.changed}건을 가벼운 상으로 옮기는 추천을 적용했습니다. 현장 회로와 맞는지 확인하세요.`,
          );
        }}
      >
        단상 상배치 추천 적용
      </button>
      {phaseNote ? <p className="mt-2 text-xs text-muted">{phaseNote}</p> : <p className="mt-2 text-xs text-muted">자동 상평형이 아니라 추천입니다. 정확성을 보장하지 않습니다.</p>}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={buildHandoffHref("/tools/electrical/transformer-sizing", { demandKw: allSummary.demandKw, pf: allSummary.pf })}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-primary"
        >
          변압기 용량 검토
        </Link>
        <Link
          href={buildHandoffHref("/tools/electrical/transformer-load", {
            loadMode: "measured",
            designKva: Number(allSummary.demandKva.toFixed(4)),
          })}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-primary"
        >
          변압기 실측 부하율
        </Link>
        <Link
          href={buildHandoffHref("/tools/facility/field-compare", {
            designValue: Number(allSummary.demandKva.toFixed(4)),
            unit: "kVA",
          })}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-primary"
        >
          설계값 vs 실측 비교
        </Link>
        <Link href="/tools/facility/phase-unbalance" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-primary">
          3상 불평형 실측
        </Link>
        <Link
          href={buildHandoffHref("/tools/facility/generator-sizing", {
            staticKw: gen.staticKw,
            motorKw: gen.motorKw,
            upsKw: gen.upsKw,
            pf: gen.pf,
          })}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-primary"
        >
          발전기 용량 검토
        </Link>
        <Link
          href={buildHandoffHref("/tools/facility/ups-capacity", {
            loadKw: upsDemand > 0 ? upsDemand : allSummary.demandKw,
            pf: allSummary.pf,
          })}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-primary"
        >
          UPS 용량 검토
        </Link>
        <Link href="/tools/schedules/panel" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-primary">
          Panel Schedule로 이동
        </Link>
        <Link href="/tools/schedules/cable" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-primary">
          Cable Schedule로 이동
        </Link>
      </div>
      {panelFilter ? <p className="mt-2 text-xs text-muted">표·분류 Summary는 Panel 필터가 적용됩니다. 상단 설비 합계와 변압기·발전기 버튼은 전체 부하 기준입니다.</p> : null}

      {formula ? <TechnicalDisclosure formula={formula} /> : <EngineeringDisclaimer />}
    </div>
  );
}
