import { it, expect } from 'vitest';
import { writeFileSync } from 'node:fs';
import { US_CALCULATOR_CATALOG } from '@/lib/us/calculator-catalog';
import { engines } from './engines';
import { formSchemas } from './schemas';
import { getCalculatorGuide } from '@/lib/data/calculator-guides';
it('US-3 inventory identifies exactly 28 canonical Group B entries',()=>{
  const entries=US_CALCULATOR_CATALOG.filter(e=>e.migrationGroup==='B');
  expect(entries).toHaveLength(28);
  writeFileSync('artifacts/us3/group-b-engine-audit.json',JSON.stringify(entries.map(e=>({
    ...e,schema:formSchemas[e.krSlug]??null,guide:getCalculatorGuide(e.krSlug)??null,
    output:engines[e.krSlug]&&formSchemas[e.krSlug]?engines[e.krSlug](formSchemas[e.krSlug].defaults,6):null,
  })),null,2));
});
