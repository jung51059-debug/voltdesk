"use client";

import { useState } from "react";
import { UNIT_GROUPS, UNIT_FACTORS, rlcImpedance } from "@/lib/calculations/impedance";
import { convertEntry } from '@/lib/us/units';
import { parseRlc } from "@/lib/calculations/impedance-engine";
import { rlcDefaults } from "@/lib/calculations/impedance-schemas";
import { ImpedanceTriangle, LineChart, PhaseWave } from "@/components/calculators/impedance-visuals";

const US_DEFAULTS = { ...rlcDefaults, voltage: "208", frequency: "60" };

const inputClass = "mt-1 h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-base";
const fmt = (n: number | null) =>
  n === null
    ? "N/A"
    : n === 0
      ? "0"
      : Math.abs(n) < 1e-5 || Math.abs(n) >= 1e9
        ? n.toExponential(6)
        : Number(n.toPrecision(9)).toLocaleString("en-US", { maximumSignificantDigits: 9 });

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function Results({ rows }: { rows: [string, number | null, string][] }) {
  return (
    <dl className="grid min-w-0 gap-3 sm:grid-cols-2">
      {rows.map(([label, value, unit]) => (
        <div key={label} className="min-w-0 rounded-xl border border-border p-3">
          <dt className="text-xs text-muted">{label}</dt>
          <dd className="mt-1 break-all font-medium tabular-nums">
            {fmt(value)} {value === null ? "" : unit}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function RlcImpedanceClientUs() {
  const [values, setValues] = useState(US_DEFAULTS);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReturnType<typeof rlcImpedance> | null>(null);
  const [sweep, setSweep] = useState<{ x: number; y: number }[]>([]);

  const set = (key: string, value: string) => {
    setValues(current=>{
      const next={...current,[key]:value};
      if(key.endsWith('Unit')){
        const field=key.slice(0,-4) as 'r'|'l'|'c'|'frequency'|'voltage';
        const oldUnit=current[key as keyof typeof current] as keyof typeof UNIT_FACTORS;
        const newUnit=value as keyof typeof UNIT_FACTORS;
        next[field]=convertEntry(current[field],n=>n*UNIT_FACTORS[oldUnit]/UNIT_FACTORS[newUnit]);
      }
      return next;
    });
    setResult(null);
    setSweep([]);
    setError("");
  };

  function run() {
    try {
      const input = parseRlc(values);
      const r = rlcImpedance(input);
      setResult(r);
      const lo = Math.min(input.frequency, r.resonance ?? input.frequency) / 100;
      const hi = Math.max(input.frequency, r.resonance ?? input.frequency) * 100;
      const freqs = [
        ...Array.from({ length: 101 }, (_, i) => lo * (hi / lo) ** (i / 100)),
        input.frequency,
        ...(r.resonance ? [r.resonance] : []),
      ].sort((a, b) => a - b);
      setSweep(freqs.map((f) => ({ x: f, y: rlcImpedance({ ...input, frequency: f }).z })));
      setError("");
    } catch (e) {
      setResult(null);
      setSweep([]);
      setError(e instanceof Error&&!/[\u3131-\uD79D]/.test(e.message)?e.message:'Check the series circuit, units and numeric ranges. R and L must be nonnegative; capacitance and frequency must be positive.');
    }
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        run();
      }}
      className="grid min-w-0 gap-6 rounded-2xl border border-border bg-card p-4 sm:p-6 lg:grid-cols-2"
    >
      <div className="min-w-0 space-y-4">
        <Field label="Series circuit">
          <select className={inputClass} name="circuit" value={values.circuit} onChange={(e) => set("circuit", e.target.value)}>
            {["R", "L", "C", "RL", "RC", "LC", "RLC"].map((c) => (
              <option key={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        {(
          [
            ["r", "Resistance R", "resistance", "R"],
            ["l", "Inductance L", "inductance", "L"],
            ["c", "Capacitance C", "capacitance", "C"],
            ["frequency", "Frequency f", "frequency", ""],
            ["voltage", "AC RMS voltage", "voltage", ""],
          ] as const
        )
          .filter(([, , , letter]) => !letter || values.circuit.includes(letter))
          .map(([key, label, group]) => (
            <div key={key} className="grid min-w-0 grid-cols-[minmax(0,1fr)_6rem] items-end gap-2">
              <Field label={label}>
                <input
                  className={inputClass}
                  name={key}
                  type="number"
                  step="any"
                  value={values[key]}
                  onChange={(e) => set(key, e.target.value)}
                />
              </Field>
              <Field label={`${label} unit`}>
                <select
                  className={inputClass}
                  name={`${key}Unit`}
                  value={values[`${key}Unit`]}
                  onChange={(e) => set(`${key}Unit`, e.target.value)}
                >
                  {UNIT_GROUPS[group].map((u) => (
                    <option key={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ))}
        <p className="text-xs leading-6 text-muted">
          Steady-state sinusoidal series circuit. No parallel topology, tolerance, or transient response. 0 Hz with
          capacitance and 0 F are rejected.
        </p>
        <button className="h-11 w-full rounded-xl bg-primary font-medium text-white" type="submit">
          Calculate impedance
        </button>
        <button className="h-11 w-full rounded-xl border border-border font-medium" type="button" onClick={()=>{setValues(US_DEFAULTS);setResult(null);setSweep([]);setError('');}}>Reset</button>
      </div>
      <section aria-live="polite" className="min-w-0">
        {error ? (
          <p role="alert" className="text-danger-ink">
            {error}
          </p>
        ) : null}
        {result ? (
          <>
            <h2 className="mb-3 font-semibold">
              Series results ·{" "}
              {result.relation === "지상"
                ? "lagging PF"
                : result.relation === "진상"
                  ? "leading PF"
                  : result.relation === "동상"
                    ? "unity PF"
                    : result.relation}
            </h2>
            <Results
              rows={[
                ["Inductive reactance XL", result.xl, "Ω"],
                ["Capacitive reactance XC", result.xc, "Ω"],
                ["Net reactance X", result.x, "Ω"],
                ["Impedance magnitude |Z|", result.z, "Ω"],
                ["Phase angle", result.angle, "°"],
                ["Power factor", result.pf, ""],
                ["RMS current", result.current, "A"],
                ["Real power", result.p, "W"],
                ["Reactive power", result.q, "var"],
                ["Apparent power", result.s, "VA"],
                ["Resonant frequency", result.resonance, "Hz"],
              ]}
            />
            <p className="mt-3 break-all text-sm">
              Z = {fmt(result.r)} {result.x < 0 ? "−" : "+"} j{fmt(Math.abs(result.x))} Ω
            </p>
            <ImpedanceTriangle r={result.r} x={result.x} locale="en" />
            <PhaseWave angle={result.angle} locale="en" />
          </>
        ) : !error ? (
          <p className="text-sm text-muted">Enter values and calculate.</p>
        ) : null}
        {sweep.length ? (
          <section className="mt-6 min-w-0">
            <h2 className="font-semibold">|Z| vs frequency</h2>
            <LineChart title="|Z| vs frequency (Hz)" rows={sweep} logX marker={result?.resonance} locale="en" />
          </section>
        ) : null}
      </section>
    </form>
  );
}
