# Phase 3C-1 — AdSense 재심사 대비 사이트 전체 품질 감사

**감사 일자:** 2026-11-15  
**기준 커밋:** `f1efb683386f3dd52ae6aa4f9711b7b65e13d87b`  
**Production:** https://ampory.vercel.app/  
**성격:** 읽기 전용 감사. **코드·콘텐츠·설정·Git·배포·IndexNow·AdSense 재신청 미수행.**

---

## 1. 요약

| 항목 | 수치 |
|------|------|
| `tools` 배열 등록 | **69** |
| `published` 공개 계산기 | **68** |
| `coming-soon` (미공개) | **1** (`motor-start-vd`) |
| 사이트맵 URL (`sitemapEntries`) | **129** |
| CSV 행 (공개+유틸+미공개 1) | **133** |
| `CalculatorGuide` 레코드 | **56** |
| 실무 참고 `articles` | **34** |
| 카테고리 허브 | **16** |
| **가이드 없는 published 도구** | **12** |
| **고유 `metaTitle` 없음 (이름·설명 fallback)** | **18** |
| **FAQ &lt; 4개 (published)** | **43** |
| **중복 metaTitle / metaDescription (published)** | **0** |
| **P0** | **0** |
| **P1 (자동 루브릭·수동 보정)** | **19** |
| **P2** | **나머지** |
| Vitest (기준 커밋) | **291** 통과 |
| Search Console 색인 | **미확인** (접근 데이터 없음) |

점수·URL별 상세는 `PHASE3C1-URL-AUDIT.csv` 참고. 본 감사 점수는 **100점 루브릭을 코드·메타·가이드 깊이로 근사**한 것이며, AdSense 승인 확률이나 공식 정책 “위반 확정”을 의미하지 않습니다.

---

## 2. 사전 확인

| 확인 | 결과 |
|------|------|
| 브랜치 / HEAD | `main` @ `f1efb683386f3dd52ae6aa4f9711b7b65e13d87b` |
| `origin/main` | 동기화 |
| Phase 3B-2B 감사 문서 | `PHASE3B2B-AUDIT.md` / `.csv` 존재 (기준 커밋 `3a69b43` 시점; **본 감사는 현재 HEAD 재집계**) |
| 미추적 보존 | `Ampory_QR카드_*.pdf/png`, `public/brand/ampory-youtube-banner.jpg` — **미커밋 유지** |
| `git diff --check` | 통과 (감사 산출물 추가 전) |

---

## 3. 전체 URL 인벤토리

### 3.1 집계 구조 (`lib/seo.ts` → `sitemapEntries()`)

| 유형 | 개수 | 경로 패턴 | 검색 의도 |
|------|-----|-----------|-----------|
| 정적·신뢰 | 11 | `/`, `/about`, `/tools`, `/tools/electrical`, `/tools/facility`, `/references`, `/privacy`, `/terms`, `/contact`, `/sources`, `/resources/electrical-qr-card` | 브랜드·탐색·정책·신뢰 |
| 카테고리 허브 | 16 | `/tools/categories/{slug}` | 주제별 계산기 목록 |
| 공개 계산기 | 68 | `/tools/electrical|facility|schedules|advanced/...` | 도구별 계산·검토 |
| 실무 참고 | 34 | `/references/{slug}` | 개념·절차·해석 |
| **사이트맵 합계** | **129** | | |

### 3.2 사이트맵·robots **제외** (의도적)

| URL | robots | 사이트맵 | 목적 |
|-----|--------|---------|------|
| `/search` | `noindex, follow` | 제외 | 사이트 내 검색 UI |
| `/favorites` | `noindex, follow` | 제외 · `disallow` | 로컬 즐겨찾기 |
| `/settings` | `noindex, follow` | 제외 · `disallow` | 환경설정 |
| `/tools/electrical/motor-start-vd` | `coming-soon` → noindex | 제외 | 예약 slug |

### 3.3 동적·기타

| 항목 | 구현 |
|------|------|
| 전기·시설 워크스페이스 | `app/tools/electrical/[slug]`, `app/tools/facility/[slug]` — SSG·`CalculatorWorkspace` |
| 전용 페이지 9종 | `path-voltage-drop`, `load-flow`, 스케줄 3, `arc-flash`, `lightning-risk`, `sld`, `trend-analysis` 등 |
| 참고 동적 | `app/references/[slug]/page.tsx` |
| RSS | `/feed.xml` — **사이트맵 미포함**, `layout` alternate로 노출 (P2) |

### 3.4 “68 도구” vs URL 개수

- **등록 69 · 공개 68 · 사이트맵 도구 경로 68** — 일치 (`motor-start-vd`만 제외).
- **전체 공개 URL 129** = 정적 11 + 카테고리 16 + 도구 68 + 참고 34 (중복 slug 없음).

---

## 4. 콘텐츠 품질 감사 (요지)

### A. 고유성

- **강점:** `calculatorGuides[].whenToUse[0]` 56건 **전부 고유** (`extra.test`·본 감사 재확인). published **metaTitle·metaDescription 중복 0**.
- **약점:** 시설관리·스케줄·고급 일부는 **가이드 없이** `formula.example` + 입력 폼만 노출 → 검색 의도가 “설명”인 방문자에게 **얕게** 보일 수 있음 (12종).
- **Phase 3B-2A/2B/3A-2로 개선한 28종**은 가이드·FAQ·메타가 풍부 — **중복 개선 작업 대상에서 제외**, 단 신규 이슈(예: legacy meta fallback)는 기록.

### B. 실질적 사용자 가치

- **강점:** 핵심 전기 계산기 다수에 `CalculatorExplain`, `standardBasis`, 결과 해석·경고(`engines` / `interpretation`).
- **약점:** `energy-intensity`, `pm-interval`, `yoy-energy` 등 **EMS·시설 KPI 3종**은 FAQ 1개·가이드 없음 → “계산기만 있는 페이지”에 가깝음 (AdSense **품질 리스크 P1**, 정책 위반으로 **확정하지 않음**).

### C. 전문성·정확성

- **자동:** Vitest **291** — 엔진·가이드 lookup·Phase 3B 예제 대조·표준 문구(합격 표현 금지) 테스트 포함.
- **P0 계산 오류:** 코드·테스트 기준 **0건** (본 감사에서 신규 미발견).
- **한계 명시:** `spd-helper`, `arc-flash`, `short-circuit`, `breaker-current` 등 **역할 분리** 문구 유지 (3B-2B 반영).

### D. 완성도

- **Placeholder:** UI `placeholder` 속성만 존재; **사용자 대면 “미완성” 문구 없음**.
- **코드 TODO:** `lib/calculations/neutral-zero-sequence.ts` 주석 TODO — **공개 페이지 아님**.
- **링크:** 가이드 `links` 미설정 다수(구형 가이드) — **깨진 내부 링크 자동 검출 없음**; `extra.test` ID 무결성은 통과.

---

## 5. 계산기 집중 감사 (68 published)

| 점검 항목 | 개수 | slug 목록 (요약) |
|-----------|-----|------------------|
| **CalculatorGuide 없음** | **12** | `energy-intensity`, `pm-interval`, `yoy-energy`, `cable-schedule`, `panel-schedule`, `lightning-risk`, `sld`, `generator-load-test`, `duty-cycle`, `sensor-calibration`, `trend-analysis`, `retrofit-compare` |
| **고유 metaTitle 없음** | **18** | 위 12 + `cable-resistance`, `monthly-energy`, `thd`, `transformer-current`, `battery-capacity`, `phase-unbalance` |
| **FAQ &lt; 4** | **43** | CSV 참조 (3B-2B 10종은 **4개**로 개선됨) |
| **가이드 있으나 `links` 0** | **다수** | 예: `three-phase-current`, `contract-power-current`, `amp-to-kw` — `relatedToolIds`·UI 관련 링크는 별도 존재 |

**개선 완료 집합(중복 작업 제외, 28종):**  
Phase 3B-2A(8) + 3B-2B(10) + 3A-2/2A/2B 등 `engines.test` 명시 10종 — `voltage-drop`, `motor-starting`, `ups-*`, `grounding-rod`, `spd-helper`, `short-circuit`, `load-schedule`, `arc-flash`, `field-compare`, `load-flow`, …

---

## 6. SEO 기술 감사

| 항목 | 코드·HTTP (본 감사) | Google 실제 색인 |
|------|---------------------|------------------|
| `sitemap.xml` | 129 URL, 절대 URL, **고유** (`lib/rss.test.ts`) | **미확인** |
| `robots.txt` | `allow: /`, `disallow: /favorites`, `/settings`, sitemap URL | Production **200** (표본) |
| canonical | `toolMetadata`·정적 페이지 `alternates.canonical` | 표본 미전수 HTTP |
| noindex | `/search`, `/favorites`, `/settings`, 미공개 도구 | 의도 일치 |
| 중복 title/description | published 도구 **0중복** | — |
| JSON-LD | `FAQPage`, `BreadcrumbList`, `WebApplication`, `Article` | FAQ 1개 도구는 LD도 1문항만 |
| 리다이렉트 | 미전수 | — |

**Production HTTP 표본 (200):** `/`, `/about`, `/privacy`, `/terms`, `/contact`, `/robots.txt`, `/sitemap.xml`, `/search`, `/favorites`, `/settings`.

**P2:** `/feed.xml` 사이트맵 미포함 (RSS는 layout alternate로만 연결).

---

## 7. AdSense·신뢰성 감사

| 항목 | 평가 |
|------|------|
| 운영 목적 | `/about` — 개인 운영·엔지니어링 보조·비합격 판정 아님 명시 |
| 연락 | `/contact` — 이메일 공개 |
| 개인정보 | `/privacy` — **Google AdSense·제3자 광고** 문구 |
| 이용약관 | `/terms` — 면책·광고 가능성 |
| 광고 로드 | `AdSenseLoader` — `/search`, `/favorites`, `/settings` **제외** (콘텐츠 가림 최소화 의도) |
| 탐색 | 허브·카테고리·breadcrumb·관련 도구 |
| 모바일 | 본 단계 **전 URL 390px 미전수** (3B-2B Production spot-check만 선행) |

**정책 위반으로 확인된 사항:** **없음** (법무·AdSense 콘솔 판정 아님, 코드·공개 페이지 검토 범위).

**품질·신뢰 리스크 (권고):** 가이드·메타·FAQ가 빈약한 **12+18 URL** — “가치 있는 인벤토리” 심사에서 **불리할 수 있음** (P1).

---

## 8. 중복 콘텐츠 분석 (의도 비교)

검색 의도가 다르면 **통합/삭제 권고하지 않음**. 유사 문구는 있으나 slug·가이드·입력 스키마가 구분되는 쌍:

| 페이지군 | 관계 | 중복 위험 | 권고 |
|----------|------|-----------|------|
| `voltage-drop` ↔ `path-voltage-drop` | 단일 구간 vs 다구간 합산 | **낮음** (3A/3B 가이드·전용 UI) | 유지 |
| `cable-sizing` ↔ `cable-ampacity` | 굵기 vs Iz 보정 | **중간** (용어 교차 링크 필요) | P2 내부링크 |
| `motor-current` ↔ `motor-starting` | FLC vs 기동 | **낮음** (3B-2B) | 유지 |
| `ups-capacity` ↔ `ups-backup-time` | kVA vs 분 | **낮음** (3B-2B) | 유지 |
| `grounding-rod` ↔ `soil-resistivity` ↔ `earth-conductor` | ρ·봉·도체 | **중간** | P2 상호 `links` |
| 변압기 계열 (`transformer-*`) | 용량·전류·손실·병렬 | **중간** (의도 분리됨) | 유지·허브 설명 보강 |
| 계산기 ↔ `/references/*` | 개념 vs 수치 | **낮음** (`engines.test` 참고 글 중복 억제 테스트) | 유지 |
| `load` / `panel` / `cable` schedule | 스케줄 워크플로 | **중간** (load만 3B-2B 가이드) | P1 cable/panel 가이드 |
| `arc-flash` vs `short-circuit` | 체크리스트 vs Ik″ | **낮음** | 유지 |
| `spd-helper` vs 수치 계산기 | 안내 vs 계산 | **낮음** | 유지 |

**중복 후보로 “모니터링”할 쌍 수:** **약 8군** (통합 후보 **0**, noindex 검토 후보는 별도 §10).

---

## 9. P0 / P1 / P2

### P0 — 0건

- 계산 엔진 회귀·안전 오해·공개 기능 장애·**확인된** AdSense 정책 위반 없음.

### P1 — 19건 (published, 자동 점수 ≤69 또는 다중 결함)

1. `energy-intensity`  
2. `pm-interval`  
3. `yoy-energy`  
4. `cable-schedule`  
5. `panel-schedule`  
6. `lightning-risk`  
7. `sld`  
8. `generator-load-test`  
9. `duty-cycle`  
10. `sensor-calibration`  
11. `trend-analysis`  
12. `retrofit-compare`  
13. `cable-resistance` (meta 없음, 가이드는 있음)  
14. `monthly-energy`  
15. `thd`  
16. `transformer-current`  
17. `battery-capacity`  
18. `phase-unbalance`  
19. `generator-sizing` (가이드 얕음, FAQ 1)

### P2 — 예시

- 가이드 `links` 0인 legacy 전기 기본 계산기 다수  
- 카테고리 허브·QR 카드 페이지 설명 보강  
- FAQ 2~3개인 양호 도구의 4문항 확장  
- `/feed.xml` 사이트맵 포함 여부 검토  

---

## 10. 개선 전략 (실행 없음)

| 구분 | 내용 | 유입·링크 영향 |
|------|------|----------------|
| **1. 반드시 수정** | P0 없음. 재심사 전 **P1 12종 가이드+메타** 없으면 “얕은 페이지” 비율 높음 | 메타·FAQ 개선은 **긍정**; URL 변경 없음 |
| **2. 효과 큼** | legacy **metaTitle/Description 6종** + `generator-sizing` 보강 | 검색 CTR·신뢰 |
| **3. 유지** | 3B-2B 10종, 3A-2 핵심, 참고 34편, 정책 페이지 | — |
| **4. 통합 검토** | **없음** (의도 분리 충분) | 통합 시 301 필요 — **현 단계 비권고** |
| **5. noindex 검토** | `motor-start-vd` 유지. **published 68은 noindex 비권고** (보강 우선) | — |
| **6. 보강** | 스케줄·고급·시설 KPI 12종 | 체류·신뢰 |

---

## 11. 개선 우선순위 상위 20

| 순위 | slug / URL | 이유 | 우선순위 |
|------|------------|------|----------|
| 1 | `energy-intensity` | 가이드·메타·FAQ 전무 | P1 |
| 2 | `pm-interval` | 동일 | P1 |
| 3 | `yoy-energy` | 동일 + `monthly-energy`와 의도 인접 | P1 |
| 4 | `cable-schedule` | 전용 UI·스케줄 핵심·가이드 없음 | P1 |
| 5 | `panel-schedule` | 동일 | P1 |
| 6 | `lightning-risk` | 고급·안전 맥락·가이드 없음 | P1 |
| 7 | `sld` | 설계 보조·설명 부족 | P1 |
| 8 | `trend-analysis` | 시계열·가이드 없음 | P1 |
| 9 | `generator-load-test` | 시설 검증·가이드 없음 | P1 |
| 10 | `retrofit-compare` | 비교 도구·가이드 없음 | P1 |
| 11 | `duty-cycle` | 가동률·가이드 없음 | P1 |
| 12 | `sensor-calibration` | 현장 검증·가이드 없음 | P1 |
| 13 | `generator-sizing` | 발전기 허브·FAQ 1·얕은 가이드 | P1 |
| 14 | `cable-resistance` | 고유 SEO 메타 없음 (가이드는 양호) | P1 |
| 15 | `monthly-energy` | 메타 없음·EMS 클러스터 | P1 |
| 16 | `phase-unbalance` | 메타 없음 | P1 |
| 17 | `transformer-current` | 메타 없음·변압기 클러스터 | P1 |
| 18 | `thd` | 메타 없음 | P1 |
| 19 | `battery-capacity` | 메타 없음 | P1 |
| 20 | `three-phase-current` | 가이드 `links` 0 (콘텐츠는 양호) | P2 |

---

## 12. Phase 3C-2 / 3C-3 구현 제안

### Phase 3C-2 (범위 제안 — 메타·가이드·FAQ, 엔진·URL 무변경)

- **대상:** P1 **12종** 전용·시설·스케줄·고급 — `CalculatorGuide` 신규 + `metaTitle`/`metaDescription` + FAQ **≥4**.
- **추가:** legacy 메타 **6종** (`cable-resistance`, `monthly-energy`, `thd`, `transformer-current`, `battery-capacity`, `phase-unbalance`).
- **산출:** `calculator-guides-phase3c2.ts` 분할 패턴 유지, Vitest 스모크(가이드 고유성·sitemap 링크).
- **제외:** 3B-2A/2B/3A-2 **28종** 재작업 금지.

### Phase 3C-3 (범위 제안 — SEO·UX·정책 마무리)

- published **FAQ 4문항** 미달 43종 중 **핵심 전기 15종** 우선.
- legacy 가이드 **`links` ≥3** (`three-phase-current`, `contract-power-current`, …).
- 카테고리 허브 16개 **짧은 서론** (중복 title만이 아닌 본문 차별).
- `/feed.xml` 사이트맵 포함 여부 결정.
- Production **전 URL 샘플 HTTP** + **모바일 390px** 회귀 (AdSense 재신청 직전).
- **IndexNow·재심사 신청**은 사용자 승인 후 별도 작업.

---

## 13. AdSense 재심사 전 확인 체크리스트

- [ ] P1 12종 최소 1회문단+한계+예제+FAQ 4 (구현 후)
- [ ] 18종 고유 metaTitle·metaDescription
- [ ] `/privacy`·`/terms`·`/about`·`/contact` Production 200
- [ ] `sitemap.xml` 129 = published 도구 68 + 기타 (자동 테스트)
- [ ] Vitest **291+** 유지
- [ ] Search Console **색인·경험** — 운영자 계정에서 확인 (**본 감사 미확인**)
- [ ] 얕은 페이지 비율 재감사 (3C-2 후 `PHASE3C1` 유사 스크립트 재실행)
- [ ] 재심사 신청·광고 단위 변경 — **별도 승인**

---

## 14. 검증 (본 작업)

| 항목 | 결과 |
|------|------|
| 등록 도구 69 / 공개 68 | `tools` 배열·`getPublishedTools()` |
| 사이트맵 129 | `sitemapEntries()` = `lib/rss.test.ts` |
| CSV 행 133 | 129 + search/favorites/settings + motor-start-vd |
| Vitest | **291 passed** |
| Production HTTP | **표본 10 URL** (§6), **전 URL 미전수** |
| Git | 감사 전 `main` 깨끗; 산출물 2개만 추가 |

---

## 15. Git 변경 상태 (감사 완료 시)

- **추가:** `PHASE3C1-ADSENSE-AUDIT.md`, `PHASE3C1-URL-AUDIT.csv`
- **커밋·push·배포:** **없음** (사용자 승인 대기)
- **미추적 보존:** QR PDF/PNG, `public/brand/ampory-youtube-banner.jpg`

---

*본 문서는 AdSense 승인을 보장하지 않습니다. “정책 위반”은 Google 심사 결과와 별도로, 여기서는 **확인 가능한 공개 자료 기준**으로만 기술했습니다.*