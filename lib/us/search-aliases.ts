/** Scope aliases to supported tools and educational guides, never to code certification. */
export const US_SEARCH_ALIASES:Record<string,string[]>={
  'short-circuit':['fault current','short circuit current','available fault current','short-circuit calculation','symmetrical fault current'],
  'voltage-drop':['voltage loss','voltage drop'],
  'path-voltage-drop':['feeder voltage drop','multi segment voltage drop'],
  'wire-size-converter':['wire gauge','conductor size','american wire gauge','awg','circular mil','mcm'],
  'cable-ampacity':['ampacity','user supplied allowable current'],
  'grounding-rod':['grounding','ground rod resistance','earthing'],
  'awg-and-kcmil-explained':['wire gauge','conductor size','awg','kcmil'],
  'grounding-vs-bonding-terms':['grounding','bonding','equipment grounding'],
  'voltage-drop-basics':['voltage drop','voltage loss'],
};
export const US_CATEGORY_DESCRIPTIONS:Record<string,string>={
  'electrical-basics':'Current, real and apparent power, and electrical unit relationships for clearly specified circuit conditions.',
  cable:'Conductor resistance, nominal wire size, and feeder voltage-drop estimates using explicit cable data.',
  transformer:'Transformer current, impedance, loading, loss and parallel sharing calculations.',
  motor:'Motor running current, starting scenarios, slip and acceleration estimates with nameplate inputs.',
  breaker:'Protection calculations and user criteria; automatic code-based breaker selection is unavailable.',
  grounding:'Soil and electrode resistance estimates, with grounding and bonding terminology guides.',
  lighting:'Illuminance and lighting power-density estimates with user-supplied fixture assumptions.',
  'power-quality':'Power factor, reactive compensation, harmonics and filter resonance estimates.',
  generator:'Generator loading, fuel use and starting scenarios from user and manufacturer data.',
  ups:'UPS load capacity, stored energy and approximate backup runtime calculations.',
  'facility-ops':'Energy use, operating schedules and preventive-maintenance hour calculations.',
  'facility-energy':'Electricity use, reporting-period comparisons and user-rate cost estimates.',
  'field-verify':'Measured-versus-design comparisons, unbalance and operating data summaries.',
  schedule:'Load and feeder inventories using user-supplied demand factors and equipment data.',
  advanced:'Engineering study helpers with explicit model and regulatory limits.',
  renewable:'Photovoltaic energy-balance estimates using site and equipment assumptions.',
};
export function usCategoryDescription(slug:string,name:string) {
  return US_CATEGORY_DESCRIPTIONS[slug]??`${name}: engineering tools and reference material with explicit input assumptions.`;
}
