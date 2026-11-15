# Phase 3B-2B — 계산기 콘텐츠 품질 전수 감사 (읽기 전용)

**감사 일자:** 2026-11-15  
**기준 커밋:** `3a69b43` (Production: https://ampory.vercel.app/)  
**범위:** 코드·테스트·메타데이터·가이드 데이터 분석. **엔진·UI·배포·Git 변경 없음.**

---

## 1. 요약

| 항목 | 수치 |
|------|------|
| `tools` 배열 등록 | **69** |
| `published` 공개 | **68** |
| `coming-soon` | **1** (`motor-start-vd`) |
| `CalculatorGuide` 레코드 | **52** (8개는 `calculator-guides-phase3b2a.ts`) |
| 워크스페이스 라우트 (electrical + facility) | **59** |
| 전용 `page.tsx` 도구 | **9** |
| `engines[slug]` 등록 | **60** (전용 9종 제외) |
| **3B-2A 제외·감사 대상 (published)** | **60** |
| **실제 계산 오류 (코드 기준 확정)** | **0건** (자동 테스트 기준) |
| **P0 (공학 오류 확정)** | **0** |
| **P1** | **24** (콘텐츠·SEO·오해 위험) |
| **P2** | **36** |

점수 상세는 `PHASE3B2B-AUDIT.csv` (100점 루브릭·근거 메모) 참고.

---

## 2. 계산기 인벤토리

### 2.1 등록 구조

```
lib/data/tools.ts          → tools = baseTools(16) + extraTools(53)
lib/data/tools-extra.ts    → tool() 헬퍼, formulaId, meta, FAQ
lib/data/formulas.ts       → baseFormulas
lib/calculations/formulas-extra.ts → extraFormulas
lib/calculations/engines.ts → 워크스페이스 엔진 (60 slug)
lib/calculations/schemas*.ts → formSchemas
lib/data/calculator-guides.ts (+ phase3b2a) → CalculatorExplain 본문
```

### 2.2 라우팅 유형

| 유형 | 수 | 정적 경로 패턴 | 구현 |
|------|---:|----------------|------|
| 전기 워크스페이스 | 40 | `/tools/electrical/[slug]` | `CalculatorWorkspace` |
| 시설 워크스페이스 | 19 | `/tools/facility/[slug]` | 동일 |
| 전용 페이지 | 9 | 개별 `app/tools/.../page.tsx` | 전용 Client |
| 미공개 | 1 | URL 예약·sitemap 제외 | `motor-start-vd` |

**전용 9종:** `path-voltage-drop`, `load-flow`, `load`/`cable`/`panel` schedule, `arc-flash`, `lightning-risk`, `sld`, `trend-analysis`.

### 2.3 Phase 3B-2A 완료 (감사 개선 대상 제외, 참조만)

| slug | URL |
|------|-----|
| soil-resistivity | `/tools/electrical/soil-resistivity` |
| solar-pv | `/tools/electrical/solar-pv` |
| lighting-density | `/tools/electrical/lighting-density` |
| generator-fuel | `/tools/facility/generator-fuel` |
| generator-start-vd | `/tools/facility/generator-start-vd` |
| equipment-load | `/tools/facility/equipment-load` |
| energy-cost | `/tools/facility/energy-cost` |
| load-flow | `/tools/electrical/load-flow` |

### 2.4 `CalculatorGuide` 없음 (published, 15종)

`getCalculatorGuide` 미정의 → `CalculatorExplain` **미렌더** (공식·formula.example만 표시).

- `spd-helper`, `energy-intensity`, `pm-interval`, `yoy-energy`
- `load-schedule`, `cable-schedule`, `panel-schedule`
- `arc-flash`, `lightning-risk`, `sld`
- `field-compare`, `generator-load-test`, `duty-cycle`, `sensor-calibration`, `trend-analysis`, `retrofit-compare`

### 2.5 최소 가이드만 존재 (walkthrough·lookup 0)

예: `grounding-rod` — whenToUse·cautions만 있고 예제表·FAQ 1개.

### 2.6 미공개

- **`motor-start-vd`**: `coming-soon`, sitemap·검색 제외, `robots: noindex`. 엔진·스키마는 `motor-starting`과 역할 중복 가능 → 공개 전 콘텐츠·SEO 정책 정리 필요.

### 2.7 sitemap

`lib/seo.ts` `sitemapEntries()` → `getPublishedTools().map(href)` (68 URLs, `motor-start-vd` 제외). 전용 `/tools/schedules/*`, `/tools/advanced/*` 포함 확인.

---

## 3. 계산 정확성 감사

### 3.1 자동 검증 커버리지

| 테스트 자료 | 역할 |
|-------------|------|
| `engines.test.ts` | 핵심 전기·시설 엔진, 가이드 lookup·복제 FAQ 금지, Phase 2A 5종 |
| `phase3b1-examples.test.ts` | motor-current·PFC·PT·케이블·경로VD 등 **예제↔엔진** |
| `phase3b2a-examples.test.ts` | 8종 24 lookup + walkthrough **직접 대조**, load-flow **3상 손실 독립 검산** |
| `extra.test.ts` | published ↔ schema·engine·standardBasis, 링크 ID 무결성, 조류 3상 손실 |
| `amp-to-kw.test.ts`, `power-strip.test.ts` 등 | 도메인 단위 |

**Vitest (기준 커밋):** 10 files, **247 tests** (`phase3b2a-examples.test.ts` 36개 포함).

### 3.2 엔진–예제 정합

- **68 published** 도구 모두 `formula.example` 존재 (`phase3b1-examples.test.ts` 계약).
- **8종 제외 52종** 중 다수는 **가이드 lookup/walkthrough와 엔진을 테스트로 묶지 않음** → 수치 일치는 **검증 불가**로 표기 (통과 처리 안 함).
- **전용 9종**은 `engines` 미등록; 각 모듈(`path-voltage-drop.ts`, `schedules.ts`, `field-verify.ts` 등) + 부분 `extra.test` 커버.

### 3.3 공학 독립 검산 (표본)

| 도구 | 검산 | 결과 |
|------|------|------|
| `short-circuit` | κ·Ik″·ip, engines.test 17 726 A / 42 454 A | 테스트와 일치; **1선지락·비대칭 미지원**은 코드·가이드에 명시 |
| `load-flow` | 3I²R vs P²+Q²/V² (3B-2A) | 수정 반영·테스트 통과 (감사 대상 제외) |
| `transformer-loss` | P₀+Pkβ² | 엔진·Phase2A 가이드 수치 일치 |
| `grounding-rod` | R=ρ/(2πL)ln(4L/d) | 엔진 미단독 감사; Wenner→ρ(`soil-resistivity`) 연계만 문서화 |

### 3.4 공학적 오류·P0

- **확정 P0 (엔진 버그): 없음.** 기존 테스트 전부 통과.
- **오해 위험 (P1, 엔진 변경 없이 문서로 완화):**
  - **`short-circuit`**: IEC 60909 **대칭 3상 근사**; 계통·변압기·케이블 직렬화 단순화.
  - **`arc-flash` / `lightning-risk`**: formula 상 **“수치 계산 없음·점검 목록”** — “계산기” 검색 유입 시 기대치 불일치 가능.
  - **`spd-helper`**: 점검/체크리스트 성격; 엔진은 `engines`에 있으나 가이드 부재.

**검증 불가 (개선 시 `phase3b2b-examples.test.ts` 권장):** 가이드 없는 15종 + walkthrough/lookup 0인 핵심(`voltage-drop`, `motor-starting`, `transformer-load`, UPS 쌍, `grounding-rod`).

---

## 4. 콘텐츠 품질 (A–E) 요약

| 구간 | 관찰 |
|------|------|
| **A 사용 목적** | 52종은 `whenToUse` 있음. 15종은 공식 블록만 → 목적 불명확. |
| **B 계산 원리** | 워크스페이스는 `TechnicalDisclosure`·`standard-basis` 일괄 양호. 전용 9종은 페이지별 편차 큼. |
| **C 실무 예제** | Phase 3B-2A/2A/3B-1 수준(3 walkthrough + 3 lookup + 엔진 대조)은 **~20종**. 나머지는 `formula.example` 단일 또는 가이드 표 부족. |
| **D 주의·한계** | `assertNoComplianceWording`·KEC 자동 판정 없음 전역 정책 양호. thin guide는 한계 문단 짧음. |
| **E FAQ** | 3B-2A 8종: FAQ 4 + JSON-LD. 다수 워크스페이스: FAQ 3·일부 1. **중복 패턴:** 역률/3상/발전기 용량 vs 부하율은 메타·가이드로 구분됨 (phase3b1 테스트). |

`CalculatorExplain`은 **가이드 있을 때만** 하단 고유 본문·FAQ JSON-LD와 연동 (`components/calculators/calculator-workspace.tsx` FAQ dl + JsonLd).

---

## 5. SEO·내부 링크

### 5.1 `metaTitle` / `metaDescription`

- **고유 메타 있음:** 다수 baseTools + 일부 extra (약 42/68).
- **메타 없음 (이름·`description` fallback):** 26종 — CSV `meta_unique=no` 참고.  
  대표: `cable-resistance`, `ups-*`, `thd`, `transformer-current`, `grounding-rod`, 스케줄·advanced·field 대부분.

### 5.2 Canonical·robots

- 워크스페이스: `toolMetadata(tool)` → href 기준 canonical (3B-2A 테스트 유지).
- `motor-start-vd`: noindex (미공개).

### 5.3 검색 의도 중복 (의도적 구분)

| 쌍 | 구분 수단 |
|----|-----------|
| voltage-drop / path-voltage-drop | 메타·가이드 (phase3b1) |
| cable-sizing / cable-ampacity | 메타·키워드 Iz vs 단면 |
| motor-current / motor-starting | 58.29 A 예제·기동 키워드 |
| transformer-load / transformer-sizing | 부하율 vs 용량 |
| generator-load / generator-sizing | 동일 |
| power-factor / power-factor-correction | relatedToolIds·메타 |

**잔여 위험:** `motor-start-vd` 공개 시 `motor-starting`·`generator-start-vd`와 삼중 의도 충돌 가능.

### 5.4 링크 무결성

`extra.test.ts`: `relatedToolIds`·`relatedArticleIds` 존재 검증. **404 링크 미발견** (정적 ID 기준).

---

## 6. 점수 분포 (감사 대상 60, 루브릭 100)

대략 분포 (CSV `score` 열):

| 점수대 | 도구 수 |
|--------|--------:|
| 85–100 | 22 |
| 75–84 | 14 |
| 65–74 | 10 |
| 55–64 | 8 |
| 45–54 | 6 |

**저득점 공통점:** 가이드 없음 **또는** metaTitle 없음 **또는** FAQ≤1.

---

## 7. P0 / P1 / P2 분류

| 우선순위 | 개수 | 기준 |
|----------|------:|------|
| **P0** | 0 | 확정 엔진 오류·안전 수치 오류 — **미발견** |
| **P1** | 24 | 핵심 트래픽 thin 콘텐츠, 가이드 없음, meta 없음, 단락/SPD/스케줄/현장·안전 문구 |
| **P2** | 36 | 양호·소폭 FAQ/메타/lookup 보강 |

---

## 8. 중복 작업 방지

| 이미 충분 | 추가 작업 금지 |
|-----------|----------------|
| Phase 3B-2A 8종 | 가이드·3상 손실·meta 재작성 |
| Phase 3B-1 검증 (motor-current, cable-sizing, path-vd, PFC, …) | 동일 수치 재산출 |
| Phase 2A 5종 (motor-acceleration, power-triangle, ct-ratio, transformer-loss, vfd-sizing) | 3 walkthrough+lookup 재작 |
| `contract-power-current`, `motor-slip`, `power-strip-capacity` 등 rich guide | 전면 개편 불필요 |

| 문제 유형 | 해결 레이어 |
|-----------|-------------|
| meta·FAQ·가이드 부족 | `tools-extra.ts`, `calculator-guides.ts` (+ 신규 phase3b2b 파일) |
| 예제↔엔진 불일치 의심 | `phase3b2b-examples.test.ts` (엔진 변경 없이) |
| 전용 UI 문구 | 각 `*-client.tsx` (엔진 변경 최소) |
| 공통 FAQ JSON-LD | `calculator-workspace.tsx`는 **일괄** — 도구별 FAQ 데이터만 수정 |

---

## 9. Phase 3B-2B 우선 개선 후보 (10종)

8~12 권장 범위의 **실질 타당** 목록 (억지 채움 없음).

| # | 계산기 | URL | 점수 | P | 주요 문제 | 필요 작업 | 예상 파일 | 난이도 |
|---|--------|-----|------|---|-----------|-----------|-----------|--------|
| 1 | 전압강하 | `/tools/electrical/voltage-drop` | 72 | P1 | 핵심·가이드 walkthrough/lookup 0 | 3B-2A급 가이드+FAQ4+meta 검토 | `calculator-guides*.ts`, `tools-extra.ts`, tests | M |
| 2 | 모터 기동 | `/tools/electrical/motor-starting` | 70 | P1 | 기동ΔV·기동전류 설명·예제表 부족 | 가이드·FAQ·motor-start-vd 정책 정리 | guides, tools-extra | M |
| 3 | UPS 백업시간 | `/tools/facility/ups-backup-time` | 62 | P1 | meta·FAQ1·예제 검증 없음 | UPS 쌍 패키지·Peukert 문구 | guides, tools-extra, tests | M |
| 4 | UPS 용량 | `/tools/facility/ups-capacity` | 62 | P1 | 위와 동일 | 위와 통합 | 동일 | M |
| 5 | 접지봉 | `/tools/electrical/grounding-rod` | 58 | P1 | 최소 가이드·meta·soil-resistivity 연계만 | Wenner·ρ 예제·lookup·meta | guides, tools-extra | M |
| 6 | SPD 점검 | `/tools/electrical/spd-helper` | 48 | P1 | **가이드 없음** | 신규 가이드·체크리스트 vs 계산 구분 | guides, tools-extra | M |
| 7 | 3상 단락전류 | `/tools/electrical/short-circuit` | 82 | P1 | 근사·비대칭 미지원 (오류 아님) | walkthrough 3·1선지락 한계 FAQ | guides, tools-extra | L |
| 8 | 부하 스케줄 | `/tools/schedules/load` | 50 | P1 | 가이드·SEO·실무 흐름 | 스케줄 3종 공통 가이드 템플릿 | guides, tools-extra, schedule clients(문구만) | H |
| 9 | 아크플래시 점검 | `/tools/advanced/arc-flash` | 52 | P1 | “계산 없음” 기대 관리 | 고유 meta·FAQ·면책 | guides, `formulas-extra`, page | M |
| 10 | 현장 비교 | `/tools/facility/field-compare` | 46 | P1 | field-verify 엔진·가이드 없음 | 예제·한계·trend 연계 | `field-verify` 문서화, guides | H |

**선정 이유:** 검색·실무 빈도 높은 전기/UPS/접지/단락 + 수익 스케줄·안전 advanced + 현장 시설 도구.  
**보류 (P2·차기):** `pm-interval`, `yoy-energy`, `retrofit-compare`, `sld` — 트래픽·위험 대비 후순위.

---

## 10. Phase 3B-2B 구현 권장 범위

1. **콘텐츠 우선:** 엔진 변경은 P0 확정 시만. 기본은 `calculator-guides-phase3b2b.ts` 신규 + `tools-extra` meta/FAQ.
2. **검증:** `lib/calculations/phase3b2b-examples.test.ts` — 후보 10종에 대해 3B-2A와 동일 패턴(lookup/walkthrough↔엔진, canonical, 링크).
3. **스케줄 3종:** 엔진(`schedules.ts`) 손대지 않고 가이드·메타·페이지 상단 문구만.
4. **`motor-start-vd`:** 3B-2B에서 공개하지 말고, `motor-starting` FAQ에 역할 분리 문단만 검토.
5. **공통 컴포넌트:** `CalculatorExplain`·`CalculatorWorkspace` 구조 유지.

---

## 11. 테스트·검증 기준 (구현 단계)

- Vitest **247+** (후보당 ~4–10 테스트 추가 목표).
- 전체 ESLint 0, `tsc`, production build.
- 후보 URL HTTP 200, canonical, FAQ 4, JSON-LD 본문 일치.
- **엔진 스냅샷:** 후보 도구 기본 입력 결과 diff 없음.
- Production smoke: 기존 8 + 신규 후보, GA4 이벤트 이름 불변.

---

## 12. 위험·영향

| 위험 | 완화 |
|------|------|
| 예제 수정 시 엔진과 불일치 | phase3b2b 테스트 선행 |
| SEO 메타 변경으로 순위 변동 | title은 고유 키워드 유지·canonical 불변 |
| 스케줄 handoff 깨짐 | `buildHandoffHref` ID만 사용·기존 URL 유지 |
| short-circuit·arc-flash 과대 광고 | “참고·근사” 문구 상단 고정 |

---

## 13. Git 상태 (감사 후)

```
## main...origin/main
?? PHASE3B2B-AUDIT.md
?? PHASE3B2B-AUDIT.csv
?? (기존 미추적 PDF/PNG/브랜드 — 미변경)
```

**HEAD:** `3a69b43` — 엔진·콘텐츠·컴포넌트 diff 없음 (감사 산출물 2개만 신규, **commit 금지 준수**).

---

## 14. 최종 보고 체크리스트

| 항목 | 결과 |
|------|------|
| 전체 계산기 수 | 69 등록 / **68 공개** |
| 감사 대상 | **60** (3B-2A 8 제외) |
| 실제 계산 오류 | **없음** (자동 테스트) |
| 콘텐츠 주요 문제 | 가이드 없음 15종, thin 핵심 5종+, meta 없음 26종 |
| 우선 후보 | **10종** (본문 §9) |
| 구현 제안 | 콘텐츠·테스트 중심, 엔진 최소 (§10) |

---

**다음 단계:** 사용자 승인 후 Phase 3B-2B 구현 범위(후보 10종 전체 vs 스프린트 분할) 확정.