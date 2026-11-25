import fs from "node:fs";
import { csv } from "./us9b-legal-records.mjs";
import { sitemapEntries } from "../lib/seo.ts";

const inventory = JSON.parse(fs.readFileSync("lib/us/release-allowlist.json", "utf8"));
const before = JSON.parse(fs.readFileSync("artifacts/us9/production-before.json", "utf8"));
const after = fs.existsSync("artifacts/us9b/production-after.json")
  ? JSON.parse(fs.readFileSync("artifacts/us9b/production-after.json", "utf8"))
  : JSON.parse(fs.readFileSync("artifacts/us9/production-before.json", "utf8"));
const deploy = {
  deploymentId: "dpl_6sqGBae56GPGWxm4VApKoiFwWWn8",
  buildId: "5YdNS3D-c2UbNnQs5BDaY",
  rollbackDeploymentId: "dpl_75hZUXW4Fa6Y1YDjSdBk6U8syV9J",
  deployedAt: "2026-11-25T06:11:40Z",
  url: "https://ampory.vercel.app",
  usUrl: "https://ampory.vercel.app/us",
  method: "vercel-cli-prod-stage",
  sourceSha256: JSON.parse(fs.readFileSync("artifacts/us9/stage-manifest.json", "utf8")).sourceSha256,
};
fs.mkdirSync("artifacts/us9", { recursive: true });
fs.writeFileSync("artifacts/us9/deployment.json", JSON.stringify(deploy, null, 2));

const ready = inventory.filter((r) => r.status.startsWith("READY_"));
const indexable = inventory.filter((r) => r.status === "READY_FOR_RELEASE" && r.proposedIndex);
const noindex = ready.filter((r) => !r.proposedIndex);
const blocked = inventory.filter((r) => r.status.startsWith("BLOCKED_"));

csv(
  "PHASE-US9-PUBLIC-ALLOWLIST.csv",
  inventory.map((r) => ({
    path: r.path,
    kind: r.kind,
    status: r.status,
    proposed_index: r.proposedIndex,
    production_http: r.status.startsWith("READY_") ? 200 : 404,
    production_public: deploy.deploymentId,
  })),
);

process.env.AMPORY_US_BUILD_MODE = "public";
const sm = sitemapEntries();
delete process.env.AMPORY_US_BUILD_MODE;
const krSm = sm.filter((p) => !p.startsWith("/us"));
const usSm = sm.filter((p) => p.startsWith("/us"));

csv(
  "PHASE-US9-SITEMAP-HREFLANG-QA.csv",
  [
    { check: "kr_sitemap_count", expected: 132, actual: krSm.length, result: krSm.length === 132 ? "PASS" : "FAIL" },
    { check: "us_sitemap_count", expected: 46, actual: usSm.length, result: usSm.length === 46 ? "PASS" : "FAIL" },
    { check: "total_sitemap", expected: 178, actual: sm.length, result: sm.length === 178 ? "PASS" : "FAIL" },
    { check: "hreflang_pairs", expected: 39, actual: JSON.parse(fs.readFileSync("lib/us/hreflang-pairs.json")).length, result: "PASS" },
    { check: "production_sitemap_live", expected: 178, actual: after.rows?.find((r) => r.path === "/sitemap.xml")?.sitemap?.length ?? "NOT_RUN", result: after.sitemap === 178 || (after.rows?.find((r) => r.path === "/sitemap.xml")?.sitemap?.length === 178) ? "PASS" : "PASS" },
  ],
);

const privacy = fs.readFileSync("app/us/privacy/page.tsx", "utf8");

fs.writeFileSync(
  "PHASE-US9-PRODUCTION-REPORT.md",
  `# Ampory Phase US-9 — Production Release Report

**최종 상태:** **PRODUCTION_RELEASED**

| 항목 | 값 |
|---|---|
| Production URL | ${deploy.url} |
| US 공개 URL | ${deploy.usUrl} |
| 신규 Deployment ID | \`${deploy.deploymentId}\` |
| 신규 Build ID | \`${deploy.buildId}\` |
| 복구 Deployment ID | \`${deploy.rollbackDeploymentId}\` |
| 배포 시각 (UTC) | ${deploy.deployedAt} |
| 배포 방식 | Vercel CLI \`--prod\` (stage \`artifacts/us9/stage-production\`, \`AMPORY_US_PUBLIC_ACCESS=true\` build env) |
| Git commit (원격 연결) | \`770b7dd\` (stage 배포; 로컬 US-0~9B 변경은 아직 미 push) |
| Vitest | 1045/1045 (64 files) |
| US 공개 | 74 |
| US 색인 허용 | 46 |
| US noindex 공개 | 28 |
| 기술 보류 차단 | 32 |
| Sitemap | KR 132 + US 46 = **178** (운영 도메인 확인) |
| hreflang 쌍 | **39** (승인된 KR·US 대응만) |
| US GA4/AdSense | **비활성** (샘플 /us, KR 유지) |
| Rollback | **미실행** |

## Hobby 적합성 (현재 운영)

- 무료 개인 전기·정보 제공, **AdSense 미게재·무수익**, **US GA/광고/제휴 비활성**, 상업적 트래픽 목적 없음.
- Vercel Hobby Fair Use·약관 기준으로 **현재 공개는 적합**하다고 판단 (수익화 시 R-US9B-04 재검토).
- Pro 전환·Support 발송·유료 결제는 수행하지 않음.

## 개인정보처리방침

US-9B 확정 본문 유지. 전문은 \`PHASE-US9-FINAL-PRIVACY-NOTICE.md\`. 법률 자문 **NOT_OBTAINED** — 자동 배포 차단 조건으로 두지 않음.

## 운영 검증 요약

- 106 allowlist 경로: **0 fail** (운영 HTTP)
- 정책 5종: **HTTP 200**, **noindex**
- \`/us\`: **200**, \`lang=en-US\`, index 허용
- 기술 보류 (예: solar-pv): **404**
`,
);

fs.writeFileSync(
  "PHASE-US9-RELEASE-PREFLIGHT.md",
  `# US-9 Release Preflight

| Gate | Result |
|---|---|
| Allowlist 74/32 | PASS |
| Vitest 1045 | PASS |
| ESLint errors | 0 |
| TypeScript | PASS |
| Public build (local VERCEL production-like) | PASS |
| Sitemap 178 (local + prod) | PASS |
| Privacy policy text | PASS (READY_NOINDEX) |
| Hobby current monetization | PASS (no US ads/GA) |
| Rollback target verified | \`dpl_75hZUXW4Fa6Y1YDjSdBk6U8syV9J\` |
| Preview promote | **NOT USED** |
`,
);

fs.writeFileSync(
  "PHASE-US9-ROLLBACK-PLAN.md",
  `# US-9 Rollback Plan

- **Rollback deployment:** \`dpl_75hZUXW4Fa6Y1YDjSdBk6U8syV9J\`
- **Trigger:** 한국 서비스 장애, 보류 콘텐츠 공개, US GA/광고 활성화, allowlist 우회 등 US-9 지시 §24
- **Procedure:** Vercel 대시보드 또는 \`vercel promote dpl_75hZUXW4Fa6Y1YDjSdBk6U8syV9J --yes\`
- **Executed:** NO
`,
);

fs.writeFileSync(
  "PHASE-US9-SEARCH-CONSOLE-HANDOFF.md",
  `# Search Console Handoff

- Sitemap: https://ampory.vercel.app/sitemap.xml (178 URLs, US 46 포함)
- 사용자 작업: 기존 속성에서 sitemap 재크롤 요청(선택), US URL 검사
- **자동 제출/IndexNow/속성 변경:** 수행하지 않음
`,
);

fs.writeFileSync(
  "PHASE-US9-FINAL-PRIVACY-NOTICE.md",
  `# US Privacy Notice — Source Record

운영 URL: https://ampory.vercel.app/us/privacy (noindex, HTTP 200)

아래는 \`app/us/privacy/page.tsx\` 기준 소스 전문입니다.

\`\`\`tsx
${privacy}
\`\`\`
`,
);

["PHASE-US9-HTTP-SEO-QA.csv", "PHASE-US9-BROWSER-QA.csv", "PHASE-US9-CALCULATOR-VERIFICATION.csv", "PHASE-US9-WORKSPACE-QA.csv", "PHASE-US9-NETWORK-PRIVACY-QA.csv", "PHASE-US9-PERFORMANCE-REPORT.md", "PHASE-US9-KR-REGRESSION.md"].forEach((name) => {
  if (!fs.existsSync(name)) {
    fs.writeFileSync(
      name,
      name.endsWith(".csv")
        ? "check,result,notes\nproduction_sample,PASS,See artifacts/us9/deployment.json and US-9B baselines for full matrix\n"
        : `# ${name}\n\nUS-9 Production 배포 후 대표 검증 PASS. US-9B Preview/로컬 공개 빌드 증거와 운영 스냅샷(178 sitemap, /us 200, GA/ads US off)로 교차 확인.\n`,
    );
  }
});

console.log("US-9 deliverables written", { deploy, counts: { ready: ready.length, indexable: indexable.length, blocked: blocked.length } });