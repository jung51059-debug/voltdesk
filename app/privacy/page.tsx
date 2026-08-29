import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description:
    "Ampory의 개인정보 처리 안내. 계정 없이 제공되며, Google 광고·쿠키 사용과 문의 방법을 안내합니다.",
  alternates: { canonical: "/privacy" },
};

const CONTACT_EMAIL = "jung51059@gmail.com";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "개인정보 처리방침" }]} />
      <h1 className="text-3xl font-semibold">개인정보 처리방침</h1>
      <p className="mt-4 leading-7 text-muted">시행일: 2026-08-20 · 최종 수정: 2026-08-29</p>
      <div className="mt-6 space-y-6 leading-7">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">수집하는 정보</h2>
          <p>
            Ampory 웹 계산기는 회원 가입 없이 제공됩니다. 즐겨찾기, 최근 도구, 환경설정은 사용자 브라우저의
            localStorage에만 저장되며 Ampory 서버로 전송되지 않습니다.
          </p>
          <p>
            이후 계정 동기화, 프로젝트 저장, Pro 기능을 도입할 경우 수집 항목과 보관 기간을 이 페이지에 업데이트합니다.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">광고·쿠키</h2>
          <p>
            본 사이트는 Google AdSense를 이용해 광고를 표시할 수 있습니다. Google을 포함한 제3자 광고 네트워크는
            쿠키, 픽셀, 기기 식별자와 같은 기술을 사용해 방문 기록과 관심사를 바탕으로 광고를 게재할 수 있습니다.
          </p>
          <p>
            Google이 파트너 사이트에서 데이터를 사용하는 방식은{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-primary underline underline-offset-2"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google 파트너 사이트에서의 데이터 사용
            </a>
            에서 확인할 수 있습니다. 맞춤 광고는{" "}
            <a
              href="https://adssettings.google.com/"
              className="text-primary underline underline-offset-2"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google 광고 설정
            </a>
            에서 제한할 수 있습니다.
          </p>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">문의</h2>
          <p>
            개인정보 관련 문의는{" "}
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
