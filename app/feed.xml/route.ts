import { buildArticleRss } from "@/lib/rss";

export function GET() {
  return new Response(buildArticleRss(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
