import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "이용약관",
  description: "Ampory 계산 결과는 공학 보조 도구이며 설계·시공 승인을 대체하지 않습니다.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "이용약관" }]} />
      <h1 className="text-3xl font-semibold">이용약관</h1>
      <div className="mt-6 space-y-4 leading-7">
        <p>
          본 사이트의 계산 결과와 문서는 교육 및 실무 참고용입니다. 실제 설계, 시공, 검사, 기기 선정, 법적 적합성 판단은
          자격 있는 기술자의 책임이며 적용 규정과 제조사 데이터를 따라야 합니다.
        </p>
        <p>
          단순화된 공식은 온도, 고조파, 불평형, 포설 조건, 보호협조 등을 모두 포함하지 않을 수 있습니다. 사용자는 결과를
          검증해야 합니다.
        </p>
        <p>서비스는 사전 공지 없이 공식을 개정하거나 도구를 추가·수정할 수 있습니다.</p>
      </div>
    </div>
  );
}
