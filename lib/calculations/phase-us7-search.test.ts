import { it,expect } from 'vitest';
import { US_SEARCH_INDEX } from '@/lib/us/search-index';
import { searchUsCatalog } from '@/lib/us/search';
it('US-7 search aliases resolve supported functions with English records',()=>{
  const queries:Record<string,string>={
    'Fault current':'short-circuit','Short circuit current':'short-circuit','Available fault current':'short-circuit','Short-circuit calculation':'short-circuit','Voltage drop':'voltage-drop','Wire gauge':'wire-size-converter','Conductor size':'wire-size-converter','Grounding':'grounding','Bonding':'grounding-vs-bonding-terms','Ampacity':'cable-ampacity','Single-line diagram':'sld','Load flow':'load-flow','Load schedule':'load-schedule','Cable schedule':'cable-schedule',
  };
  expect(US_SEARCH_INDEX).toHaveLength(95);
  expect(new Set(US_SEARCH_INDEX.map(r=>r.href)).size).toBe(95);
  for(const [query,target] of Object.entries(queries)) {
    const hits=searchUsCatalog(query);expect(hits.some(h=>h.href.includes(target)),query).toBe(true);
    expect(JSON.stringify(hits)).not.toMatch(/[\u3131-\uD79D]/);
  }
  expect(searchUsCatalog('NEC compliance calculator')).toEqual([]);
});
