"use client";

import Link from "next/link";
import { useId, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { UsGuidePanel } from "@/components/calculators/us/us-guide-panel";
import { UsResultPanel } from "@/components/calculators/us/us-result-panel";
import { WarningPanel } from "@/components/calculators/warning-panel";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { formSchemas, type FieldDef } from "@/lib/calculations/schemas";
import { engines } from "@/lib/calculations/engines";
import { convertSchemaValue, validateUsSchemaValues } from '@/lib/us/schema-values';
import { usePreferences } from "@/components/providers/preferences-provider";
import { REGION_US } from "@/lib/region/config";
import type { FormulaDefinition } from "@/lib/types";
import { getCategoryById } from "@/lib/data/categories";
import { getUsCalculatorContent } from "@/lib/us/content/registry";
import { usCalculatorDefaults } from "@/lib/us/defaults";
import { localizeOutcome } from "@/lib/us/metrics-en";
import { getUsRelatedPresentations } from "@/lib/us/related-tools";
import { englishUnitAria, localizeFormSchema } from "@/lib/us/schema-en";
import type { UsToolPresentation } from "@/lib/us/tool-presentation";
import { usCategoryHref, usCategoryLabel } from "@/lib/us/tool-presentation";
import { regionalPath } from "@/lib/region/config";

function visible(field: FieldDef, values: Record<string, string>) {
  if (!field.visibleWhen) return true;
  return field.visibleWhen.values.includes(values[field.visibleWhen.field] ?? "");
}

function isBasicDetailedToggle(field: FieldDef) {
  return (
    field.id === "mode" &&
    Boolean(field.options?.some((option) => option.value === "basic")) &&
    Boolean(field.options?.some((option) => option.value === "detailed"))
  );
}

function renderField(
  field: FieldDef,
  values: Record<string, string>,
  setField: (id: string, value: string) => void,
  formId: string,
  error?: string,
) {
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
      ) : field.kind === "textarea" ? (
        <textarea
          id={inputId}
          rows={4}
          placeholder={field.placeholder}
          value={values[field.id] ?? ""}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2 text-base"
          onChange={(event) => setField(field.id, event.target.value)}
        />
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
              aria-label={englishUnitAria(field.label)}
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
}

export function UsCalculatorWorkspace({ tool, formula }: { tool: UsToolPresentation; formula: FormulaDefinition }) {
  const rawSchema = formSchemas[tool.slug];
  const schema = rawSchema ? localizeFormSchema(tool.slug, rawSchema) : undefined;
  const { prefs } = usePreferences();
  const content = getUsCalculatorContent(tool.slug);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults = usCalculatorDefaults(tool.slug, { ...(schema?.defaults ?? {}) });
    if (tool.slug.includes("current") && tool.slug !== "contract-power-current") {
      defaults.voltage = defaults.voltage || String(REGION_US.defaultVoltageV);
    }
    return defaults;
  });
  const [dirty, setDirty] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [outcome, setOutcome] = useState<ReturnType<typeof localizeOutcome>>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const formId = useId();
  const category = getCategoryById(tool.categoryId);
  const complex = schema?.layout === "complex";

  const fields = useMemo(() => schema?.fields ?? [], [schema]);
  const modeField = fields.find(isBasicDetailedToggle);
  const basicFields = fields.filter((field) => !field.advanced && !isBasicDetailedToggle(field));
  const advancedFields = fields.filter((field) => field.advanced);

  function setField(id: string, value: string) {
    const next = { ...values, [id]: value };
    const unitField=schema?.fields.find(field=>field.unitField===id);
    if(unitField) next[unitField.id]=convertSchemaValue(values[unitField.id]??'',values[id],value);
    setValues(next);
    setDirty(true);
    if (tool.slug === "transformer-impedance") {
      setOutcome(localizeOutcome(engines[tool.slug](next, prefs.precision)));
      setDirty(false);
    }
    if (id === "mode") setShowAdvanced(value === "detailed");
  }

  function calculate() {
    const engine = engines[tool.slug];
    if (!engine) return;
    const errors=schema?validateUsSchemaValues(schema,values):{};
    if(Object.keys(errors).length){setOutcome({ok:false,fieldErrors:errors,formError:'Check the highlighted inputs.'});return;}
    const next = localizeOutcome(engine(values, prefs.precision));
    if (next?.ok) {
      const stripped = { ...next, reviewStatus: undefined };
      setOutcome(stripped);
    } else {
      setOutcome(next);
    }
  }

  function reset() {
    if (schema) setValues(usCalculatorDefaults(tool.slug, schema.defaults));
    setOutcome(null);
    setDirty(false);
    setShowAdvanced(false);
    setConfirmReset(false);
  }

  const hub = tool.domain === "facility" ? "/us/tools/facility" : "/us/tools/electrical";
  const crumbs = [
    { href: regionalPath("US", "/"), label: "Home" },
    { href: hub, label: tool.domain === "facility" ? "Facility" : "Electrical" },
    ...(category
      ? [{ href: usCategoryHref(category.slug), label: usCategoryLabel(category.id) }]
      : []),
    { label: tool.pageHeading },
  ];

  if (!schema) {
    return <p className="text-sm text-muted">This calculator has no input schema on the US site yet.</p>;
  }

  function fieldNode(field: FieldDef) {
    if (!visible(field, values)) return null;
    const error = outcome && !outcome.ok ? outcome.fieldErrors[field.id] : undefined;
    return renderField(field, values, setField, formId, error);
  }

  function fieldGroup(fieldsToRender: FieldDef[]) {
    const nodes: ReactNode[] = [];
    let lastSection: string | undefined;
    for (const field of fieldsToRender) {
      const node = fieldNode(field);
      if (!node) continue;
      if (field.section && field.section !== lastSection) {
        nodes.push(
          <p key={`section-${field.section}`} className="pt-1 text-xs font-semibold tracking-wide text-primary">
            {field.section}
          </p>,
        );
        lastSection = field.section;
      }
      nodes.push(node);
    }
    return nodes;
  }

  const related = getUsRelatedPresentations(tool);

  return (
    <div className={complex ? "mx-auto w-full max-w-5xl" : "mx-auto w-full max-w-[840px]"}>
      <Breadcrumb items={crumbs} compact />
      <header className="mb-6">
        {category ? <p className="text-xs font-medium text-muted">{usCategoryLabel(category.id)}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{tool.pageHeading}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{tool.description}</p>
      </header>

      <form
        className={`rounded-[16px] border border-border bg-card p-5 sm:p-6 ${complex ? "lg:grid lg:grid-cols-2 lg:gap-10" : ""}`}
        onSubmit={(event) => {
          event.preventDefault();
          calculate();
        }}
      >
        <div>
          {modeField ? (
            <div className="mb-4 grid grid-cols-2 gap-2" role="group" aria-label="Calculation mode">
              {modeField.options?.map((option) => {
                const active = (values.mode ?? "basic") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`h-11 rounded-xl text-sm font-medium ${
                      active ? "bg-primary text-white dark:text-ink" : "border border-border bg-surface"
                    }`}
                    onClick={() => setField("mode", option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="space-y-3.5">{fieldGroup(basicFields)}</div>
          {advancedFields.length > 0 ? (
            <details
              className="mt-4 rounded-xl border border-border bg-surface px-3 py-2"
              open={modeField ? values.mode === "detailed" : showAdvanced}
              onToggle={(event) => {
                const open = (event.target as HTMLDetailsElement).open;
                setShowAdvanced(open);
                if (!modeField) return;
                const next = open ? "detailed" : "basic";
                if ((values.mode ?? "basic") !== next) setField("mode", next);
              }}
            >
              <summary className="cursor-pointer py-2 text-sm font-medium text-primary">Advanced inputs</summary>
              <div className="space-y-3.5 pb-2 pt-1">{fieldGroup(advancedFields)}</div>
            </details>
          ) : null}
          <div className="mt-6 space-y-2">
            {outcome && !outcome.ok && outcome.formError ? (
              <WarningPanel
                uiLocale="en"
                warnings={[{ level: "error", title: "Cannot calculate", message: outcome.formError }]}
              />
            ) : null}
            <button type="submit" className="h-12 w-full rounded-lg bg-primary text-base font-semibold text-white shadow-sm dark:text-ink">
              Calculate
            </button>
            <button
              type="button"
              className="h-10 w-full text-sm text-muted hover:text-ink"
              onClick={() => (dirty ? setConfirmReset(true) : reset())}
            >
              Reset inputs
            </button>
          </div>
        </div>
        <div>
          {outcome?.ok ? (
            <UsResultPanel result={outcome} split={complex} keepNumbersTogether={tool.slug === "transformer-impedance"} />
          ) : (
            <div className="mt-6 border-t border-border pt-5 text-sm leading-6 text-muted lg:mt-0 lg:border-t-0 lg:pt-0">
              Enter values and press Calculate to see results here.
            </div>
          )}
        </div>
      </form>

      {content ? <UsGuidePanel content={content} formula={formula} /> : null}

      {tool.faqs.length > 0 ? (
        <section className="mt-8 border-t border-border pt-6">
          <h2 className="text-lg font-semibold">FAQ</h2>
          <dl className="mt-3 space-y-4">
            {tool.faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-sm font-medium">{faq.question}</dt>
                <dd className="mt-1 text-sm leading-6 text-muted">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {related.length > 0 ? (
        <nav className="mt-8 border-t border-border pt-6" aria-label="Related calculators">
          <h2 className="text-lg font-semibold">Related calculators</h2>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {related.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="text-muted hover:text-primary">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {confirmReset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Confirm reset">
          <button type="button" className="absolute inset-0 bg-ink/40" onClick={() => setConfirmReset(false)} aria-label="Cancel" />
          <div className="relative w-[min(400px,calc(100%-1.5rem))] rounded-2xl bg-card p-5">
            <h2 className="text-lg font-semibold">Reset all inputs?</h2>
            <p className="mt-2 text-sm text-muted">Values return to the calculator defaults.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="h-11 rounded-xl border border-border" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button type="button" className="h-11 rounded-xl bg-primary text-white dark:text-ink" onClick={reset}>
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
