import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = {
  title: "Ampory 소개",
  description: "전기·시설 실무를 조금 더 빠르고 편리하게. 계산, 결과 해석, 실무 참고를 한곳에서 제공합니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl">
      <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "소개" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Ampory 소개</h1>
      <p className="mt-2 text-lg leading-7 text-muted">전기·시설 실무를 조금 더 빠르고 편리하게</p>
      <p className="mt-4 leading-7 text-muted">
        Ampory는 한국 전기·시설관리 실무자가 현장에서 바로 쓰는 계산과, 그 숫자를 어떻게 읽어야 하는지를 한곳에 둔
        도구입니다. 회원가입 없이 브라우저에서 계산합니다.
      </p>

      <div className="mt-8 space-y-8 leading-7">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">이 사이트가 하려는 일</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>현장에서 바로 쓰는 전기·시설 계산</li>
            <li>결과 해석과 적용 한계를 같이 보여 주기</li>
            <li>계산기와 실무 참고자료를 연결하기</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">계산 결과를 쓸 때</h2>
          <p>
            계산 결과는 엔지니어링 보조 도구입니다. 실제 설계·시공·검사·기기 선정에는 현장 조건과 적용 규정이 추가로
            필요합니다.
          </p>
          <p>
            Ampory는 규정 합격·인증·법적 적합을 대신하지 않습니다. 표 숫자, 제조사 곡선, 차단용량처럼 원문이 필요한
            값은 내장하지 않고 입력을 요청합니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">어디서 시작하나</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <Link href="/tools/electrical" className="font-medium text-primary hover:underline">
                전기 계산기
              </Link>
              — 전류, 전압강하, 케이블, 변압기, 모터, 보호
            </li>
            <li>
              <Link href="/tools/facility" className="font-medium text-primary hover:underline">
                시설 도구
              </Link>
              — UPS, 발전기, 사용량, 현장 확인
            </li>
            <li>
              <Link href="/references" className="font-medium text-primary hover:underline">
                실무 참고
              </Link>
              — 개념, 자주 헷갈리는 단위, 계산기 사용 맥락
            </li>
            <li>
              <Link href="/sources" className="font-medium text-primary hover:underline">
                참고 문헌·출처
              </Link>
              — 계산기가 쓰는 공식의 근거
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">운영 안내</h2>
          <p>즐겨찾기와 환경설정은 현재 사용 중인 브라우저에 저장됩니다.</p>
          <p>
            공식 오류나 가정 개선은{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              문의
            </Link>
            로 보내 주세요. 자격·면허를 사칭하지 않으며, 특정 제조사와 무관한 독립 도구입니다.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">약관·개인정보</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <Link href="/privacy" className="font-medium text-primary hover:underline">
                개인정보 처리방침
              </Link>
            </li>
            <li>
              <Link href="/terms" className="font-medium text-primary hover:underline">
                이용약관
              </Link>
            </li>
            <li>
              <Link href="/contact" className="font-medium text-primary hover:underline">
                문의
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
