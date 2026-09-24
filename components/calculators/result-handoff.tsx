"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/providers/toast-provider";
import {
  copyTextFromResult,
  filledSiteNotes,
  formatResultStamp,
  resultLines,
  resultPdfFilename,
  type SiteNotes,
} from "@/lib/calculators/result-sheet";
import type { CalculationResult } from "@/lib/types";

type PrintJob = SiteNotes & { id: number; stamp: string; filename: string };

/** 화면 결과를 복사하고, 결과서만 인쇄합니다. 계산은 다시 하지 않습니다. */
export function ResultHandoff({
  result,
  title,
  pageUrl,
}: {
  result: CalculationResult;
  title: string;
  pageUrl: string;
}) {
  const { push } = useToast();
  const titleId = useId();
  const pdfButton = useRef<HTMLButtonElement>(null);
  const siteInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<SiteNotes>({ site: "", equipment: "", memo: "" });
  const [job, setJob] = useState<PrintJob | null>(null);
  const [mounted, setMounted] = useState(false);
  const printed = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    siteInput.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!job || printed.current === job.id) return;
    printed.current = job.id;
    const previousTitle = document.title;
    const style = document.createElement("style");
    style.textContent = "@page { size: A4; margin: 16mm; }";
    document.head.appendChild(style);
    document.title = job.filename.replace(/\.pdf$/, "");
    document.documentElement.classList.add("ampory-print-sheet");
    const finish = () => {
      document.title = previousTitle;
      document.documentElement.classList.remove("ampory-print-sheet");
      style.remove();
    };
    window.addEventListener("afterprint", finish, { once: true });
    window.print();
  }, [job]);

  async function copyResult() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard");
      await navigator.clipboard.writeText(copyTextFromResult(result, title, pageUrl));
      push("계산 결과를 복사했습니다.");
    } catch {
      push("계산 결과를 복사하지 못했습니다.");
    }
  }

  function savePdf() {
    const now = new Date();
    setJob({
      id: now.getTime(),
      site: notes.site,
      equipment: notes.equipment,
      memo: notes.memo,
      stamp: formatResultStamp(now),
      filename: resultPdfFilename(title, now),
    });
    setOpen(false);
    pdfButton.current?.focus();
  }

  const lines = resultLines(result);
  const primary = lines[0];
  const rest = lines.slice(1);
  const formula = result.formulaUsed.trim();
  const formulaLabel = formula.includes("=") ? "계산식" : "계산 기준";
  const siteRows = filledSiteNotes(job ?? {});

  return (
    <>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium"
          onClick={copyResult}
        >
          결과 복사
        </button>
        <button
          ref={pdfButton}
          type="button"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-medium"
          onClick={() => setOpen(true)}
        >
          PDF 저장
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="닫기" onClick={() => setOpen(false)} />
          <div className="relative m-3 w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow)]">
            <h2 id={titleId} className="text-lg font-semibold">
              PDF로 저장
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">현장 정보는 선택입니다. 비워도 저장할 수 있습니다.</p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium" htmlFor="handoff-site">
                현장명
                <input
                  ref={siteInput}
                  id="handoff-site"
                  value={notes.site ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, site: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-normal"
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm font-medium" htmlFor="handoff-equipment">
                설비명
                <input
                  id="handoff-equipment"
                  value={notes.equipment ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, equipment: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-normal"
                  autoComplete="off"
                />
              </label>
              <label className="block text-sm font-medium" htmlFor="handoff-memo">
                메모
                <textarea
                  id="handoff-memo"
                  rows={3}
                  value={notes.memo ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, memo: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm font-normal"
                />
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="h-11 rounded-xl border border-border text-sm" onClick={() => setOpen(false)}>
                닫기
              </button>
              <button type="button" className="h-11 rounded-xl bg-primary text-sm font-medium text-white dark:text-ink" onClick={savePdf}>
                PDF 저장
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mounted
        ? createPortal(
            <article id="ampory-result-sheet" className="ampory-result-sheet" aria-hidden="true">
              <header className="ampory-sheet-brand">
                <p className="ampory-sheet-mark">AMPORY</p>
                <p className="ampory-sheet-doc-title">전기 실무 계산 결과</p>
              </header>
              <h1 className="ampory-sheet-calc">{title}</h1>
              {siteRows.length > 0 ? (
                <section className="ampory-sheet-section">
                  <h2>현장 정보</h2>
                  {siteRows.map((row) => (
                    <p key={row.label} className="ampory-sheet-row">
                      <span>{row.label}</span>
                      <span>{row.value}</span>
                    </p>
                  ))}
                </section>
              ) : null}
              <section className="ampory-sheet-section">
                <h2>입력값</h2>
                {result.inputSummary.map((row, index) => (
                  <p key={`${row.label}-${index}`} className="ampory-sheet-row">
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </p>
                ))}
              </section>
              <section className="ampory-sheet-section">
                <h2>계산 결과</h2>
                {primary ? <p className="ampory-sheet-primary">{primary.value}</p> : null}
                {primary ? <p className="ampory-sheet-primary-label">{primary.label}</p> : null}
                {rest.map((row, index) => (
                  <p key={`${row.label}-${index}`} className="ampory-sheet-row">
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </p>
                ))}
              </section>
              {formula ? (
                <section className="ampory-sheet-section">
                  <h2>{formulaLabel}</h2>
                  <p className="ampory-sheet-formula">{formula}</p>
                </section>
              ) : null}
              <section className="ampory-sheet-meta">
                <p className="ampory-sheet-row">
                  <span>계산일시</span>
                  <span>{job?.stamp ?? ""}</span>
                </p>
                <p className="ampory-sheet-row">
                  <span>출처</span>
                  <span>Ampory · {pageUrl}</span>
                </p>
              </section>
              <p className="ampory-sheet-note">
                Ampory의 계산 결과는 실무 참고를 위한 보조 자료입니다. 실제 설계·시공·검사 및 기기 선정 시에는 현장 조건, 관련
                기준 및 제조사 자료 등을 함께 확인하세요.
              </p>
            </article>,
            document.body,
          )
        : null}
    </>
  );
}
