"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ShareDialog } from "@/components/calculators/dialogs";
import { ResultPanel } from "@/components/calculators/result-panel";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { WarningPanel } from "@/components/calculators/warning-panel";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { formSchemas, type FieldDef } from "@/lib/calculations/schemas";
import { engines } from "@/lib/calculations/engines";
import { usePreferences } from "@/components/providers/preferences-provider";
import { pushRecentTool } from "@/lib/storage/local";
import type { CalculatorTool, CalculationOutcome, FormulaDefinition, ReferenceArticle } from "@/lib/types";
import { getCategoryById } from "@/lib/data/categories";

function visible(field: FieldDef, values: Record<string, string>) {
  if (!field.visibleWhen) return true;
  return field.visibleWhen.values.includes(values[field.visibleWhen.field] ?? "");
}

export function CalculatorWorkspace({
  tool,
  formula,
  related,
  articles,
}: {
  tool: CalculatorTool;
  formula: FormulaDefinition;
  related: CalculatorTool[];
  articles: ReferenceArticle[];
}) {
  const schema = formSchemas[tool.slug];
  const { prefs } = usePreferences();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults = { ...(schema?.defaults ?? {}) };
    if (tool.slug.includes("current")) {
      defaults.voltage = String(prefs.defaultVoltage);
    }
    return defaults;
  });
  const [dirty, setDirty] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [outcome, setOutcome] = useState<CalculationOutcome | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const formId = useId();
  const category = getCategoryById(tool.categoryId);
  const complex = schema?.layout === "complex";

  useEffect(() => {
    pushRecentTool(tool.id);
  }, [tool.id]);

  const fields = useMemo(() => schema?.fields ?? [], [schema]);

  function setField(id: string, value: string) {
    setDirty(true);
    setValues((current) => ({ ...current, [id]: value }));
  }

  function calculate() {
    const engine = engines[tool.slug];
    if (!engine) return;
    setOutcome(engine(values, prefs.precision));
  }

  function reset() {
    if (schema) setValues(schema.defaults);
    setOutcome(null);
    setDirty(false);
    setConfirmReset(false);
  }

  const crumbs = [
    { href: "/", label: "홈" },
    {
      href: tool.domain === "facility" ? "/tools/facility" : "/tools/electrical",
      label: tool.domain === "facility" ? "시설" : "전기",
    },
    { label: tool.name },
  ];

  const shareSummary =
    outcome && outcome.ok
      ? outcome.metrics.map((metric) => `${metric.label}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`).join("\n")
      : tool.description;

  if (!schema) {
    return <p>이 계산기의 입력 정의가 없습니다.</p>;
  }

  const fieldList = fields.map((field) => {
    if (!visible(field, values)) return null;
    if (field.advanced && !showAdvanced) return null;
    const error = outcome && !outcome.ok ? outcome.fieldErrors[field.id] : undefined;
    const inputId = `${formId}-${field.id}`;
    const errorId = `${inputId}-error`;
    return (
      <div key={field.id}>
        <label htmlFor={inputId} className="text-sm font-medium">
          {field.label}
          {field.required ? <span className="text-danger-ink"> *</span> : null}
        </label>
        {field.hint ? <p className="mt-1 text-xs text-muted">{field.hint}</p> : null}
        {field.kind === "select" ? (
          <select
            id={inputId}
            className="mt-1.5 h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            value={values[field.id] ?? ""}
            onChange={(event) => setField(field.id, event.target.value)}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="mt-1.5 flex gap-2">
            <input
              id={inputId}
              inputMode="decimal"
              type="text"
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder}
              value={values[field.id] ?? ""}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-base"
              onChange={(event) => setField(field.id, event.target.value)}
            />
            {field.unitField && field.units ? (
              <select
                aria-label={`${field.label} 단위`}
                className="h-11 w-[88px] rounded-lg border border-border bg-surface px-2 text-sm"
                value={values[field.unitField] ?? field.units[0]?.value}
                onChange={(event) => setField(field.unitField!, event.target.value)}
              >
                {field.units.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        )}
        {error ? (
          <p id={errorId} className="mt-1 flex items-center gap-1 text-sm text-danger-ink">
            <AlertTriangle className="size-3.5" aria-hidden />
            {error}
          </p>
        ) : null}
      </div>
    );
  });

  const actions = (
    <div className="mt-6 space-y-2">
      {fields.some((field) => field.advanced) ? (
        <button type="button" className="text-sm text-primary" onClick={() => setShowAdvanced((v) => !v)}>
          {showAdvanced ? "고급 옵션 숨기기" : "고급 옵션"}
        </button>
      ) : null}
      {outcome && !outcome.ok && outcome.formError ? (
        <WarningPanel warnings={[{ level: "error", title: "계산 불가", message: outcome.formError }]} />
      ) : null}
      <button type="submit" className="h-12 w-full rounded-lg bg-primary text-sm font-semibold text-white dark:text-ink">
        계산하기
      </button>
      <button
        type="button"
        className="h-10 w-full text-sm text-muted hover:text-ink"
        onClick={() => (dirty ? setConfirmReset(true) : reset())}
      >
        입력 초기화
      </button>
    </div>
  );

  const resultBlock =
    outcome?.ok ? (
      <ResultPanel result={outcome} split={complex} />
    ) : (
      <div
        className={
          complex
            ? "mt-6 border-t border-border pt-5 text-sm leading-6 text-muted lg:mt-0 lg:border-t-0 lg:pt-0"
            : "mt-6 border-t border-border pt-5 text-sm leading-6 text-muted"
        }
      >
        값을 입력한 뒤 계산하기를 누르면 결과가 여기에 표시됩니다.
      </div>
    );

  return (
    <div className={complex ? "mx-auto w-full max-w-5xl" : "mx-auto w-full max-w-[840px]"}>
      <Breadcrumb items={crumbs} compact />
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          {category ? <p className="text-xs font-medium text-muted">{category.name}</p> : null}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{tool.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{tool.description}</p>
        </div>
        <FavoriteButton toolId={tool.id} toolName={tool.name} />
      </header>

      <form
        className={`rounded-[16px] border border-border bg-card p-5 sm:p-6 ${
          complex ? "lg:grid lg:grid-cols-2 lg:gap-10" : ""
        }`}
        onSubmit={(event) => {
          event.preventDefault();
          calculate();
        }}
      >
        <div>
          <div className="space-y-3.5">{fieldList}</div>
          {actions}
        </div>
        <div className={complex ? "" : "mt-0"}>{resultBlock}</div>
      </form>

      <TechnicalDisclosure formula={formula} />

      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm">
        <button type="button" className="text-muted hover:text-primary" onClick={() => setShareOpen(true)}>
          공유
        </button>
        {related.map((item) => (
          <Link key={item.id} href={item.href} className="text-muted hover:text-primary">
            {item.name}
          </Link>
        ))}
        {articles.map((article) => (
          <Link key={article.id} href={article.href} className="text-muted hover:text-primary">
            {article.title}
          </Link>
        ))}
      </nav>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} title={tool.name} summary={shareSummary} />

      {confirmReset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="초기화 확인">
          <button type="button" className="absolute inset-0 bg-ink/40" onClick={() => setConfirmReset(false)} aria-label="취소" />
          <div className="relative w-[min(400px,calc(100%-1.5rem))] rounded-2xl bg-card p-5">
            <h2 className="text-lg font-semibold">입력값을 지울까요?</h2>
            <p className="mt-2 text-sm text-muted">작성 중인 숫자가 모두 기본 예제값으로 돌아갑니다.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="h-11 rounded-xl border border-border" onClick={() => setConfirmReset(false)}>
                취소
              </button>
              <button type="button" className="h-11 rounded-xl bg-primary text-white dark:text-ink" onClick={reset}>
                초기화
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
