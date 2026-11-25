import fs from 'node:fs';import crypto from 'node:crypto';import {csv} from './us9b-legal-records.mjs';
const root='artifacts/us9b',read=(name,fallback={})=>fs.existsSync(`${root}/${name}.json`)?JSON.parse(fs.readFileSync(`${root}/${name}.json`,'utf8')):fallback;
const d=read('deployment'),browser=read('browser',{rows:[],accessibility:[],network:[]}),http=read('http-audit',{rows:[],edges:[],schemas:[]}),deep=read('deep-audit',{rows:[]}),pub=read('public-mode-audit',{rows:[],links:[]}),kr=read('kr-regression'),kb=read('kr-browser',{rows:[]}),lh=read('lighthouse',{rows:[]}),manual=read('accessibility-manual-review',{rows:[]}),policy=read('policy-probe',{rows:[]}),build=read('build-public'),before=read('production-before'),after=read('production-after');
const inventory=JSON.parse(fs.readFileSync('lib/us/release-allowlist.json','utf8')),statusCount=inventory.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{});
const md=(name,body)=>fs.writeFileSync(`PHASE-US9B-${name}.md`,`# Ampory Phase US-9B — ${name}\n\n기준일: 2026-11-25 (Asia/Seoul). 최종 Preview build: \`${d.buildId??'NOT_RUN'}\`.\n\n${body.trim()}\n`);
csv('PHASE-US9B-RELEASE-ALLOWLIST.csv',inventory.map(r=>({...r,actual_public:false,actual_index:false,policy_review:r.path==='/us/privacy'?'BLOCKED: outsourcing/overseas disclosure closure':r.kind==='policy'?'Operator-confirmed content reviewed':'Technical status unchanged',preview_build:d.buildId})));
const index=inventory.filter(r=>r.status==='READY_FOR_RELEASE'&&r.proposedIndex);csv('PHASE-US9B-INDEXABLE-URL-PLAN.csv',index.map(r=>({path:r.path,canonical:'https://ampory.vercel.app'+r.path,kind:r.kind,release_status:r.status,proposed_sitemap:true,actual_sitemap:false,actual_noindex:true,activation:'Separate approved public build and legal gate required',preview_build:d.buildId})));
function parseCsv(s){const result=[];let row=[],value='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===','||c==='\n')){row.push(value.replace(/\r$/,''));value='';if(c==='\n'){result.push(row);row=[];}}else value+=c;}if(value||row.length){row.push(value);result.push(row);}const [keys,...rows]=result;return rows.filter(r=>r.length===keys.length).map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]])));}
const mappings=parseCsv(fs.readFileSync('PHASE-US7-HREFLANG-MAPPING.csv','utf8')),krUrls=new Set(((before.rows??[]).find(r=>r.sitemap)?.sitemap??[]).map(s=>new URL(s).pathname));
csv('PHASE-US9B-HREFLANG-PUBLICATION-PLAN.csv',inventory.map(r=>{const m=mappings.find(x=>x.us_url===r.path),krPath=m?.kr_url,eligible=index.some(x=>x.path===r.path)&&!!krPath&&krUrls.has(krPath)&&m.proposed_pair==='ELIGIBLE_AFTER_BOTH_PAGES_APPROVED';return {us_url:r.path,kr_url:eligible?krPath:'',relationship:eligible?m.relationship:'OMIT: unapproved/no corresponding published pair',eligible_after_release:eligible,reciprocal_required:eligible,canonical:'Independent self-canonical',x_default:'OMIT: no neutral country selector',actual_hreflang:'NONE',preview_build:d.buildId};}));
const processing=[
['calculator_inputs_results','US','YES','Client-side engineering calculation','User browser','Memory/DOM','NO','NONE','Tab/session life; no app server project store','Clear tab/input','Local browser controls','Client engines; independent browser examples'],
['search_queries','US','YES','Local tool discovery and recent searches','User browser','Memory/localStorage','NO app search upload','NONE','Until cleared','Search/site-data controls','Local browser controls','Search client and sentinel network tests'],
['settings','US','YES','Units/voltage/frequency/theme preferences','User browser','voltdesk:preferences:us localStorage','NO','NONE','Until cleared','Settings/browser clear','Local browser controls','Region storage code; actual browser probes'],
['favorites','US','YES','Saved tool identifiers','User browser','voltdesk:favorites:us localStorage','NO','NONE','Until cleared','Favorites/browser clear','Local browser controls','Separate KR/US keys; actual UI QA'],
['workspaces_project_names','US','YES','Local load/cable/SLD planning and private load-flow review','User browser','Region-specific localStorage; JSON/CSV/SVG downloads','NO automatic upload','NONE','Until cleared/file deleted','Workspace/browser clear; remove downloads','Local browser controls','34 deep cases; storage reload probe4; malformed JSON preservation'],
['application_cookies','US','NO analytics/ads cookie observed','No application tracking enabled','Application/browser','No tracking cookie observed in policy fresh contexts','NO tracking','NONE','N/A for app tracking','Browser site data','Browser controls','Final policy probe cookie names; authentication differs'],
['preview_auth_cookies','US Preview','CONDITIONAL on auth flow','Protected Preview access','Vercel/browser','Origin-bound protection cookie for Lighthouse; test automation header elsewhere','YES to verified Preview origin only','Vercel','Provider authentication lifecycle; not inquiry six months','Browser cookies/logout/provider request','Operator contact routes request to provider as needed','Protection boundary and Lighthouse cookie flow; no credential value retained'],
['session_storage','US','NO app usage observed','No current app feature uses sessionStorage','Browser','Fresh policy probes empty','NO','NONE','N/A','Browser clear','Browser controls','Code and actual sessionStorage-key probe'],
['ip_request_metadata','US+KR','YES','HTTP delivery/security/operations','Vercel and operator roles require contractual closure','Edge/CDN/server/security systems','YES','Vercel; actual subprocessors/countries incomplete','Runtime UI1h Hobby only; other periods/criteria not fully established','Provider privacy request; no all-log operator erase guarantee','Email operator; assess provider own role','Project metadata; official provider docs; actual requests'],
['runtime_logs','US+KR','POSSIBLE; request/runtime behavior dependent','Runtime operations/troubleshooting','Vercel','Project runtime logs','YES where runtime invoked','Vercel','Official Hobby availability1hour; not total erasure','Provider controls/requests subject to scope','Email operator','Actual Hobby; runtime docs; iad1 only function region'],
['request_security_build_logs','US+KR','YES/MAY OCCUR by log class','Delivery/security/build troubleshooting','Vercel','Provider log systems/build records','YES','Vercel','NOT_VERIFIED per account/log class; do not substitute runtime1h','Provider request; retain no secrets in evidence','Email operator','Official log-class docs; cloud build records; exact settings not confirmed'],
['inquiry_email_attachments_replies','US+KR','WHEN USER EMAILS','Inquiry and related follow-up only','정현준; Google own/contractual roles require closure','Ordinary personal Gmail; sender mail provider; any operator downloads','YES via email; no Ampory hosted form','Google Gmail; no Workspace DPA assumed','Operator:6calendar months after closure; earlier when unnecessary/required; limited legal hold; Google own rules separate','Monthly manual review; Inbox/Archive/Sent/Trash Delete forever; attachments/downloads','Email jung51059@gmail.com; minimal verification','Owner confirmed personal Gmail and six-month rule; Gmail30day Trash help'],
['external_fonts','US+KR','Build-time fetch; self-hosted at runtime','Typography','Build provider; same-origin static asset server','Next font generated static assets','Font fetch at build; no required runtime Google font request observed','Google font service at build; Vercel delivery','Build/cache provider rules; no invented duration','Clear browser cache; provider request','Operator contact','next/font source; actual browser requests'],
['external_reference_links','US','USER INITIATED','Technical source reading','Linked provider','Third-party website after navigation','YES when link followed','Destination provider','Destination policy','Destination controls','Destination/owner contact','Actual initial HTML external-links inventory'],
['external_application_api','US','NO calculator API upload observed','Calculations client-side','Browser','Client engines','NO calculator-input transmission feature','NONE','N/A','Clear local data','Local controls','HTTP/network/deep sentinel evidence; ordinary hosting requests still occur'],
['GA4','US','DISABLED','Future aggregate event measurement only after separate approval','Would be Google/operator','No active US collection','NO observed GA/collect request','Future contract/privacy assessment','Future explicit user/event retention setting required','Future controls; no current US data collection','Owner contact','530 request matrix and disabled code; no activation'],
['AdSense','US','DISABLED','Future advertising only after review/approval','Would be Google/operator','No active US advertising','NO observed ad request on US-only route matrix','Future assessment','Future provider terms; no invented duration','Future choices','Owner contact','Region guard and US network matrix'],
['AdSense','KR','CODE PREPARED; NO ACTUAL ADS/REVENUE owner confirmed','Prepared advertising integration','Operator/Google if script requested','Existing KR code unchanged','Script request may occur despite no ad display/revenue','Google if loaded','Provider rules; account behavior not fully inspected','Provider/browser controls; KR issue reported separately','Existing KR policy/contact','Owner confirmation plus KR script/network; code presence distinct from actual monetization'],
['affiliate_links','US','NOT ACTIVATED','US10 scope only','None current','No active affiliate transmission feature','NO active feature','NONE current','N/A','Future approval','Owner contact','Current product source; future release hold'],
['accounts_server_database','US','NOT IMPLEMENTED','No account/cloud workspace function','None current','Local browser only for app drafts','NO hosted project DB feature','NONE','N/A','Local controls','Owner contact','Source review and actual workspace persistence tests']
];
csv('PHASE-US9B-DATA-PROCESSING-INVENTORY.csv',processing.map(([item,region,processed,purpose,actors,storage,server_transmission,recipient_or_outsource,retention,deletion,rights,evidence])=>({item,region,processed,purpose,actors,storage,server_transmission,recipient_or_outsource,retention,deletion,policy:'US Privacy protected review; KR policy separately unchanged',rights,evidence,build_id:d.buildId})));
const oldInv='PHASE-US9A-DATA-PROCESSING-INVENTORY.csv',oldBytes=fs.readFileSync(oldInv);if(!fs.existsSync(`${root}/us9a-inventory-before.csv`)){fs.writeFileSync(`${root}/us9a-inventory-before.csv`,oldBytes);fs.writeFileSync(`${root}/us9a-inventory-before.sha256`,crypto.createHash('sha256').update(oldBytes).digest('hex'));}
if(!oldBytes.toString('utf8').includes('US9B_SUPERSESSION'))fs.appendFileSync(oldInv,'\n'+['revision','US9B_SUPERSESSION','US+KR','PHASE-US9B-DATA-PROCESSING-INVENTORY.csv','see_current_inventory','see_current_inventory','superseded_by_US9B','history_retained','see_US9B_privacy_operations','2026-11-25 owner facts and fresh code/network QA','US9A rows are historical; US9B inventory is authoritative'].map(v=>'"'+v.replaceAll('"','""')+'"').join(',')+'\n');
md('OPERATOR-CONFIRMATION',`
운영자 **정현준**, 대한민국 소재 개인 운영. 서비스 Ampory. 영문 표기는 새로 만들지 않았고 실제 이름에 lang=ko를 지정했다. 개인정보 문의 책임자도 운영자 본인이다. 공통 공개 이메일 **jung51059@gmail.com**. 유료 Workspace/Workspace Individual이 아닌 **일반 개인 Gmail**이며 Workspace 전용 DPA를 전제하지 않는다.

독립 영문 Contact/mailto를 제공한다. 한국 페이지 방문, 전화, 실시간 응대, 응답 시간 보장, 전문 설계 상담을 요구하거나 약속하지 않는다. 문의는 처리 완료 후 원칙적으로 **6개월**, 매월 수동 점검·삭제. 법적 보존/필요한 진행 중 분쟁만 최소 범위 별도 보존, 종료 후 삭제. 법정6개월 또는 자동삭제라고 표현하지 않는다.

한국 AdSense는 코드 준비 상태이며 **현재 광고 게재·수익 없음**을 사용자가 확인했다. 코드/네트워크 요청 가능성과 광고 노출·수익은 다르다. 미국 GA4는 개인정보 검토 후 별도 승인, 초기 AdSense 비활성, 제휴는 US10 이전 비활성. Production 배포는 미승인이다.

기술 범위 35계산기/5가이드/3워크스페이스. SLD는 목록·SVG **PARTIAL**, load-flow는 **BLOCKED_TECHNICAL**. 정책4개만 READY_NOINDEX, Privacy는 남은 처리 계약·국외고지 검증 때문에 BLOCKED_POLICY. 실명/이메일/보관 선택 미확정이라는 옛 사유는 해소됐다.
`);
md('LEGAL-APPLICABILITY-REVIEW',`
판정 **BLOCKED**: 전문 법률 자문 **NOT_OBTAINED**. 변호사 검토 자체를 자동 필수조건으로 두지 않는다. 아래는 공식 자료에 근거한 적용 가능성 평가이며 법적 적합성 보증이 아니다. 원문 URL·개정/시행·조항·접근일·구현·검증은 LEGAL-SOURCES.csv에 분리했다.

| 주제 | 현재 판단 | 근거와 남은 조건 |
|---|---|---|
| 한국 개인정보보호법 | APPLICABLE | 한국 소재 운영자가 문의 기록 등을 처리. 무료·계정 없음만으로 면제되지 않음. §§15/16/21/26/28-8/29/30/31/34–37 검토 |
| 국외 처리 | BLOCKED_POLICY | Vercel Hobby 및 개인 Gmail의 실제 역할·적용 계약/서면 위탁 근거·하위 처리·국가·보유 기준·거부 효과를 확정하지 못함. §28-8 적법 근거를 이메일 발송만으로 가정하지 않음 |
| 개인정보 책임자 연락 | 사용자 결정 반영 | 2026 PIPC 작성지침 PDF p72는 전화+이메일 모두 기재를 **권장**한다. 이름과 실제 사용 가능한 이메일을 반영. 예시의 전화·팩스·주소를 모든 개인 무료 사이트의 일률적 추가 의무로 바꾸지 않음 |
| FTC/소비자 보호 | CONDITIONAL | 미국 대상 상업성과 관할·효과에 따라 판단. 정확성·보안·안전·면책에 허위 보장을 하지 않는 기본 조치 반영 |
| COPPA | LIKELY_NOT_APPLICABLE | 일반 공학 용도, 아동 지향·인지한 아동 수집 확인 없음. under13 실제 인지/대상 변경 시 재평가; 연령 문구만으로 면제되지 않음 |
| CCPA/CPRA | CONDITIONAL | CA 사업 관련성, 조정 매출 $26.625M/10만 buy-sell-share/50% 매출 및 관계회사 조건. 현재 US 광고 미활성만으로 모든 임계치 면제라고 단정하지 않음 |
| CalOPPA/보안·유출법 | CONDITIONAL | CCPA 미달이 모든 고지·보안·유출법 면제를 뜻하지 않음. 상업 웹서비스의 CA PII 처리 여부 평가, Privacy가 없는 공개 운영을 승인하지 않음 |
| Colorado/Texas | CONDITIONAL | CO10만 또는2.5만+판매 이익, 비영리도 가능. TX SBA 소기업 예외와 민감정보 판매 동의 예외 구분. 전50주 전수 적합 판정은 아님 |
| GDPR | CONDITIONAL | Art3 EU establishment/targeted offering/behavior monitoring에 따라 판단. 영문·해외 접근성만으로 자동 적용/자동 면제 아님. 현재 EU 타기팅·행태추적은 확인되지 않음 |
| 접근성/ADA | CONDITIONAL | 민간 서비스의 TitleIII 관련성·관할 검토와 기술적 WCAG 검사 분리. 정부 TitleII 기한을 Ampory에 그대로 적용하지 않음. 자동 검사나 ARIA를 실제 화면 읽기 검사로 표시하지 않음 |
| 한국 사업/세무·전자상거래 | CONDITIONAL | 현재 무료, 광고 게재·수익 없음 확인. 일반 NTS 반복 수익사업 예시는 이 서비스의 확정 업종 판정이 아님. 향후 광고·제휴·유료 거래 전에 등록/세금/표시 의무 재검토. 번호·주소를 창작하지 않음 |
| NEC/NFPA·전문 자격·안전 | 현행 제한 유지 | 허가 없는 Type3 표/자동 적합 판정 없음. 이름·코드 무료 열람이 복제 허가 아님. PE/NEC인증·자격 주장을 하지 않음. 기술 보류를 면책으로 해제하지 않음 |

현재법은 PIPA 2026-09-11 시행본, 시행령은 **2026-11-10 시행본**을 확인했다. 2027-03-09 예정 개정을 현행으로 적용하지 않는다. §§28-8(2) 국외이전 필수사항과 PIPC 2026 지침 p45–47을 실제 공급자별로 채워야 한다. 고정 보유기간을 특정할 수 없으면 의미 있는 결정 기준을 쓸 수 있다는 지침 p31도 고려했으므로, 무조건 정확한 모든 로그 일수 미상만으로 위법 판정하지 않았다. 현재는 국가·역할·계약·이전근거까지 함께 미확정인 실질적 공백이다.

일반 이용약관에 강행법규 배제, 무조건 무책임, 강제 중재·집단소송 포기·해외 전속재판 약속을 넣지 않았다. KR 정책의 동일 공급자 고지·보관/광고 상태 정합성은 별도 후속 검토 사항이며 KR 원문을 수정하지 않았다.
`);
md('POLICY-FINALIZATION',`
| 경로 | 결과 | 내용 및 제한 |
|---|---|---|
| /us/about | READY_NOINDEX | 정현준/한국 개인 운영/공통 이메일, 서비스·기술 범위·검증 수준·자격 비주장 |
| /us/contact | READY_NOINDEX | 독립 영문 문의·mailto, 목적·최소수집·6개월·월별 수동삭제·응답 비보장 |
| /us/terms | READY_NOINDEX | 무료/입력 책임/IP/허용 이용/로컬 손실/변경/강행권리/분쟁·정정 |
| /us/disclaimer | READY_NOINDEX | 모델·단위·전압·제조사·현지 채택 NEC·자격자·안전 한계 |
| /us/privacy | BLOCKED_POLICY | 확정 운영 사실은 반영했으나 공급자 계약·국외 근거·국가·보유 기준·거부 효과 미확정. 보호 Preview에서 검토용으로만 읽을 수 있음 |

실제 분류 **46 READY_FOR_RELEASE +27 READY_NOINDEX +32 BLOCKED_TECHNICAL +1 BLOCKED_POLICY =106**. 후보73, 색인 후보46, 실제 미국 공개0. 정책4 승급은 Production 공개 승인이 아니다. Privacy를 포함한 필수 정책이 모두 공개 접근 가능한 상태가 되기 전에는 전체 Production 공개를 **BLOCKED**한다. 목표74를 억지로 맞추지 않았다.

Footer는 공개 허용 정책만 연결한다. 보호 Preview에서는 다섯 정책 전체가 노출된다. 격리 공개 모드에서 Privacy는 현재404로 보류되며 Contact는 끊어진 링크 대신 publication pending 텍스트를 표시한다. 이는 현재 차단 상태 검증이며, 필수 정책 접근성이 완성됐다는 PASS가 아니다. 해제 후 Privacy footer 및 본문 링크200/noindex 검사를 반드시 재실행한다.

5개 정책 실제 HTTP200, 실명 lang=ko·이메일 mailto·영문·noindex는 policy-probe.json에 기록했다. 검색 noindex와 서버 접근 제한은 별개다. 보호 Preview 인증을 공개 경로 접근 허가로 해석하지 않는다.
`);
md('PRIVACY-OPERATIONS',`
담당: 정현준 / jung51059@gmail.com. 일반 개인 Gmail. 이 문서는 실제 운영자가 수동 수행할 절차이며, 자동 삭제·공급자 전체 로그 삭제·이미 수행한 계정 보안 감사라고 보장하지 않는다.

1. 문의 수신 시 최소 사건번호, 수신일, 요청 유형(일반/열람/정정/삭제/정지/사고), 담당자, 적용 가능 법, 법정 기한을 기록한다. 민감한 원문·신분증을 별도 대장에 복제하지 않는다. 처음부터 필요한 최소 정보만 받는다.
2. 요청자 이메일/기존 대화 맥락으로 우선 확인한다. 불필요한 여권·주민번호를 요청하지 않는다. 의심이 있는 경우 필요한 범위의 추가 확인과 이유를 설명한다. 제삼자 자료를 그대로 회신하지 않는다.
3. Gmail Inbox/Archive/Sent/Trash/첨부·다운로드, 실제 운영자 보유 자료, Vercel 관련 요청 여부를 구분한다. 브라우저 전용 설정/즐겨찾기/워크스페이스는 운영자 서버 계정에 없으므로 장치의 삭제·내보내기 방법을 안내한다. 사이트에 없는 DB를 조회하거나 전 세계 모든 장치에서 삭제한다고 약속하지 않는다.
4. 열람은 실제 보유·제공 가능한 범위, 처리 목적/항목/보유/제공 현황을 검토하여 안전하게 제공한다. 정정은 원문 보존 필요와 수정 대상을 확인한다. 삭제/정지는 법적 의무·다른 사람 권리·적법한 보존 사유를 확인하고 처리 범위 및 불가 사유와 이의 방법을 설명한다.
5. 외부 공급자 자체 보유 자료가 관련되면 Vercel/Google의 개인정보 요청 창구·계약상 경로를 확인한다. 운영자에게 없는 삭제 권한·SLA·DPA를 주장하지 않는다. 공급자 전달이 필요한 경우 최소 정보만 적법한 근거로 전달하고 요청·응답을 기록한다. 이 단계의 실제 계약·국외 처리는 현재 공개 블로커다. 이번 검증에서 외부 업체에 메일이나 요청을 보내지 않았다.
6. 사건 종료일을 명시하고 **6 calendar months** 후 만료일을 계산한다(예: 2026-11-25 종료 →2027-05-25). 원래 수신일을 종료일로 간주하지 않는다. 목적이 일찍 달성돼 불필요하면 더 일찍 삭제한다. 월별 점검은 보조 통제이며 법정/만료 기한 이후 한 달 더 보관할 권한이 아니다. 필요한 만료일 알림은 운영자가 설정·관리하고 자동화가 구현됐다고 표시하지 않는다.
7. 매월 대장을 보고 만료 건을 수동 정리한다. 해당 대화의 보관함/받은편지함/보낸편지/중복/첨부 및 내려받은 파일을 확인한다. Gmail Trash로 이동만 해서는 recoverable30일이 남으므로 만료본은 **Delete forever**까지 확인한다. Google 자체 백업·보안 보존이 즉시 모두 삭제된다는 보장은 하지 않는다. 삭제 완료일·범위만 최소한으로 남긴다.
8. 법적 보존이나 필요한 진행 중 분쟁 예외는 근거, 대상, 최소 범위, 시작일, 재검토일, 종료 조건, 접근 제한을 별도 기록한다. 모든 문의를 무기한 보존하는 예외로 쓰지 않는다. 종료 시 삭제하고 증거 보존과 과잉 복제를 구분한다.
9. 유출 의심 시 노출 중단·접근 제한·원인/범위/시각 확인·최소 증거 보존·계정 보호를 우선하고, PIPA34 및 시행령40의 통지/신고 요건과 해당 미국 주/기타 관할을 즉시 평가한다. 확인된 유출뿐 아니라 2026 개정상 해당 우려 상황도 검토한다. 일률적으로72시간까지 기다리거나 모든 사건72시간 법칙을 적용하지 않는다.
10. 처리 목적/공급자/지역/보유/기능/수익화 변경 시 정책 버전과 처리 인벤토리를 갱신한다. 불리한 목적 변경에 필요한 근거·통지·동의는 별도 확인한다. 외부 AI/번역에 문의 원문을 자동 업로드하지 않는다. 실제 계정의 MFA·복구·접근·다운로드 장치 통제는 운영자가 확인·기록해야 하며 이번 코드 검사가 계정 상태를 증명하지 않는다.

| 적용 조건 | 확인한 요청 처리 기한 | 근거 |
|---|---|---|
| 한국 PIPA 열람 | 원칙10일, 적법한 연기·거절 시 통지/사유/이의 절차 구분 | 시행령41·42, 현행2026-11-10 |
| 한국 정정·삭제 | 조치 또는 법정 삭제 거부의 결과·이유·이의 방법을 요청 후10일 이내 통지 | 시행령43(3) |
| 한국 처리정지 | 조치 또는 거부 결과를10일 이내 통지 | 시행령44(2) |
| GDPR 적용 시 | undue delay 없이1개월, 필요한 복잡성/건수에 따라 추가2개월 연장 가능하나 최초1개월 내 사유 통지 | Art12(3)–(4) |
| CCPA 적용 시 delete/correct/know | 접수확인10영업일, 본답변45calendar days, 통지 후 추가45 가능 | CPPA FAQ |
| CCPA 적용 시 opt-out/limit | 가능한 한 빨리, 최대15영업일 | CPPA FAQ |
| CO/TX 해당 시 |45일, 필요한 경우 초기45일 내 이유를 통지하여 추가45 | 각 AG 공식 FAQ; 이의 절차 별도 |

세계 공통 하나의 기한을 약속하지 않는다. 접수 때 해당 법·기한을 확인하고 여러 의무가 겹치면 충족 가능한 가장 이른 통제를 적용한다. 기한 연장이 자동 승인되는 것도 아니며 필요성·통지 요건을 기록한다. 공식 원문은 LEGAL-SOURCES.csv에서 연결된다.
`);
md('HOSTING-DATA-REVIEW',`
실제 Vercel project ampory / prj_yiJVIAEYHjzA3PALYFjtdfSRFW7a, team jung51059-debugs-projects, **Hobby active**, Next.js, Node24.x. 최종 클라우드 실제 Node **${d.node??'NOT_RUN'}**. 보호 all_except_custom_domains. iad1은 serverless-function 설정이며 모든 CDN/로그/백업/지원/하위 처리 국가의 증거가 아니다.

| 대상 | 공식 일반 기준 | 실제 확인/한계 |
|---|---|---|
| Runtime Logs | Hobby dashboard availability1hour; Pro1day; Enterprise3days; ObservabilityPlus30days | 실제 Hobby 확인. 프로젝트 전체 보존·삭제1hour라는 의미 아님 |
| Request/security logs | 전달·보안 운영 목적과 상품별 기능 | 계정별 전체 위치/보유 기준 미확정. Runtime 숫자를 대입하지 않음 |
| Build logs | 빌드 도구·경고·의존성 기록 | 실제 새 배포 로그/BUILD_ID/Node는 확보. 공급자 전체 삭제 기한은 미확정 |
| Web Analytics | 기능/계정 설정과 실제 전송을 별도 판단 | metadata에 ID는 있으나 enabled값 부재. ID만으로 활성 판단 불가. US 실제 요청 행렬에서 별도 검사 |
| Speed Insights | 별도 서비스 | metadata 빈 객체. 실전송 코드·네트워크와 대조, 활성이라고 추정하지 않음 |
| 하위 처리업체 | 공개 subprocessors 링크가 Trust Center로 이동 | 전체 실제 계약상 적용 목록·국가·재이전 확정 안 됨. 가입/동의/계약 요청하지 않음 |
| 삭제·권리 | 공급자 자체 Privacy 창구와 계약상 통제를 구분 | 운영자 계정이 모든 IP/보안 로그를 삭제할 권한 있다고 가정하지 않음 |

Vercel Terms 최신 **2026-10-19 §4**는 personal **or** non-commercial. 과거 검색 캐시의 더 제한적인 문구와 혼동하지 않는다. 현재 한국 광고 코드만 존재/실제 노출·수익 없음, 개인 무료 운영이라는 사실을 고려해 현재 확정 위반이라고 단정하지 않았다. 향후 광고·제휴·수익·조직 이용은 **별도 적합성 재검토** 조건이다. 요금제 업그레이드·결제·계약 체결은 수행하지 않았다.

DPA 최신 2026-03-31 유효본문 §§1/4.1은 **Pro/Enterprise**에 적용한다. actual Hobby에 같은 DPA가 자동 적용된다는 근거는 확보하지 못했다. 일반 Terms/Privacy와 한국법상 필요한 위탁의 서면 내용·국외이전 근거를 공급자 역할별로 채워야 한다. DPA 미적용 하나만으로 모든 Hobby 서비스 위법이라고 결론내리지 않지만, 이 프로젝트의 공개 고지·계약상 보호 근거를 완료로 표시할 수 없다.

개인 Gmail도 Workspace DPA를 적용하지 않는다. Google 일반 Privacy2026-10-16, Gmail 삭제 지침과 실제 계정 유형은 확인했다. 글로벌 처리 국가·재이전·필수 보유 기준·거부 시 결과는 일반 ‘전 세계’ 문구로 법정 필수 고지를 완료했다고 보지 않는다. 이와 관련된 Privacy **BLOCKED_POLICY**를 유지한다. 기간 특정 불가 시 적법한 결정 기준을 사용할 수 있으므로 숫자를 창작하거나 불필요하게 고정 일수만 강요하지 않는다.

이번 작업은 metadata와 기존 인증으로 읽기 및 승인된 Preview 배포만 수행했다. secret env pull, provider plan/env/DNS/alias/Production 변경, 제삼자 문의 전송은 없다. 예전 환경변수 다운로드 승인 거절 경로는 다시 시도하지 않았다.
`);
const allow=JSON.parse(fs.readFileSync('lib/us/release-allowlist.json','utf8'));
const gate=pub.rows.map(r=>({...r,scope:'LOCAL_PUBLIC_GUARD',build_id:pub.buildId}));
const privacyRow=pub.rows.find(r=>r.path==='/us/privacy');
const privacyStatus=allow.find(r=>r.path==='/us/privacy')?.status;
if(privacyStatus==='BLOCKED_POLICY')gate.push({path:'/us/privacy',expected:'Mandatory policy must be finalized and publicly accessible before launch',actual:'BLOCKED_POLICY /404 in isolated public mode',noindex:true,result:'BLOCKED',environment:'RELEASE_READINESS',scope:'LEGAL_PUBLICATION_GATE',build_id:d.buildId});
else if(privacyRow)gate.push({path:'/us/privacy',expected:'200 in isolated public mode with noindex',actual:`${privacyRow.http} / noindex ${privacyRow.noindex}`,noindex:true,result:privacyRow.http===200?'PASS':'FAIL',environment:'RELEASE_READINESS',scope:'LEGAL_PUBLICATION_GATE',build_id:d.buildId});
csv('PHASE-US9B-PUBLICATION-GATE-QA.csv',gate);
const net=browser.network.map(r=>({path:r.path,width:r.width,external_hosts:[...new Set(r.external.map(x=>new URL(x.url).hostname))].join(';'),external_requests:r.external.length,us_analytics_ads:r.analytics_or_ads.length,result:r.analytics_or_ads.length?'FAIL':'PASS',scope:'US-only page matrix; provider Preview tooling retained',build_id:d.buildId}));net.push({path:'US private sentinels',width:'workspace/search',external_hosts:'See deep-audit.json',external_requests:deep.external?.length??'NOT_RUN',us_analytics_ads:'N/A: deep test includes subsequent KR navigation',result:deep.rows.find(r=>r.test==='US private sentinel network')?.status??'NOT_RUN',scope:'No private sentinel on external request URL/body; KR script request is separate',build_id:d.buildId});csv('PHASE-US9B-NETWORK-PRIVACY-QA.csv',net);
md('PREVIEW-REPORT',`
최종 보호 Preview: **${d.previewUrl??'NOT_RUN'}**. Deployment **${d.deploymentId??'NOT_RUN'}**, build **${d.buildId??'NOT_RUN'}**, source SHA256 **${d.sourceSha256??'NOT_RUN'}**. 클라우드 source build, environment preview, Node **${d.node??'NOT_RUN'}**. 원본311개 소스 파일 manifest 및 cloud-build.log에 출처 기록. 로컬 전체 빌드와 클라우드 BUILD_ID는 같다고 주장하지 않는다.

${JSON.stringify(read('protection-boundary'),null,2)}

실제 HTTP ${http.rows.length}/108, 내부 링크 ${http.edges.length}; 브라우저 ${browser.rows.length}/530; deep ${deep.rows.length}/34. 모두 이 최종 BUILD_ID로 구분한다. 1차 확인용 Preview jzduO2rTiW6D6pAskiq42는 최종 사용자 사실 추가 이전 버전이므로 최종 PASS로 재사용하지 않았다. US8/US9A PASS도 그대로 복사하지 않았다.

보호 Preview를 Production으로 promote하면 런타임 guard가 US 접근을 닫는다. 향후 별도 public build와 사용자 승인이 필요하다. Preview 도구 vercel.live 요청은 남아 있을 수 있으며 GA/광고 비활성 검사를 ‘외부 요청 전무’라고 바꾸지 않는다. 보호 자격값은 보고서에 기록하지 않았고 정확히 이 Preview origin에만 전송했다.
`);
md('KR-REGRESSION',`
기존 Production: 전후 **${before.deploymentId??'NOT_RUN'} / ${after.deploymentId??'NOT_RUN'}**. alias ampory.vercel.app 변경 없음. US는 기존 Production에서404. 마지막 Production 확인은 production-after.json 참조.

최종 Preview에서 한국 sitemap **${kr.sitemap?.current??'NOT_RUN'}**, 원본 집합 동일 **${kr.sitemap?.setEqual??'NOT_RUN'}**, US sitemap **${kr.sitemap?.us??'NOT_RUN'}**. 한국 공개71/미공개1/가이드34 기준 유지. HTTP/metadata 비교 ${kr.rows?.length??0}개, 실패 ${(kr.rows??[]).filter(r=>r.http!==200||r.metadata==='FAIL').length}. 정적 생성은 같은 소스의 로컬 public-build prerender manifest와 별도로 대조했으며, 원격에 없는 파일을 직접 읽었다고 표시하지 않았다.

한국 대표 브라우저 ${kb.rows.length}/20, 실패 ${kb.rows.filter(r=>r.status==='FAIL').length}. 단상3000/220≈13.64 A 독립 예 포함. 기존 shared math/calculation 엔진 변경 ${(kr.engines??[]).filter(r=>!r.unchanged).length}, HEAD/origin ${kr.head??'NOT_RUN'} / ${kr.origin??'NOT_RUN'}.

이번 정책·접근 제어 변경은 US 영역에 한정했다. 한국 정책/광고 활성 상태는 변경하지 않았다. 발견 사항: KR의 공급자/국외처리 고지·현행법 정합성 및 ‘코드 존재 vs 실제 광고 미게재/수익 없음’ 표현은 별도 검토 대상이다. 이는 KR의 법적 적합성을 이미 승인했다는 의미가 아니다.
`);
md('PRODUCTION-DEPLOYMENT-PLAN',`
**실행하지 않은 향후 계획**이다. Production 배포는 사용자 미승인, US9C 자동 진행 없음. 현재 전체 준비도 BLOCKED.

1. Privacy의 공급자 역할·서면 처리/위탁 조건·한국법 국외근거·실제 국가/수령자/연락/목적/보유 기준/거부효과를 확인한다. 개인 Gmail/실제 Hobby에 다른 상품 DPA를 임의 적용하지 않는다. 필요한 최소 추가 사실/공급자 근거를 확보하고 정책·인벤토리·운영 절차를 갱신한다. 변호사 자문 자체를 무조건 선행조건으로 만들지 않는다.
2. 누락 법정 정보가 해소되면 Privacy만 READY_NOINDEX로 승급하여 후보74/noindex28을 검증한다. 필수 정책5종 footer 및 본문200/noindex를 새 public build에서 검사한다. technical32와35/5/3 범위는 별도 기술 검증 없이는 변경하지 않는다.
3. 공개 allowlist를 포함한 별도 public 빌드를 만들고 보호 Preview 산출물의 Production promotion을 금지한다. 자동화 인증·query·cookie·header가 public gate를 우회하지 않는지 검증한다. GA4/광고/제휴는 비활성 유지한다. 현재 프로젝트의 env나 plan은 이 문서로 변경 권한을 받지 않는다.
4. INDEXABLE-URL-PLAN.csv46개만 색인/sitemap 후보. 한국132와 합계178은 **계획**이다. noindex 정책/utility/보류 경로는 넣지 않는다. HREFLANG-PUBLICATION-PLAN.csv의 실제 한국 대응 관계와 양쪽 공개 상태를 확인한 경우만 상호 연결하며 자체 canonical을 유지한다. US 전용 가상의 한국 URL 및 무근거 x-default를 만들지 않는다.
5. 색인 허용·sitemap/hreflang 활성화는 향후 별도 승인된 release 변경으로 검증한다. 이번 Preview는 전체 noindex, 실제 US sitemap/hreflang0. 검색 도구 제출/크롤링 요청도 아직 하지 않는다.
6. 화면 읽기 실제 세션 미실행·불완전 접근성 판정·모바일 LCP 잔여 위험을 보고 검토한 뒤 구체적인 코드·빌드·도메인·검증·롤백 대상으로 최종 사용자 승인을 받는다. 승인이 없으면 배포·promote·alias·DNS·git push/commit을 하지 않는다.
7. 추후 승인된 공개 배포 직후 KR132/US46 sitemap, allowlist/noindex, 정책5종, 대표계산/국가전환/광고 분리·네트워크·로그를 재검사한다. 실패하면 확인된 기존 Production deployment dpl_75hZUXW4Fa6Y1YDjSdBk6U8syV9J를 복원하는 구체적 범위를 별도 승인 흐름에 포함한다. 이번에 롤백이나 alias 변경을 실행한 것은 아니다.

향후 GA4/광고: Google 처리조건·privacy 변경, 지역별 동의/거부·GPC/UOOM 해당성, CMP 필요성, 이벤트 보유 설정과 집계 데이터 차이, 개인화 광고, AdSense/제휴 고지, 이전근거를 검토한다. 이벤트명/도구ID 등 최소 허용목록만 검토하고 검색 원문·계산 입력/결과·프로젝트 이름·워크스페이스·이메일·개인정보 URL을 전송하지 않는다. 쿼리/경로 정제까지 포함한다. 신규 CMP/유료 서비스/계약을 만들지 않았으며 실제 활성화는 별도 승인이다. 미래 수익화 전 Vercel Hobby 조건·사업/세무·상업 고지를 다시 평가한다.
`);
md('PERFORMANCE-REPORT',`
Lighthouse는 실제 최종 보호 Preview에 대해 origin-bound HttpOnly 인증 cookie로 수행하며, 전역 secret header를 사용하지 않는다. Chrome131 / Lighthouse13.6.0, mobile390/desktop1440, 각 대표 페이지3회, 캐시/로컬 저장소를 매회 비우고 인증만 유지한다. 모바일 simulated RTT150ms/1638.4Kbps/CPU4, desktop40ms/10240Kbps/CPU1. 실제 사용자 field CWV를 대체하지 않는다.

이번 fresh 실행 원시 JSON ${lh.rows.length}/24개. home/three-phase/Privacy/Contact로 변경 정책과 기존 모바일 LCP 잔여 위험을 확인한다. 요약 수치는 lighthouse-summary.json 참조. 현재 결과를 US8 결과로 채우지 않았다. noindex 및 보호 환경 때문에 SEO 점수의 crawlability 감점은 계획된 상태다.

US8 raw(비교 참고만)에서 home LCP는 main 소개 p, three-phase는 개발 안내 status banner였고, 별도 이미지 다운로드가 원인이 아니었다. 해당 raw breakdown의 실측 TTFB 약15/17ms, render delay 약182/282ms와 simulated LCP 약3초는 서로 다른 측정 항목이다. 공통 CSS 약24.9KB와 US CSS 약9KB의 렌더 차단 기여가 있었다. US는 이미 Noto Korean 변수 적용을 제외하고 Inter swap을 사용한다. 따라서 중요한 안내를 삭제하거나 KR 공유 CSS/폰트를 바꾸어 점수를 맞추지 않았다. 기능·표·정책 내용과 계산 정확도를 우선 유지했다.

일부 이전 US9A 요약의 ‘나머지 모바일≤918ms’ 표현은 US8 원시 결과의 hub/cable 약1069ms와 일치하지 않는다. 과거 산출물은 보존하고 이번에는 실제 raw와 median/min/max로 계산한다. 3회 실험의 느린 값도 버리지 않는다. 최종 결과에서 LCP>2500ms이면 실제 잔여 위험으로 표기하고 모든 페이지 CWV 통과라고 주장하지 않는다.
`);
const browserFail=browser.rows.filter(r=>r.status==='FAIL'),httpFail=http.rows.filter(r=>r.result==='FAIL'),deepFail=deep.rows.filter(r=>r.status==='FAIL');
md('FINAL-READINESS-REPORT',`
## 최종 판정: BLOCKED

운영자·실명·공통 이메일·6개월 수동 보관 기준과 **개인 Gmail / KR 광고 코드만 준비·실제 노출 및 수익 없음**을 반영했다. Privacy의 실제 공급자 처리·국외이전 필수 고지/근거가 아직 닫히지 않아 **READY_FOR_USER_APPROVAL로 판정하지 않는다**. 전문 법률 자문 NOT_OBTAINED 자체가 자동 차단 사유는 아니다.

공개 후보 **73** =46 release +27 noindex. 기술 보류32, 정책 보류1, 총106. 승인된 기술범위35계산기/5가이드/3워크스페이스 유지. SLD PARTIAL, load-flow BLOCKED_TECHNICAL, NEC Type3 없음. 실제 US 운영 공개·색인·sitemap·hreflang **모두0**.

| 검증 | 이번 결과 | 증거 |
|---|---|---|
| Vitest |1042 tests/63 files PASS; 최종 변경은 운영 사실 문구 보완, 별도 실제 정책 검증 수행 | vitest.log |
| Lint/type/build | public build ${build.results?.map(r=>r.name+':'+r.exitCode).join(', ')??'NOT_RUN'}; lint 기존8warnings/0errors | build-public.json 및 각 log |
| HTTP/SEO |${http.rows.length}/108, 실패${httpFail.length}; 링크${http.edges.length}, 중복 title/description 및 FAQ 검증 | HTTP-SEO-QA.csv/http-audit.json |
| 브라우저 |${browser.rows.length}/530, 실패${browserFail.length}; 5width360/390/768/1280/1440 | BROWSER-QA.csv |
| 정책 실제 문구 |${policy.rows.length}/5, 실명 lang=ko·이메일·영문·noindex 개별 검증 | policy-probe.json |
| 독립 계산 |${browser.rows.filter(r=>r.kind==='calculator'&&r.independent_expected==='PASS').length}/305; invalid/reset/unit 세부범위 CSV | browser.json |
| 심화 UI/저장 |${deep.rows.length}/34, 실패${deepFail.length}; 재로드 저장4 별도 | deep-audit.json/storage-probe.json |
| 공개 모드 |${pub.rows.length} checks, 실패${pub.rows.filter(r=>r.result==='FAIL').length}; 링크${pub.links.length}, 보류 링크${pub.links.filter(r=>r.result==='FAIL').length} | PUBLICATION-GATE-QA.csv |
| 접근성 | axe ${browser.accessibility.length}/106, 위반 경로${browser.accessibility.filter(r=>r.violations.length).length}; 이전64경로 재검토${manual.rows.length}/64; 실제 화면 읽기 NOT_RUN | ACCESSIBILITY-QA.csv/accessibility-manual-review.json |
| Lighthouse | fresh${lh.rows.length}/24; 초과/잔여위험 유지 | PERFORMANCE-REPORT/lighthouse raw |
| US GA/광고 | 실제 matrix 전송${browser.network.reduce((n,r)=>n+r.analytics_or_ads.length,0)} | NETWORK-PRIVACY-QA.csv |
| KR 회귀 | sitemap${kr.sitemap?.current??'NOT_RUN'}, 원본집합${kr.sitemap?.setEqual??'NOT_RUN'}, shared engine 변경${(kr.engines??[]).filter(r=>!r.unchanged).length}; 브라우저${kb.rows.length}/20 | KR-REGRESSION.md |
| Production 보존 |${before.deploymentId&&before.deploymentId===after.deploymentId?'PASS':'NOT_RUN'}; 기존 /us404 | production-before/after.json |

최종 Preview **${d.previewUrl??'NOT_RUN'}**, build **${d.buildId??'NOT_RUN'}**, Node **${d.node??'NOT_RUN'}**. 보호와 별도 로컬 public-build를 구분한다. 전체 noindex 유지. 상세20종 산출물과 raw는 artifacts/us9b에 저장했다. 예전 PASS를 이번 결과로 재사용하지 않았다.

잔여: (1) Privacy 국외/위탁 처리 근거·실제 국가/하위처리/보유 기준/거부 효과 확인, (2) 필수 Privacy 공개 접근 검증, (3) 실제 NVDA/Narrator 등 읽기 검증 미실행 및 workspace contrast incomplete의 수동 확인 한계, (4) 모바일 LCP 잔여위험, (5) 수익화/규모/지역 변경 시 법적 범위 재평가. 법무·안전 미해결을 숨겨 승인 요청 단계로 넘기지 않는다.

다음 승인 단계는 위 실제 차단을 해소한 후의 별도 Production 계획이다. 이번에는 Production 배포·promote·alias/DNS/env/plan 변경·git commit/push·GA/광고 활성화·US9C 착수하지 않았다.
`);
const riskFile='PHASE-US0-RISK-REGISTER.csv';let risk=fs.readFileSync(riskFile,'utf8');for(const row of [
['R-US9B-01','P1','high','privacy','Actual Hobby and consumer Gmail overseas outsourcing contract countries retention basis unresolved','US public release','Keep Privacy BLOCKED_POLICY and entire public launch BLOCKED; obtain actual provider/legal basis','US-9C','open'],
['R-US9B-02','P2','medium','accessibility','Actual screen reader not run; workspace incomplete color overlap review has limits','US accessibility','Keep NOT_RUN and residual review status; do not equate ARIA snapshot with spoken output','US-9C','open'],
['R-US9B-03','P2','medium','performance','Mobile lab LCP may exceed2500ms despite high performance score','US mobile','Fresh repeated real Preview Lighthouse and median min max; preserve safety content and KR code','US-9C','open'],
['R-US9B-04','P2','medium','hosting','Future monetization may change Hobby and business tax applicability','US future ads and KR','Current no ad display revenue confirmed; reassess official current terms before monetization; no plan mutation','US-10','open']])if(!risk.includes(row[0]))risk+='\n'+row.map(v=>'"'+v.replaceAll('"','""')+'"').join(',');fs.writeFileSync(riskFile,risk.trimEnd()+'\n');
console.log(JSON.stringify({documentsGenerated:true,status:'BLOCKED',statusCount,browser:browser.rows.length,http:http.rows.length,lighthouse:lh.rows.length}));
