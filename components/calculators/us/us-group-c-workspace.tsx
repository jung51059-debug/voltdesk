'use client';
import { useId, useState } from 'react';
import { ResultPanel } from '@/components/calculators/result-panel';
import { WarningPanel } from '@/components/calculators/warning-panel';
import { groupCDefaults, runGroupC, type GroupCTool } from '@/lib/us/group-c-tools';
import type { CalculationOutcome } from '@/lib/types';

export function UsGroupCWorkspace({ spec }: { spec: GroupCTool }) {
  const id = useId();
  const [values, setValues] = useState(() => groupCDefaults(spec));
  const [outcome, setOutcome] = useState<CalculationOutcome | null>(null);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setOutcome(runGroupC(spec, values));
        }}
        className="space-y-4"
      >
        {spec.fields.map((field) => (
          <div key={field.id}>
            <label htmlFor={`${id}-${field.id}`} className="text-sm font-medium">
              {field.label} ({field.unit || 'value'})
            </label>
            <input
              id={`${id}-${field.id}`}
              type="text"
              inputMode="decimal"
              required
              value={values[field.id]}
              onChange={(event) => setValues((v) => ({ ...v, [field.id]: event.target.value }))}
              className="mt-1 h-11 w-full rounded-lg border border-border bg-surface px-3"
            />
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          <button className="min-h-11 rounded-lg bg-primary px-5 text-white" type="submit">
            Calculate
          </button>
          <button
            className="min-h-11 rounded-lg border border-border px-5"
            type="button"
            onClick={() => {
              setValues(groupCDefaults(spec));
              setOutcome(null);
            }}
          >
            Reset
          </button>
        </div>
      </form>
      {!outcome?.ok && outcome ? <p role="alert" className="mt-4 text-danger-ink">{outcome.formError}</p> : null}
      {outcome?.ok ? (
        <div className="mt-6" data-testid="us-result">
          <ResultPanel result={outcome} uiLocale="en" />
          <WarningPanel warnings={outcome.warnings} uiLocale="en" />
        </div>
      ) : null}
    </div>
  );
}