import Link from "next/link";
import { getElectricalCategories, getFacilityCategories } from "@/lib/data/categories";

export function Footer() {
  const electrical = getElectricalCategories();
  const facility = getFacilityCategories();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-semibold">VoltDesk</p>
          <p className="mt-2 text-sm leading-6 text-muted">전기·시설 실무를 위한 빠른 계산과 기술 참고자료.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">전기 계산</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {electrical.slice(0, 6).map((category) => (
              <li key={category.id}>
                <Link href={`/tools/electrical#${category.slug}`} className="hover:text-primary">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">시설 관리</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {facility.map((category) => (
              <li key={category.id}>
                <Link href={`/tools/facility#${category.slug}`} className="hover:text-primary">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">사이트</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/privacy" className="hover:text-primary">
                개인정보 처리방침
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-primary">
                이용약관
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-primary">
                문의
              </Link>
            </li>
            <li>
              <Link href="/sources" className="hover:text-primary">
                참고 문헌·출처
              </Link>
            </li>
            <li>
              <Link href="/sitemap.xml" className="hover:text-primary">
                사이트맵
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs leading-5 text-muted sm:px-6">
          계산 결과는 엔지니어링 보조 도구입니다. 실제 설계, 시공, 검사, 기기 선정에는 현장 조건과 적용 규정이 추가로
          필요합니다. 프로젝트별 법규·제조사 데이터를 반드시 확인하세요.
        </p>
      </div>
    </footer>
  );
}
