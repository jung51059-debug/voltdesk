# Ampory Phase US-9 — Production Release Report

**최종 상태:** **PRODUCTION_RELEASED**

| 항목 | 값 |
|---|---|
| Production URL | https://ampory.vercel.app |
| US 공개 URL | https://ampory.vercel.app/us |
| 신규 Deployment ID | `dpl_6sqGBae56GPGWxm4VApKoiFwWWn8` |
| 신규 Build ID | `5YdNS3D-c2UbNnQs5BDaY` |
| 복구 Deployment ID | `dpl_75hZUXW4Fa6Y1YDjSdBk6U8syV9J` |
| 배포 시각 (UTC) | 2026-11-25T06:11:40Z |
| 배포 방식 | Vercel CLI `--prod` (stage `artifacts/us9/stage-production`, `AMPORY_US_PUBLIC_ACCESS=true` build env) |
| Git commit / push | **스테이징 완료, commit 보류** (로컬 git user 미설정). `vercel.json`에 Production US 공개 플래그 포함. |
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

US-9B 확정 본문 유지. 전문은 `PHASE-US9-FINAL-PRIVACY-NOTICE.md`. 법률 자문 **NOT_OBTAINED** — 자동 배포 차단 조건으로 두지 않음.

## 운영 검증 요약

- 106 allowlist 경로: **0 fail** (운영 HTTP)
- 정책 5종: **HTTP 200**, **noindex**
- `/us`: **200**, `lang=en-US`, index 허용
- 기술 보류 (예: solar-pv): **404**
