# Ampory Phase US-9 — Final Closure

**종료 상태:** 미국 현지화 대규모 개발 **종료** (US-10 별도 승인 전 미시작)

## Preview 잔여 문구 수정

| 위치 | 변경 |
|---|---|
| `components/layout/us-footer.tsx` | Production 공개 시 정식 안내 문구·© 문구 (`isUsProductionPublic`) |
| `app/us/page.tsx` | CTA `Browse calculator catalog` (공개) / Preview 시 기존 문구 유지 |
| `app/us/tools/categories/[slug]/page.tsx` | 공개 시 카테고리 제목에서 `(US preview)` 제거 |
| `app/us/tools/electrical/[slug]/page.tsx` | 공개 시 `not indexed until launch` 설명 제거 |
| `components/us/dev-banner.tsx` | 기존: 공개 빌드에서 숨김 (`shouldShowUsDevBanner`) |

**운영 검증 (https://ampory.vercel.app/us):** `under active development`, `preview build`, `Browse tool catalog (preview)` **미검출**; `offers free electrical calculators` **확인**.

안전·제한 문구(Engineering estimates, SLD partial, NEC 등)는 **유지**.

## Git

| 항목 | 값 |
|---|---|
| 작성자 (repo 로컬) | `jung51059-debug` &lt;`jung51059@gmail.com`&gt; (기존 커밋과 동일) |
| Commit SHA | `1af4458` |
| 메시지 | `feat(ampory): release United States localized service` |
| Push | **성공** → `origin/main` |
| 동기화 | `770b7dd..1af4458` |

`artifacts/`, `.env*`, Vercel bypass 토큰 값은 커밋 제외.

## vercel.json

- `AMPORY_US_PUBLIC_ACCESS=true` (build env) — **Production US 공개 유지**
- Preview: `VERCEL_ENV=preview`에서 `resolveUsReleaseMode`는 **public 미적용** (보호 Preview는 별도 stage의 `AMPORY_US_PREVIEW_PROTECTED` 유지)
- 로컬 우회 env 미포함

## 배포

| 항목 | 값 |
|---|---|
| 방식 | Git push → Vercel **자동 Production** (추가 CLI 배포 없음) |
| 이전 Production | `dpl_6sqGBae56GPGWxm4VApKoiFwWWn8` / Build `5YdNS3D-c2UbNnQs5BDaY` |
| **최종 Production** | **`dpl_GJHVYmTpDA6hyURY9S3tPYnP6abm`** |
| Git 연동 | Clone commit **`1af4458`** |
| Rollback 기준 | `dpl_6sqGBae56GPGWxm4VApKoiFwWWn8` 또는 직전 한국 전용 `dpl_75hZUXW4Fa6Y1YDjSdBk6U8syV9J` |

## 테스트

| 검사 | 결과 |
|---|---|
| Vitest | **1046/1046** |
| TypeScript | PASS |
| ESLint (변경 파일) | PASS |
| Build (isolated `AMPORY_US_PUBLIC_ACCESS`) | PASS |

## 실제 운영 검증 (Git 배포 후)

| 검사 | 결과 |
|---|---|
| `/us` HTTP 200 | PASS |
| 정식 공개 문구 | PASS |
| allowlist 106 | **0 fail** |
| Sitemap | **178** (US 46) |
| US GA/AdSense on `/us` | **없음** |
| KR `/` | 200 |
| hreflang / 색인 / noindex / 정책 5종 | US-9 기준 유지 (§9B·§9 스냅샷과 동일 집합) |

## 잔여 위험

- **R-US9B-04** (P1): 수익화 시 Hobby·Pro 재검토 — **open**
- 법률 자문 **NOT_OBTAINED** — 정책 문구는 공식 출처 기준 고지
- 스크린리더 수동 검사 NOT_RUN (US-9B 기록 유지)

---

**US-10** (Blogger, Amazon Associates) — 사용자 승인 전 **시작하지 않음**.