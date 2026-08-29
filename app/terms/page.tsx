import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "이용약관",
  description: "Ampory 계산 결과는 공학 보조 도구이며 설계·시공 승인을 대체하지 않습니다.",
  alternates: { canonical: "/terms" },
};

const CONTACT_EMAIL = "jung51059@gmail.com";

export default function TermsPage() {
  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "이용약관" }]} />
      <h1 className="text-3xl font-semibold">이용약관</h1>
      <p className="mt-4 leading-7 text-muted">시행일: 2026-08-20 · 최종 수정: 2026-08-29</p>
      <div className="mt-6 space-y-6 leading-7">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">계산 결과의 성격</h2>
          <p>
            본 사이트의 계산 결과와 문서는 교육 및 실무 참고용입니다. 실제 설계, 시공, 검사, 기기 선정, 법적 적합성 판단은
            자격 있는 기술자의 책임이며 적용 규정과 제조사 데이터를 따라야 합니다.
          </p>
          <p>
            단순화된 공식은 온도, 고조파, 불평형, 포설 조건, 보호협조 등을 모두 포함하지 않을 수 있습니다. 사용자는 결과를
            검증해야 합니다.
          </p>
          <p>서비스는 사전 공지 없이 공식을 개정하거나 도구를 추가·수정할 수 있습니다.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">광고</h2>
          <p>
            사이트에는 Google AdSense 등 제3자 광고가 표시될 수 있습니다. 쿠키와 광고 데이터 처리에 대한 자세한 내용은{" "}
            <Link href="/privacy" className="text-primary underline underline-offset-2">
              개인정보 처리방침
            </Link>
            을 참고하세요.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">면책</h2>
          <p>
            Ampory는 계산 결과와 문서의 정확성, 완전성, 특정 목적에의 적합성을 보증하지 않습니다. 결과의 사용으로 발생한
            손해에 대해, 법이 허용하는 범위에서 책임을 지지 않습니다.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">문의</h2>
          <p>
            약관 관련 문의는{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            으로 보내 주세요.
          </p>
        </section>
      </div>
    </div>
  );
}
