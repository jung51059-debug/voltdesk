import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const stage = path.resolve('artifacts/us9b/stage-v6');
if (fs.existsSync(stage)) fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(stage, { recursive: true });

const roots = [
  'app',
  'components',
  'lib',
  'public',
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'tsconfig.json',
  'next-env.d.ts',
  'postcss.config.mjs',
  'eslint.config.mjs',
  'proxy.ts',
].filter((item) => fs.existsSync(item));

for (const item of roots) {
  fs.cpSync(item, path.join(stage, item), {
    recursive: true,
    filter: (src) => !src.endsWith('.test.ts'),
  });
}

fs.mkdirSync(path.join(stage, '.vercel'), { recursive: true });
fs.copyFileSync('.vercel/project.json', path.join(stage, '.vercel/project.json'));
fs.writeFileSync(
  path.join(stage, '.vercelignore'),
  '.git\nnode_modules\n.next\n.env*\nPHASE*\nartifacts\n*.log\n',
);
fs.writeFileSync(
  path.join(stage, 'vercel.json'),
  JSON.stringify(
    {
      buildCommand: 'npm run build && node us9b-build-proof.mjs',
      build: { env: { AMPORY_US_PREVIEW_PROTECTED: 'true' } },
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(stage, 'us9b-build-proof.mjs'),
  "import fs from 'node:fs';console.log('AMPORY_US9B_BUILD_PROOF '+JSON.stringify({buildId:fs.readFileSync('.next/BUILD_ID','utf8').trim(),environment:process.env.VERCEL_ENV,node:process.version}));\n",
);
fs.symlinkSync(path.resolve('node_modules'), path.join(stage, 'node_modules'), 'junction');

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.vercel') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else
      files.push({
        path: path.relative(stage, p).replaceAll('\\', '/'),
        sha256: crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'),
      });
  }
}
walk(stage);
files.sort((a, b) => a.path.localeCompare(b.path));
const sourceSha256 = crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex');
fs.writeFileSync(
  'artifacts/us9b/stage-manifest-v6.json',
  JSON.stringify(
    { stage, createdAt: new Date().toISOString(), sourceSha256, files: files.length, gitCommitOrPush: false },
    null,
    2,
  ),
);
console.log(JSON.stringify({ stage, sourceSha256, files: files.length }));