import {it,expect,vi} from 'vitest';
import {trackGaEvent,productionHostname} from '@/lib/analytics/ga-events';
import {trackUsGaMock,clearUsGaMockLog,getUsGaMockLog} from '@/lib/us/analytics/us-ga-mock';
it('US traffic cannot invoke an existing production gtag while KR tracking behavior is preserved',()=>{
 const gtag=vi.fn();vi.stubEnv('NODE_ENV','production');vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV','production');
 const location={hostname:productionHostname(),pathname:'/us/tools/electrical/ohms-law'};vi.stubGlobal('window',{location,gtag});
 try{
  expect(trackGaEvent('calculator_view',{tool_slug:'ohms-law'})).toBe(false);expect(gtag).not.toHaveBeenCalled();
  clearUsGaMockLog();trackUsGaMock('search',{query:'private-project-123',email:'test@example.invalid'});expect(gtag).not.toHaveBeenCalled();expect(getUsGaMockLog()[0].params).not.toHaveProperty('query');
  location.pathname='/tools/electrical/rlc-impedance';expect(trackGaEvent('calculator_view',{tool_slug:'rlc-impedance'})).toBe(true);expect(gtag).toHaveBeenCalledOnce();
 }finally{vi.unstubAllGlobals();vi.unstubAllEnvs();clearUsGaMockLog();}
});
