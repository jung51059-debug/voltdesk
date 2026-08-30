import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { InfoCard } from "@/components/ui/info-card";
import { JsonLd } from "@/components/seo/json-ld";
import { TrackRecentArticle } from "@/components/references/track-recent-article";
import { articles, getArticleBySlug, getRelatedToolsForArticle } from "@/lib/data/articles";
import { getCategoryById } from "@/lib/data/categories";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: article.href },
    openGraph: { title: article.title, description: article.summary },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();
  const category = getCategoryById(article.categoryId);
  const tools = getRelatedToolsForArticle(article);

  return (
    <article>
      <TrackRecentArticle id={article.id} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", href: "/" },
          { name: "실무 참고", href: "/references" },
          { name: article.title, href: article.href },
        ])}
      />
      {article.faqs && article.faqs.length > 0 ? <JsonLd data={faqJsonLd(article.faqs)} /> : null}
      <Breadcrumb
        items={[
          { href: "/", label: "홈" },
          { href: "/references", label: "실무 참고" },
          ...(category ? [{ href: `/references#${category.slug}`, label: category.name }] : []),
          { label: article.title },
        ]}
      />
      <header className="max-w-3xl">
        <p className="text-sm text-muted">{category?.name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{article.title}</h1>
        <p className="mt-4 text-base leading-8 text-muted">{article.summary}</p>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="max-w-3xl space-y-10">
          <section className="border-l-2 border-primary pl-4">
            <h2 className="text-sm font-semibold tracking-wide text-primary uppercase">핵심 개념</h2>
            <p className="mt-2 leading-7">{article.keyConcept}</p>
            {article.formula ? <p className="mt-3 font-mono text-sm text-ink">{article.formula}</p> : null}
          </section>
          {article.body.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-7 text-ink/90">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
          <section>
            <h2 className="text-xl font-semibold">실무 예</h2>
            <p className="mt-3 leading-7">{article.practicalExample}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">한계와 주의</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-7 text-muted">
              {article.limitations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold">출처·참고</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
              {article.sourceNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          {article.faqs && article.faqs.length > 0 ? (
            <section>
              <h2 className="text-xl font-semibold">FAQ</h2>
              <dl className="mt-3 space-y-4">
                {article.faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="font-medium">{faq.question}</dt>
                    <dd className="mt-1 leading-7 text-muted">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}
          {tools.length > 0 ? (
            <section>
              <h2 className="text-xl font-semibold">관련 Ampory 계산기</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
                {tools.map((tool) =>
                  tool ? (
                    <li key={tool.id}>
                      <Link href={tool.href} className="text-primary hover:underline">
                        {tool.name}
                      </Link>
                      <span className="text-muted"> — {tool.description}</span>
                    </li>
                  ) : null,
                )}
              </ul>
            </section>
          ) : null}
        </div>
        <div className="space-y-4">
          {tools[0] ? (
            <InfoCard title="관련 계산기" href={tools[0].href} cta={`${tools[0].name} 실행`}>
              이 개념을 숫자로 확인하려면 계산기를 사용하세요. 결과는 설계 승인이 아닙니다.
            </InfoCard>
          ) : null}
          <div className="rounded-lg border-t border-border pt-5">
            <h2 className="text-sm font-semibold">함께 보면 좋은 도구</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {tools.map((tool) =>
                tool ? (
                  <li key={tool.id}>
                    <Link href={tool.href} className="text-primary hover:underline">
                      {tool.name}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
