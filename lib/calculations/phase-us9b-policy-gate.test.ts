import {expect,it} from 'vitest';
import inventory from '@/lib/us/release-allowlist.json';
import {usAccessDecision} from '@/lib/us/release-gate';
import {US_OPERATOR} from '@/lib/us/operator';
import {US_DATA_INVENTORY} from '@/lib/us/data-inventory';

it('confirmed operator facts and Privacy READY_NOINDEX after official-source closure',()=>{
 expect(US_OPERATOR.nameKo).toBe('정현준');
 expect(US_OPERATOR.email).toBe('jung51059@gmail.com');
 expect(US_OPERATOR.inquiryRetentionMonths).toBe(6);
 expect(US_DATA_INVENTORY.operatorContact).toBe(US_OPERATOR.email);
 expect(US_DATA_INVENTORY.workspaceDpaAssumed).toBe(false);
 expect(US_DATA_INVENTORY.emailAccountType).toBe('PERSONAL_GMAIL');
 expect(US_DATA_INVENTORY.providerAndOverseasPublicationReview).toBe('READY_NOINDEX_OFFICIAL_SOURCES');

 const privacy=inventory.find(r=>r.path==='/us/privacy');
 expect(privacy?.status).toBe('READY_NOINDEX');
 expect(privacy?.proposedIndex).toBe(false);
 expect(usAccessDecision('/us/privacy','public').allowed).toBe(true);
 expect(usAccessDecision('/us/privacy','protected-preview').allowed).toBe(true);

 for(const path of ['/us/about','/us/contact','/us/terms','/us/disclaimer','/us/privacy']){
  const r=inventory.find(row=>row.path===path);
  expect(r?.status).toBe('READY_NOINDEX');
  expect(r?.proposedIndex).toBe(false);
 }
 expect(inventory.filter(r=>r.status==='READY_NOINDEX')).toHaveLength(28);
 expect(inventory.filter(r=>r.status==='BLOCKED_POLICY')).toHaveLength(0);
 expect(inventory.filter(r=>r.status.startsWith('READY_'))).toHaveLength(74);
 expect(inventory.filter(r=>r.status==='BLOCKED_TECHNICAL')).toHaveLength(32);
 expect(inventory.filter(r=>r.proposedIndex&&r.status.startsWith('READY_'))).toHaveLength(46);
});