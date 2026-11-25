'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { conduitFillPercent, type ConductorFillInput } from '@/lib/us/conduit-fill-physical';
import { UsDevBanner } from '@/components/us/dev-banner';
import { convertArea, convertEntry, type AreaUnit } from '@/lib/us/units';

export function UsConduitFillPage() {
  const [conduit, setConduit] = useState({ value: '178', unit: 'mm²' as AreaUnit });
  const [rows, setRows] = useState<ConductorFillInput[]>([
    { label: 'Circuit 1', areaMm2: 3.31, count: 3 },
    { label: 'Circuit 2', areaMm2: 5.26, count: 1 },
  ]);
  const conduitMm2 = useMemo(
    () => convertArea(Number(conduit.value), conduit.unit, 'mm²'),
    [conduit.value, conduit.unit],
  );
  const { percent, error } = useMemo(() => {
    try {
      return { percent: conduitFillPercent(conduitMm2, rows), error: '' };
    } catch (e) {
      return { percent: NaN, error: e instanceof Error ? e.message : 'Invalid input' };
    }
  }, [conduitMm2, rows]);
  return (
    <article className="mx-auto max-w-3xl space-y-7">
      <UsDevBanner />
      <nav className="text-sm text-muted">
        <Link href="/us">Home</Link> / <Link href="/us/tools/electrical">Electrical</Link> / Conduit fill (physical)
      </nav>
      <h1 className="text-2xl font-semibold">Conduit Fill — Physical Areas</h1>
      <p className="leading-7 text-muted">
        Compute fill percentage from user-supplied raceway internal area and insulated conductor cross-sectional areas. No NEC Chapter 9 table is embedded.
      </p>
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <label className="text-sm font-medium">Raceway internal area</label>
        <div className="flex gap-2">
          <input aria-label="Raceway internal area" className="h-11 min-w-0 flex-1 rounded-lg border px-3" value={conduit.value} onChange={(e) => setConduit((c) => ({ ...c, value: e.target.value }))} />
          <select aria-label="Raceway internal area units" className="h-11 rounded-lg border px-2" value={conduit.unit} onChange={(e) => {const unit=e.target.value as AreaUnit;setConduit(c=>({unit,value:convertEntry(c.value,n=>convertArea(n,c.unit,unit))}));}}>
            <option>mm²</option>
            <option>in²</option>
          </select>
        </div>
        {rows.map((row, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-3">
            <input aria-label={`Conductor group ${i+1} name`} className="h-11 rounded-lg border px-3" value={row.label} onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input className="h-11 rounded-lg border px-3" value={row.areaMm2} onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, areaMm2: Number(e.target.value) } : x)))} aria-label="Area mm2" />
            <input className="h-11 rounded-lg border px-3" value={row.count} onChange={(e) => setRows((r) => r.map((x, j) => (j === i ? { ...x, count: Number(e.target.value) } : x)))} aria-label="Count" />
          </div>
        ))}
        <button type="button" className="min-h-11 rounded-lg border px-4" onClick={() => setRows((r) => [...r, { label: 'New', areaMm2: 1, count: 1 }])}>
          Add conductor group
        </button>
        <button type="button" className="min-h-11 rounded-lg border px-4" onClick={()=>{setConduit({value:'178',unit:'mm²'});setRows([{label:'Circuit 1',areaMm2:3.31,count:3},{label:'Circuit 2',areaMm2:5.26,count:1}]);}}>Reset</button>
        {error ? <p role="alert" className="text-danger-ink">{error}</p> : null}
        {Number.isFinite(percent) ? (
          <p className="text-lg font-medium" data-testid="us-result">
            Fill ≈ {percent.toFixed(2)} % of raceway area (physical sum only)
          </p>
        ) : null}
      </div>
      <section>
        <h2 className="text-lg font-semibold">Limitations</h2>
        <p className="mt-2 leading-7">
          Nominal AWG conductor area is not the same as insulated wire area. NEC allowable fill percentages are not applied unless you compare the result with your own code document.
        </p>
      </section>
    </article>
  );
}
