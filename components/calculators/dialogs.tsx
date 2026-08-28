"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";
import type { FormulaDefinition } from "@/lib/types";

export function FormulaDrawer({ formula, open, onClose }: { formula: FormulaDefinition; open: boolean; onClose: () => void }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="닫기" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-[var(--shadow)] duration-200">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {formula.title}
          </h2>
          <button type="button" className="rounded-full p-2 hover:bg-info" onClick={onClose} aria-label="공식 닫기">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-5 overflow-y-auto px-5 py-5 text-sm leading-6">
          <p className="rounded-2xl bg-info px-4 py-3 font-mono text-base text-primary">{formula.formula}</p>
          <section>
            <h3 className="font-semibold">변수</h3>
            <ul className="mt-2 space-y-2">
              {formula.variables.map((variable) => (
                <li key={variable.symbol}>
                  <span className="font-mono text-primary">{variable.symbol}</span> · {variable.name} ({variable.unit}) —{" "}
                  {variable.description}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="font-semibold">단위</h3>
            <p className="mt-1 text-muted">{formula.units.join(", ")}</p>
          </section>
          <section>
            <h3 className="font-semibold">예제</h3>
            <p className="mt-1 font-medium">{formula.example.title}</p>
            <p className="text-muted">{formula.example.given}</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {formula.example.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="mt-2 font-medium">결과: {formula.example.result}</p>
          </section>
        </div>
      </aside>
    </div>
  );
}

export function AssumptionDialog({
  formula,
  open,
  onClose,
}: {
  formula: FormulaDefinition;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="닫기" onClick={onClose} />
      <div className="relative m-3 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow)]">
        <h2 id={titleId} className="text-lg font-semibold">
          계산 가정과 한계
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          {formula.assumptions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3 className="mt-5 font-semibold">한계</h3>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
          {formula.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <button type="button" className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white dark:text-ink" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}

export function ShareDialog({
  open,
  onClose,
  title,
  summary,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  summary: string;
}) {
  const [copied, setCopied] = useState<"link" | "summary" | null>(null);
  if (!open) return null;

  async function copy(kind: "link" | "summary") {
    const text = kind === "link" ? window.location.href : `${title}\n${summary}`;
    await navigator.clipboard.writeText(text);
    setCopied(kind);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="계산 공유">
      <button type="button" className="absolute inset-0 bg-ink/40" onClick={onClose} aria-label="닫기" />
      <div className="relative w-[min(420px,calc(100%-1.5rem))] rounded-2xl bg-card p-5 shadow-[var(--shadow)]">
        <h2 className="text-lg font-semibold">계산 공유</h2>
        <p className="mt-2 text-sm text-muted">로그인 없이 현재 페이지 주소 또는 결과 요약을 복사합니다.</p>
        <div className="mt-4 grid gap-2">
          <button type="button" className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-info" onClick={() => copy("link")}>
            {copied === "link" ? "주소를 복사했습니다" : "계산기 링크 복사"}
          </button>
          <button type="button" className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-info" onClick={() => copy("summary")}>
            {copied === "summary" ? "요약을 복사했습니다" : "결과 요약 복사"}
          </button>
        </div>
        <button type="button" className="mt-3 w-full text-sm text-muted" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
