import { it,expect } from 'vitest';
import { convertSchemaValue,validateUsSchemaValues } from '@/lib/us/schema-values';
import { formSchemas } from './schemas';
it('US Group A unit changes preserve power and reject invalid domain input without changing KR engines',()=>{
 expect(convertSchemaValue('3','kW','W')).toBe('3000');
 expect(Number(convertSchemaValue('1','HP','W'))).toBe(746);
 expect(convertSchemaValue('','kW','W')).toBe('');
 expect(convertSchemaValue('bad','V','kV')).toBe('bad');
 const schema=formSchemas['single-phase-current'];
 expect(validateUsSchemaValues(schema,{...schema.defaults,power:'-5'})).toHaveProperty('power');
 expect(validateUsSchemaValues(schema,{...schema.defaults,voltage:''})).toHaveProperty('voltage');
 expect(validateUsSchemaValues(schema,{...schema.defaults,pf:'2'})).toHaveProperty('pf');
});
