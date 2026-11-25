import fs from 'node:fs';
import { chromium } from 'playwright';
import { target, authorizeContext } from './us9b-auth.mjs';

const t = await target();
const b = await chromium.launch({ headless: true });
const paths = [
  { path: '/us/privacy', width: 390, checks: ['정현준', 'jung51059@gmail.com', 'one hour', 'Pro and Enterprise', 'ordinary personal Gmail', 'six months', 'Article 28-8', 'Hobby'] },
  { path: '/us/privacy', width: 1280, checks: ['Vercel Hobby'] },
  { path: '/us', width: 390 },
  { path: '/us/contact', width: 390 },
  { path: '/us/tools/electrical/three-phase-current', width: 390, action: 'calc' },
  { path: '/us/workspaces/load-schedule', width: 390 },
  { path: '/', width: 390, region: 'kr' },
];

const rows = [];
for (const spec of paths) {
  const c = await b.newContext({ viewport: { width: spec.width, height: 900 } });
  await authorizeContext(c, spec.region === 'kr' ? 'https://ampory.vercel.app' : t.base, spec.region === 'kr' ? {} : t.headers);
  const page = await c.newPage();
  const requests = [];
  const analytics = [];
  page.on('request', (r) => {
    const url = r.url();
    requests.push(url);
    if (/googletagmanager|google-analytics|gtag|adsbygoogle|doubleclick/i.test(url)) analytics.push(url);
  });
  const baseUrl = spec.region === 'kr' ? 'https://ampory.vercel.app' : t.base;
  const res = await page.goto(baseUrl + spec.path, { waitUntil: 'networkidle' });
  let extra = 'SKIP';
  if (spec.action === 'calc') {
    await page.getByRole('button', { name: /calculate/i }).first().click({ timeout: 15000 }).catch(() => null);
    extra = await page.locator('[data-testid="calc-result"], [data-result], output, .result').first().isVisible().catch(() => false) ? 'PASS' : 'CHECK';
  }
  const main = spec.region === 'kr' ? await page.locator('body').innerText() : await page.locator('main').innerText();
  const failed = (spec.checks ?? []).filter((c) => !main.includes(c));
  rows.push({
    path: spec.path,
    width: spec.width,
    region: spec.region ?? 'us',
    http: res.status(),
    buildId: t.buildId,
    checks: spec.checks?.length ?? 0,
    failedChecks: failed.join(';') || 'none',
    analytics,
    calc: extra,
    result:
      res.status() === 200 && failed.length === 0 && (spec.region === 'kr' || analytics.length === 0)
        ? 'PASS'
        : analytics.length && spec.region !== 'kr'
          ? 'FAIL_ANALYTICS'
          : failed.length
            ? 'FAIL_CONTENT'
            : res.status() !== 200
              ? 'FAIL_HTTP'
              : 'PASS',
  });
  await c.close();
}
await b.close();
const out = { buildId: t.buildId, checkedAt: new Date().toISOString(), rows };
fs.writeFileSync('artifacts/us9b/preview-focused-browser.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
if (rows.some((r) => r.result !== 'PASS')) process.exitCode = 1;