import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-muted">주소가 바뀌었거나 아직 없는 도구일 수 있습니다.</p>
      <Link href="/tools" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white dark:text-ink">
        전체 도구로 이동
      </Link>
    </div>
  );
}
