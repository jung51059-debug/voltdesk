import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "문의",
  description: "Ampory 도구 오류, 공식 개정 제안, 시설 도구 요청을 받는 연락 안내.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "문의" }]} />
      <h1 className="text-3xl font-semibold">문의</h1>
      <p className="mt-4 leading-7 text-muted">
        계산 오류 제보, 공식 가정 개선, HVAC·소방 도구 요청은 아래 채널로 보내 주세요. Ampory는{" "}
        <a href="/about" className="text-primary underline underline-offset-2">
          소개
        </a>
        에 적은 대로 엔지니어링 보조 도구이며, 설계 대행이나 적합 판정을 하지 않습니다.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 leading-7">
        <li>
          이메일:{" "}
          <a href="mailto:jung51059@gmail.com" className="text-primary underline underline-offset-2">
            jung51059@gmail.com
          </a>
        </li>
        <li>제목에 도구 URL과 입력값, 기대한 결과를 적어 주시면 재현이 쉽습니다.</li>
        <li>
          계산 기준과 출처는{" "}
          <a href="/sources" className="text-primary underline underline-offset-2">
            참고 문헌·출처
          </a>
          에서 확인할 수 있습니다.
        </li>
      </ul>
    </div>
  );
}
