import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "Ampory는 MVP에서 계정을 수집하지 않으며 즐겨찾기는 브라우저에 저장됩니다.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "개인정보 처리방침" }]} />
      <h1 className="text-3xl font-semibold">개인정보 처리방침</h1>
      <p className="mt-4 leading-7 text-muted">시행일: 2026-08-20</p>
      <div className="mt-6 space-y-4 leading-7">
        <p>
          Ampory 웹 계산기는 현재 회원 가입 없이 제공됩니다. 즐겨찾기, 최근 도구, 환경설정은 사용자 브라우저의
          localStorage에만 저장되며 당사 서버로 전송되지 않습니다.
        </p>
        <p>
          이후 계정 동기화, 프로젝트 저장, Pro 기능을 도입할 경우 수집 항목과 보관 기간을 이 페이지에 업데이트합니다.
        </p>
        <p>문의: contact@ampory.app (플레이스홀더 주소, 실제 운영 시 교체)</p>
      </div>
    </div>
  );
}
