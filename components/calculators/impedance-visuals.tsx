import { useId } from "react";

type VisualLocale = "kr" | "en";

export function ImpedanceTriangle({ r, x, locale = "kr" }: { r: number; x: number; locale?: VisualLocale }) {
  const id=useId(), max=Math.max(r,Math.abs(x),1e-30);
  // Both axes use the same scale. Half of the available height is reserved on either side.
  const k=85/max, endX=65+r*k, endY=120-x*k;
  return <figure className="min-w-0"><svg viewBox="0 0 340 240" className="w-full" role="img" aria-labelledby={id}>
    <title id={id}>{locale === "en" ? "Impedance triangle" : "インピーダンス"}</title>
    <path d="M45 120 H310 M65 15 V220" fill="none" stroke="currentColor" opacity=".3"/>
    <path d={`M65 120 H${endX} V${endY} Z`} fill="none" stroke="var(--color-primary, #2563eb)" strokeWidth="3"/>
    <text x="270" y="142" fontSize="13">R (Ω)</text><text x="12" y="22" fontSize="13">X (Ω)</text>
    <text x={Math.min(230,endX+12)} y={Math.max(22,endY-8)} fontSize="13">Z</text>
  </svg>
    <figcaption className="text-xs text-muted">
      R={r.toPrecision(6)}Ω · X={x.toPrecision(6)}Ω · θ=
      {r === 0 && x === 0
        ? locale === "en"
          ? "undefined"
          : "미정"
        : `${((Math.atan2(x, r) * 180) / Math.PI).toFixed(3)}°`}{" "}
      ({locale === "en" ? "same scale" : "동일 축척"})
    </figcaption>
  </figure>;
}
export function LineChart({
  title,
  rows,
  logX = false,
  marker,
  locale = "kr",
}: {
  title: string;
  rows: { x: number; y: number; z?: number }[];
  logX?: boolean;
  marker?: number | null;
  locale?: VisualLocale;
}) {
  const id=useId();
  if(!rows.length)return null;
  const xs=rows.map(row=>logX?Math.log10(row.x):row.x),min=Math.min(...xs),span=Math.max(...xs)-min||1;
  const maxY=Math.max(...rows.flatMap(row=>[row.y,row.z??0]),1e-30);
  const x=(v:number)=>45+((logX?Math.log10(v):v)-min)/span*270;
  const y=(v:number)=>165-v/maxY*140;
  const points=(key:"y"|"z")=>rows.map(row=>`${x(row.x)},${y(row[key]??0)}`).join(" ");
  return <figure className="min-w-0"><svg viewBox="0 0 340 215" className="w-full" role="img" aria-labelledby={id}><title id={id}>{title}</title>
    <path d="M45 20 V165 H320" fill="none" stroke="currentColor" opacity=".4"/>
    <polyline points={points("y")} fill="none" stroke="#2563eb" strokeWidth="2"/>
    {rows.some(row=>row.z!==undefined)?<polyline points={points("z")} fill="none" stroke="#c2410c" strokeWidth="2"/>:null}
    {marker&&marker>=rows[0].x&&marker<=rows.at(-1)!.x?<><path d={`M${x(marker)} 20 V165`} stroke="#15803d" strokeDasharray="4"/><text x="50" y="207" fontSize="11">{locale === "en" ? "Resonance" : "공진"} {marker.toPrecision(6)} Hz ({locale === "en" ? "green" : "녹색"})</text></>:null}
    <text x="4" y="20" fontSize="10">{maxY.toPrecision(3)}Ω</text><text x="45" y="185" fontSize="10">{rows[0].x.toPrecision(3)}</text><text x="270" y="185" fontSize="10">{rows.at(-1)!.x.toPrecision(3)}</text>
  </svg>
    <figcaption className="text-xs text-muted">
      {title}
      {logX
        ? locale === "en"
          ? " · log frequency (Hz)"
          : " · 가로축 로그 Hz"
        : locale === "en"
          ? " · horizontal axis units"
          : " · 가로축 표의 단위"}{" "}
      · {locale === "en" ? "blue R or |Z|, orange |Z|" : "파랑 R 또는 |Z|, 주황 |Z|"}
    </figcaption>
  </figure>;
}
export function PhaseWave({ angle, locale = "kr" }: { angle: number | null; locale?: VisualLocale }) {
  if(angle===null)return null;
  const points=(phase:number)=>Array.from({length:121},(_,i)=>`${20+i*2.5},${70-40*Math.sin(i/120*4*Math.PI-phase*Math.PI/180)}`).join(" ");
  return (
    <figure>
      <svg
        viewBox="0 0 340 140"
        className="w-full"
        role="img"
        aria-label={locale === "en" ? "Normalized voltage and current phase" : "정규화한 전압과 전류 위상 관계"}
      >
        <path d="M20 70 H325" stroke="currentColor" opacity=".3" />
        <polyline points={points(0)} fill="none" stroke="#2563eb" strokeWidth="2" />
        <polyline points={points(angle)} fill="none" stroke="#c2410c" strokeWidth="2" />
      </svg>
      <figcaption className="text-xs text-muted">
        {locale === "en"
          ? `Normalized voltage (blue) and current (orange); not true amplitude. θ=${angle.toFixed(3)}°`
          : `정규화 전압(파랑)·전류(주황), 실제 진폭 비교 아님. θ=${angle.toFixed(3)}°`}
      </figcaption>
    </figure>
  );
}
