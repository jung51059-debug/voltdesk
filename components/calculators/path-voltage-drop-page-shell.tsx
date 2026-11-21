import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StandardStatusBadge, StandardStatusNote } from "@/components/calculators/standard-badge";
import { getStandardBasisBySlug } from "@/lib/data/standard-basis";

/** 경로 전압강하 전용 페이지 — 검색·비JS 사용자용 서버 헤더(계산 UI는 클라이언트). */
export function PathVoltageDropPageShell({ actions }: { actions?: ReactNode }) {
  const basis = getStandardBasisBySlug("path-voltage-drop");

  return (
    <>
      <Breadcrumb
        items={[
          { href: "/", label: "홈" },
          { href: "/tools/electrical", label: "전기" },
          { href: "/tools/categories/cable", label: "케이블 / 배선" },
          { label: "경로 전압강하 계산기" },
        ]}
        compact
      />
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted">케이블 / 배선</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">경로 전압강하 계산기</h1>
          {basis ? (
            <div className="mt-2 space-y-1.5">
              <StandardStatusBadge status={basis.standardStatus} />
              <StandardStatusNote status={basis.standardStatus} />
            </div>
          ) : null}
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            인입구부터 최종 부하까지 여러 배선 구간의 누적 전압강하를 검토합니다. 한 케이블만 계산하려면{" "}
            <Link href="/tools/electrical/voltage-drop" className="text-primary hover:underline">
              전압강하 계산기
            </Link>
            를 쓰세요.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-6">
            구간마다 전류나 전선이 다를 때 한 구간 계산기보다 이 도구가 맞습니다. 허용값 비교는 사용자가 넣은 기준이 있을
            때만 하며, 자동 합격이 아닙니다.
          </p>
        </div>
        {actions}
      </header>
    </>
  );
}

/** Suspense 경계 안에 둘 수 있는 최소 안내(가이드 전체 복제 없음). */
export function PathVoltageDropPanelFallback() {
  return (
    <div
      className="rounded-[16px] border border-border bg-card p-5 sm:p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-sm text-muted">경로 구간 입력 패널을 불러오는 중입니다.</p>
      <p className="mt-3 text-sm leading-6 text-muted">
        각 구간에 편도 길이(m), 전류(A), 저항(Ω/km 또는 재질·단면), 3상/단상·기준전압을 넣으면 ΣΔV와 누적 ΔV%를
        계산합니다. KEC 232.3.9 표 비교는 검토 옵션을 켠 경우에만 참고로 표시합니다.
      </p>
    </div>
  );
}