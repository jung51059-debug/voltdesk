import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "문의",
  description: "VoltDesk 도구 오류, 공식 개정 제안, 시설 도구 요청을 받는 연락 안내.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "문의" }]} />
      <h1 className="text-3xl font-semibold">문의</h1>
      <p className="mt-4 leading-7 text-muted">
        계산 오류 제보, 공식 가정 개선, HVAC·소방 도구 요청은 아래 채널로 보내 주세요. MVP 단계의 연락처는 운영 환경에서
        실제 주소로 교체하면 됩니다.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 leading-7">
        <li>이메일: contact@voltdesk.app</li>
        <li>제목에 도구 URL과 입력값, 기대한 결과를 적어 주시면 재현이 쉽습니다.</li>
      </ul>
    </div>
  );
}
