import Link from 'next/link';
import { UsCableWorkspace } from './us-cable-workspace';
import { US_CABLE_TOOLS } from '@/lib/us/cable-tools';
import { JsonLd } from '@/components/seo/json-ld';
import { UsDevBanner } from '@/components/us/dev-banner';
import { SITE } from '@/lib/types';

export function UsCablePage({slug}:{slug:string}) {
  const tool=US_CABLE_TOOLS.find(t=>t.slug===slug)!;
  const isDrop=slug.includes('voltage-drop');
  const area=Math.PI/4*(0.127*92**(24/39))**2;
  const r=0.01724*30.48/area,x=2*Math.PI*60*0.25*1e-3*30.48/1000;
  const drop=2*20*(r*0.9+x*Math.sqrt(1-0.9**2));
  const example=slug==='cable-impedance'?Math.hypot(r,x):slug==='cable-parallel'?10:slug==='cable-resistance'?r:drop;
  const unit=slug==='cable-parallel'?'A per conductor':isDrop?'V':'Ω';
  const purposes:Record<string,string>={
    'cable-impedance':'Calculate series R, X and impedance magnitude for one conductor using a DC resistivity model plus a user supplied inductance, or manufacturer AC R/X data.',
    'cable-resistance':'Estimate one-conductor DC resistance from nominal area, material, one-way length and conductor temperature.',
    'cable-parallel':'Estimate current sharing and equivalent DC resistance for identical parallel conductors. No ampacity or installation approval is inferred.',
    'voltage-drop':'Estimate two-wire or balanced three-phase voltage drop with a basic resistive model or a detailed R/X and power-factor model.',
    'path-voltage-drop':'Accumulate drop and conductor losses over successive segments with separate conductor, current, power-factor, material, length and R/X inputs. Mixed length and R/X units normalize before the shared path engine runs.',
  };
  const faqs=[
    {question:'Is the length one-way or round-trip?',answer:'Enter one-way conductor length. The drop engine applies a factor of 2 for a two-wire circuit or √3 for balanced three-phase. Do not double the entered length.'},
    {question:'Does AWG specify the cable outside diameter or ampacity?',answer:'No. The AWG relation describes nominal bare round-conductor geometry. Stranding, insulation diameter, ampacity and conduit fill require separate manufacturer and applicable code data.'},
    {question:'When is temperature correction applied?',answer:'Only the theoretical DC resistance is corrected from the 20 °C material model. Manufacturer AC R/X is used as entered; obtain values at the operating temperature and frequency.'},
    {question:'Can I model 120/240 V split-phase?',answer:'A two-wire 240 V line-to-line load or an individual 120 V line-to-neutral branch can use the two-conductor calculation. Unbalanced multiwire branches and shared-neutral current need a separate model.'},
  ];
  return <article className="mx-auto max-w-3xl space-y-7"><UsDevBanner/>
    <nav aria-label="Breadcrumb" className="text-sm"><Link href="/us">Home</Link> / <Link href="/us/tools/electrical">Electrical</Link> / {tool.title}</nav>
    <h1 className="text-2xl font-semibold">{tool.title}</h1><p className="leading-7">{purposes[slug]}</p>
    <UsCableWorkspace slug={slug}/>
    <section><h2 className="text-lg font-semibold">Overview</h2><p className="mt-2 leading-7">{purposes[slug]} US and SI inputs describe the same physical quantities. This local tool remains under technical source review.</p></section>
    <section><h2 className="text-lg font-semibold">How to Use</h2><ol className="mt-2 list-decimal space-y-2 pl-5"><li>Choose nominal AWG, custom kcmil or mm² and the conductor material.</li><li>Enter one-way length and conductor temperature, using ft or m and °F or °C.</li><li>For AC impedance, choose a justified inductance or manufacturer AC resistance and reactance at the actual frequency and temperature.</li>{isDrop?<li>Choose the actual load connection and voltage across the load. Enter each segment current and power factor. Basic mode ignores power factor and reactance; detailed mode includes them.</li>:null}<li>Calculate and read the result units and model warnings.</li></ol></section>
    <section><h2 className="text-lg font-semibold">Input Units</h2><p className="mt-2 leading-7">Nominal area: AWG, kcmil or mm². Length: ft, m, in, mm, km, kft or mi. Temperature: °F or °C. Manufacturer resistance and reactance: Ω/kft, Ω/km, Ω/ft or Ω/m. Frequency: Hz. User inductance: mH/km. Selecting another unit converts the current value; selecting a different AWG explicitly changes conductor area.</p></section>
    <section><h2 className="text-lg font-semibold">Formula and Variable Definitions</h2><p className="mt-2 break-words font-mono">dmm=0.127 × 92^((36−n)/39); A=πd²/4; R=ρ20[1+α20(T−20)]ℓ/A; X=2πfL; |Z|=√(R²+X²)</p><p className="mt-2 leading-7">n is the AWG number (1/0=0, 2/0=−1, 3/0=−2, 4/0=−3). A is nominal area in mm²; ℓ is one-way length in meters; ρ20 is in Ω·mm²/m; α20 is per °C; L is inductance in henries for that length; f is in Hz. For drop, ΔV=k I ℓkm (r PF ± x √(1−PF²)), with r and x in Ω/km, k=2 for a two-wire circuit or √3 for balanced three-phase. Loss is 2I²rℓkm or 3I²rℓkm. Identical parallel paths use Ieach=Itotal/N and Req=Rsingle/N.</p></section>
    <section><h2 className="text-lg font-semibold">Worked Example</h2><p className="mt-2 leading-7">12 AWG copper, 100 ft one-way, 68 °F (20 °C), 60 Hz, theoretical data with user inductance 0.25 mH/km. Where applicable: 20 A, PF 0.9 lagging, detailed mode, two-wire 120 V. For parallel conductors use N=2. Expected key result: {Number(example.toFixed(6))} {unit}. For a multi-segment path, the initial example has one segment; adding an identical segment doubles total drop and losses.</p></section>
    <section><h2 className="text-lg font-semibold">Understanding the Results</h2><p className="mt-2 leading-7">R and X refer to one conductor unless a two-wire or three-phase drop/loss result is explicitly labeled. Theoretical R is DC resistance; it is not AC resistance with skin and proximity effects. A leading power factor can yield a negative drop, representing approximate voltage rise. Path results sum drop and losses across the entered segments.</p></section>
    <section><h2 className="text-lg font-semibold">Practical Applications</h2><p className="mt-2 leading-7">Compare a manufacturer cable data sheet with a geometric resistance estimate, evaluate feeder length scenarios, and document segment assumptions before a detailed engineering study.</p></section>
    <section><h2 className="text-lg font-semibold">Common Mistakes</h2><p className="mt-2 leading-7">Do not enter loop length, use line-to-neutral voltage in a three-phase line-voltage field, treat split-phase as three-phase, convert temperature differences with a 32-degree offset, or apply a second temperature correction to manufacturer data.</p></section>
    <section><h2 className="text-lg font-semibold">Limitations</h2><p className="mt-2 leading-7">The shared model uses copper ρ20=0.01724 and aluminum ρ20=0.02826 Ω·mm²/m, with α20=0.00393 and 0.00403/°C respectively. Material composition and manufacturing vary. Temperature range is −50 to 250 °C for numerical modeling, not an insulation rating. No verified US cable R/X, ampacity or conduit tables are embedded. Inductance depends on geometry; the illustrative value is not a manufacturer specification. Parallel sharing assumes identical lengths, materials, terminations and temperatures. Voltage drop is a first-order approximation and does not model neutral imbalance, nonlinear loads, faults or protective-device coordination. No NEC or KEC acceptance criterion is applied.</p></section>
    <section><h2 className="text-lg font-semibold">FAQ</h2><div className="mt-2 space-y-3">{faqs.map(f=><details key={f.question}><summary className="cursor-pointer font-medium">{f.question}</summary><p className="mt-2 leading-7">{f.answer}</p></details>)}</div></section>
    <section><h2 className="text-lg font-semibold">Related Calculators</h2><ul className="mt-2 space-y-2">{US_CABLE_TOOLS.filter(t=>t.slug!==slug).map(t=><li key={t.slug}><Link className="text-primary underline" href={`/us/tools/electrical/${t.slug}`}>{t.title}</Link></li>)}</ul></section>
    <section><h2 className="text-lg font-semibold">References</h2><p className="mt-2 leading-7"><a className="text-primary underline" href="https://nvlpubs.nist.gov/nistpubs/Legacy/circ/nbscircular31e2.pdf">NBS Circular 31, Copper Wire Tables, second edition</a>: AWG geometric definition reviewed. <a className="text-primary underline" href="https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8">NIST SP 811 Appendix B.8</a>: unit factors reviewed. Conductor material constants and complete model applicability remain pending calculator-specific review.</p></section>
    <JsonLd data={{'@context':'https://schema.org','@type':'WebApplication',name:tool.title,url:`${SITE.url}/us/tools/electrical/${slug}`,inLanguage:'en-US',applicationCategory:'UtilitiesApplication',operatingSystem:'Any'}}/>
    <JsonLd data={{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:SITE.url+'/us'},{'@type':'ListItem',position:2,name:tool.title,item:`${SITE.url}/us/tools/electrical/${slug}`}]}}/>
    <JsonLd data={{'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs.map(f=>({'@type':'Question',name:f.question,acceptedAnswer:{'@type':'Answer',text:f.answer}}))}}/>
  </article>;
}
