# Ampory Phase 3B-2A 검증 보고서

기준 커밋: `dd9aa26` · 검증일: 2026-11-15 (Asia/Seoul)

8개 계산기에 고유 가이드, 각각 walkthrough 3개·lookup 3행·FAQ 4개·관련 링크 3~4개를 적용했다. 사용 시점, 입력 의미, 계산 원리와 적용 조건, 결과 해석, 현장 주의사항과 한계를 포함한다. 기존 canonical과 공개 상태를 유지했다.

## 수정 파일

- `lib/data/calculator-guides-phase3b2a.ts`: 8개 도구 고유 가이드. 작업 시작 시 존재하던 미추적 초안을 검토·보완했다.
- `lib/data/calculator-guides.ts`: 가이드 등록, 기존 단일 walkthrough와 호환되는 walkthroughs 타입.
- `components/calculators/calculator-explain.tsx`: 여러 walkthrough 렌더링.
- `lib/data/tools-extra.ts`: 8개 고유 metaTitle·metaDescription, FAQ 각각 4개. 기존 관련 도구·자료 링크 유지.
- `lib/calculations/formulas-extra.ts`: formula.example의 입력 조건·풀이·표시 수치만 정리. 해당 파일의 공식 필드는 유지했으며, 조류 엔진의 손실 계수 수정은 아래에 별도 기록했다.
- `app/tools/electrical/load-flow/page.tsx`: 공통 메타데이터 적용, 가이드와 본문 FAQ 연결. 기존 canonical 유지.
- `lib/calculations/phase3b2a-examples.test.ts`: 작업 시작 시 존재하던 미추적 테스트 초안 보완. 24개 lookup 행 및 대응 walkthrough 엔진 직접 대조, 기본 예제·메타·링크·콘텐츠 무결성 검사.
- `lib/calculations/schedules.ts`: 조류 구간별 손실을 상별 저항 기준 3상 전체 손실로 수정. 전류·전압·부하 합산·50% 하한은 유지.
- `components/schedules/load-flow-client.tsx`: 선간전압·3상 합산 전력·상별 R/X·3상 손실 정의와 입력 접근성 명칭 명시.
- `lib/calculations/extra.test.ts`: 독립 상별 회로 수식 및 다구간·제곱 비례·무저항·전류/전압 불변·반올림 전 계산 검증 9개 추가.
- `PHASE3B2A-REPORT.md`: 최초 오류와 수정, 최종 재검증 및 기존 전체 ESLint 실패를 반영한 보고서.

## 기존 구현 조사 및 콘텐츠 범위

| 도구 | 실제 엔진·입력 | 출력 및 설명 범위 |
| --- | --- | --- |
| soil-resistivity | `calculateSoilResistivity`: spacing, resistance | ρ=2πaR. Wenner 등간격·얕은 전극 근사, 겉보기 저항률. 간격=깊이로 취급하지 않으며 다층 역산·계절 보정·접지설계 없음. |
| solar-pv | `calculateSolarPv`: mode, dailyKwh, psh, panelW, efficiency, autonomyH, dod, vdc | 필요 kWp, 올림한 패널 수, 참고 일일 발전량, 인버터 참고. 계통연계 외 배터리 kWh·Ah 참고. 일사량·효율 직접 입력, 시간별 시뮬레이션·수익 보증 없음. |
| lighting-density | `calculateLightingPowerDensity`: watts, area, oldWatts, hours, price | W/m², 선택 입력 시 절감 W·연간 kWh·비용. lux·배광·유지율·균제도 성능 판정 없음. |
| generator-fuel | `calculateGeneratorFuel`: mode, loadKw, hours, litersPerKwh 또는 lPerHour | L/h와 총 L. 추정 모드 고정 원단위 곱셈, 제조사 모드 입력 L/h×시간. 제조사 곡선 보간 없음. |
| generator-start-vd | `calculateGenStartVoltageDrop`: genKva, xd, motorKva | 기동 전압강하율. 무부하 발전기·순수 리액턴스 근사. 케이블·AVR·과도응답·기동방식별 곡선 해석 없음. |
| equipment-load | `calculateEquipmentUtilization`: ratedKw, avgKw, runHours, periodHours | 평균/정격 부하율, 양의 시간 조건에서 가동률. 수요율 계산 없음. 명판 축출력과 실측 입력전력을 혼용하지 않도록 설명. |
| energy-cost | `calculateEstimatedEnergyCost`: bill 모드 kwh, demandKw, energyPrice, demandPrice; operating 모드는 기존 운전에너지 엔진 위임 | 사용량분+선택 수요분. 운전 모드와 검침 예제 구분. 계약종별·요금적용전력·시간대·세금 자동 적용 없음. |
| load-flow | `radialLoadFlow`: 버스 id·loadKw·loadKvar, 분기 from·to·r·x, 기준 전압 | 방사형·평형 정상상태 DistFlow 근사. 선간전압 %, 선전류 A, 상별 R 기준 3상 전체 유효전력 손실 3I²R/1000 kW. 메쉬·불평형·보호협조·KEC 적합 판정 없음. |

기존 대상 도구들은 별도 metaTitle/metaDescription 없이 이름·일반 설명을 사용했고 FAQ는 각각 1개였다. load-flow 전용 페이지는 별도 고정 메타데이터를 사용하고 본문 CalculatorGuide가 없었다. 기존 관련 계산기와 참고글은 유지하며 가이드 내부 링크를 추가했다. 새 링크의 경로와 기존 관련 도구·참고글 ID는 무결성 테스트로 확인했다.

## 계산 예시 대조

모든 표의 3행과 대응 walkthrough를 실제 엔진에 실행하여 대조했다. 일반 출력은 소수 둘째 자리, 비용은 엔진 정수 표시, 조류 손실은 화면과 동일하게 소수 셋째 자리다.

| 도구 | 고정 조건 | 입력 3개 → 엔진 결과 |
| --- | --- | --- |
| soil-resistivity | Wenner 간격 m·저항 Ω | (5, 3.2) → 100.53; (2, 4) → 50.27; (10, 2) → 125.66 Ω·m |
| solar-pv | grid, PSH 3.8, η 0.78, 450 W | 12/24/36 kWh → 4.05/8.1/12.15 kWp, 9/18/27장, 12/24.01/36.01 kWh/일 |
| lighting-density | 면적 96 m² | 480/960/1920 W → 5/10/20 W/m² |
| generator-fuel | estimate, 8 h, 0.28 L/kWh | 160/320/480 kW → 44.8/89.6/134.4 L/h, 358.4/716.8/1075.2 L |
| generator-start-vd | 500 kVA, X=0.2 pu | 기동 100/180/250 kVA → 4/7.2/10% |
| equipment-load | 정격 75 kW, 420/730 h | 평균 30/42/60 kW → 부하율 40/56/80%, 가동률 모두 57.53% |
| energy-cost | 수요 92 kW, 140 원/kWh, 7000 원/kW | 10000/15000/20000 kWh → 2044000/2744000/3444000원 |
| load-flow | B1 부하 0, 380 V, B1→B2 R=0.08 Ω·X=0.04 Ω | P/Q=25/10, 50/20, 100/40 kW/kvar → 전압 98.32/96.62/93.11%, 전류 40.91/81.82/163.64 A, 3상 전체 손실 0.402/1.607/6.427 kW |

추가 대조: 조명 기본 교체 예제 1440 W·4320 kWh·604800원, 태양광 기본 인버터 참고 8.91 kW. 기존 formula.example의 100.5 Ω·m, 약 717 L, 가동률 57.5% 표시는 각각 100.53 Ω·m, 716.8 L, 57.53%로 엔진 표시와 통일했다. 미완성 결과 문구였던 태양광·에너지 비용·조류 예제에는 실제 입력과 출력을 명시했다. 발전기 기동 예제의 % 환산 단계에는 ×100을 명시했으며 계산 공식은 바꾸지 않았다.

## 조류 3상 손실 오류 정정

최초 구현은 평형 3상 선전류를 계산하면서 구간 손실에 한 상 도체의 손실인 I²R/1000을 사용했다. 이를 화면에서 총 손실로 출력한 것이 오류였다. 최초 보고서의 엔진·콘텐츠 일치 확인은 공학적 정의를 검증하지 못했으며, 설명만 구분하면 된다는 기존 결론을 철회한다.

상별 등가저항 R에 동일한 선전류 I가 흐를 때 세 상의 저항손실 합은 I²R+I²R+I²R=3I²R이다. I²R 자체는 한 상 도체의 올바른 손실 공식이다.

변경 전: const loss = ((i * i * br.r) / 1000);

변경 후: const loss = (3 * i ** 2 * br.r) / 1000;

반올림 전 선전류로 구간별 3상 손실을 계산하고 전체 손실은 구간별 값의 합이다. 기존 I=S/(√3Vfrom)와 Vto²≈Vfrom²−2(RP+XQ)는 그대로 유지했다. V는 선간전압, P/Q는 3상 합산 전력, R/X는 구간 전체 길이에 대한 상별 등가 임피던스 Ω다.

| 3상 부하 P/Q | 기존 한 상 손실 표시 kW | 수정된 3상 전체 손실 kW | 선전류 A (불변) | 전압 % (불변) |
| --- | --- | --- | --- | --- |
| 25 kW / 10 kvar | 0.134 | 0.402 | 40.91 | 98.32 |
| 50 kW / 20 kvar | 0.536 | 1.607 | 81.82 | 96.62 |
| 100 kW / 40 kvar | 2.142 | 6.427 | 163.64 | 93.11 |

공통 조건: 소스 선간전압 380 V, 소스 부하 0, 단일 분기, 상별 R=0.08 Ω·X=0.04 Ω. 예제·lookup·walkthrough·FAQ를 수정된 수치와 정의로 통일했다. 위 표의 기존 값은 오류 이력 비교이며 현재 출력 정의가 아니다.

### 유지한 근사 모델과 한계

- 평형 3상·단일 소스·방사형·정상상태 근사다. 불평형·메쉬는 지원하지 않는다.
- 손실을 상위 부하에 되먹이지 않으며 반복 수렴 알고리즘을 추가하지 않았다.
- 전류는 하위 부하 합과 각 구간 송전단 선간전압으로 근사한다. 비선형 정전력 부하의 정확한 해와는 차이가 남는다.
- 전압 50% 하한 로직을 유지했다. 이 하한은 물리적 해나 전압 안정성을 보장하지 않는다.
- 보호협조·KEC 적합·기동 성공을 판정하지 않는다.

### 독립 공학 검증

새 엔진 출력을 기대값으로 복사하지 않았다. 상별 S=S3/3, V=VLL/√3로 구한 전류의 세 상 손실 합과, 독립적으로 정리한 Ploss=R(P3²+Q3²)/VLL²/1000을 사용했다.

extra.test.ts의 신규 9개 검사:

1. 25/10, 50/20, 100/40 kW/kvar 단일 구간에서 상별 회로의 손실을 세 상 합산 (3개).
2. 2개 직렬 구간에서 각 송전단 전압을 사용한 손실 및 전체 합계, 상위 부하 되먹임 없음 (1개).
3. 같은 전압·R에서 전류 2배일 때 손실 4배 (1개).
4. R=0일 때 리액턴스·전류가 있어도 유효전력 손실 0 (1개).
5. 기존 전류 81.81911450077911 A와 전압 96.61873552992537% 유지 (1개).
6. 기존 전압 50% 하한 유지 (1개).
7. 표시 전류 81.82 A가 아닌 반올림 전 전류로 손실 계산 (1개).

phase3b2a-examples.test.ts의 조류 lookup/walkthrough 3행은 독립 전류·전압·손실 수식으로 기대값을 산출하도록 강화했다. 가이드·FAQ·formula.example의 수정 수치와 3상 정의·반복 수렴 없음·하한의 한계를 검사하는 신규 테스트 1개를 추가했다. 다른 7개 계산기의 예제 기대값은 유지했으며 다른 계산기 엔진은 수정하지 않았다.


## 검증 결과

- `npm.cmd test`: 10개 파일, 247개 테스트 통과. 기존 237개를 수정된 공학적 정의에 맞게 통과시키고 신규 10개(공학 9개·콘텐츠 1개)를 추가했다. 이 단계 전용 테스트 파일은 총 36개다.
- 이번 손실 수정 7개 파일과 앞선 콘텐츠 구현 3개 파일, 총 10개 변경 TypeScript/TSX 대상 ESLint: 통과.
- 저장소 전체 npm.cmd run lint: 실패(기존 오류 7개·경고 3개). 오류는 모두 react-hooks/set-state-in-effect이며 calculator-workspace.tsx:174, path-voltage-drop-client.tsx:126, result-handoff.tsx:44, bookmark-hint.tsx:13, cable-schedule-client.tsx:43, load-schedule-client.tsx:97, panel-schedule-client.tsx:29에서 발생한다. 경고는 QR 카드의 img 1개와 load-schedule-client의 location 이동 2개다. 해당 파일들은 git diff --quiet로 기준 커밋과 동일함을 확인했다. 규칙을 끄거나 작업 범위 밖 코드를 수정하지 않았다.
- npm.cmd exec -- tsc --noEmit: 통과.
- `npm.cmd run build`: Production 빌드 통과, TypeScript 통과, 140개 페이지 생성. 첫 시도는 네트워크 제한으로 Google Fonts 다운로드가 실패했으며 소스 변경 없이 네트워크 허용 후 통과했다. 최종 콘텐츠 반영 재빌드도 통과했다.
- 로컬 Production 서버 `http://localhost:3032`: 아래 8개 URL 모두 HTTP 200.
- Chrome 157, 모바일 390×844: 8개 모두 viewport·문서 폭 390px, 페이지 가로 넘침 없음. 가이드 및 본문 FAQ 4개 표시, FAQ JSON-LD와 본문 일치, 고유 title·description, canonical 유지, noindex 없음. 초기 화면과 가이드 스크린샷 총 16개 저장, 모바일 화면 육안 확인.
- 브라우저 런타임 예외: 8개 모두 0건. 조류 화면 기본 총 3상 손실 1.607 kW 및 입력 기준 명칭도 확인했다. sitemap.xml에 8개 URL이 모두 있고 FAQ JSON-LD 4개와 본문이 일치한다.
- GA4: 기존 회귀 테스트 6개 통과(민감 파라미터 제거, 개발·Preview·로컬 차단, Production 호스트 허용, 이벤트명 구분). 8개 로컬 페이지에서 GA 스크립트·네트워크 요청 0건. GA4 소스와 이벤트 호출 변경 없음. Production 실제 전송은 배포하지 않아 실행하지 않았다.
- `git diff --check`: 통과.

| URL | HTTP | 모바일 390px | FAQ | 로컬 GA 요청 |
| --- | --- | --- | --- | --- |
| /tools/electrical/soil-resistivity | 200 | 통과 | 4 | 0 |
| /tools/electrical/solar-pv | 200 | 통과 | 4 | 0 |
| /tools/electrical/lighting-density | 200 | 통과 | 4 | 0 |
| /tools/facility/generator-fuel | 200 | 통과 | 4 | 0 |
| /tools/facility/generator-start-vd | 200 | 통과 | 4 | 0 |
| /tools/facility/equipment-load | 200 | 통과 | 4 | 0 |
| /tools/facility/energy-cost | 200 | 통과 | 4 | 0 |
| /tools/electrical/load-flow | 200 | 통과 | 4 | 0 |

브라우저 검증 JSON과 스크린샷: `.next/phase3b2a-verification/` (로컬 빌드 산출물, Git 추적 제외).

조류 손실 계산 한 줄과 정의 주석만 엔진에서 변경했다. 전류·전압 식 및 다른 계산기 엔진, GA4, URL·슬러그는 변경하지 않았다. 신규 계산기·삭제·noindex 추가 없음. Git 커밋·푸시·Production 배포 없음. 기존 미추적 PDF·PNG·브랜드 배너는 보존했다.

## 최종 Git diff 및 배포 판단

기준 dd9aa26 대비 추적 파일 diff는 8개 파일, +292/-41행이다(앞선 Phase 3B-2A 콘텐츠 구현 포함). 이 외 작업 대상 미추적 파일은 가이드·예제 테스트·보고서 3개다. 원래 있던 PDF·PNG·브랜드 배너는 작업 결과와 구분하여 보존했다. 전체 추적 diff와 작업 대상 미추적 파일 patch는 .next/phase3b2a-verification/ 아래에 저장했다.

이번 손실 수정 대상은 schedules.ts, load-flow-client.tsx, calculator-guides-phase3b2a.ts, formulas-extra.ts, tools-extra.ts, phase3b2a-examples.test.ts, extra.test.ts, 이 보고서의 8개 파일이다. 앞선 작업에서 수정한 page.tsx·calculator-explain.tsx·calculator-guides.ts는 이번 수정에서 추가 변경하지 않았다.

3상 손실 오류는 수정되었고 기능·빌드·SEO·모바일·GA4 검증은 통과했다. 다만 저장소 전체 ESLint가 기존 오류로 실패하므로 모든 품질 게이트가 통과한 상태는 아니다. 무조건 배포 가능으로 승인하지 않으며 기존 lint 오류 해소 또는 해당 실패의 별도 승인 후 배포를 판단해야 한다. Production 배포·Git commit/push·IndexNow·AdSense 설정 변경은 수행하지 않았으며 사용자 승인 대기 상태다.
