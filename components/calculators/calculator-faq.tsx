import type { CalculatorTool } from "@/lib/types";

/** 전용 도구 페이지에서도 JSON-LD와 같은 FAQ 데이터를 본문에 표시합니다. */
export function CalculatorFaq({ faqs }: { faqs: CalculatorTool["faqs"] }) {
  if (!faqs.length) return null;
  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">FAQ</h2>
      <dl className="mt-3 space-y-4">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt className="text-sm font-medium">{faq.question}</dt>
            <dd className="mt-1 text-sm leading-7 text-muted">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
