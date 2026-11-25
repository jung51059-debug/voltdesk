/** Deployment/build settings only. Never resolve publication from request headers or URL parameters.
 * @param {Record<string,string|undefined>} env
 */
export function resolveUsReleaseMode(env) {
  if(env.VERCEL!=='1'&&['public','protected-preview','disabled'].includes(env.AMPORY_US_LOCAL_MODE??''))return env.AMPORY_US_LOCAL_MODE;
  if(env.VERCEL!=='1'||env.VERCEL_PROJECT_ID!=='prj_yiJVIAEYHjzA3PALYFjtdfSRFW7a')return 'disabled';
  if(env.VERCEL_ENV==='preview'&&env.AMPORY_US_PREVIEW_PROTECTED==='true')return 'protected-preview';
  if(env.VERCEL_ENV==='production'&&env.AMPORY_US_PUBLIC_ACCESS==='true')return 'public';
  return 'disabled';
}
