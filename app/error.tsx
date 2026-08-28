"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold">표시 중 문제가 발생했습니다</h1>
      <p className="mt-3 text-sm text-muted">{error.message}</p>
      <button type="button" className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white dark:text-ink" onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}
