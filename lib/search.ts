import { articles } from "@/lib/data/articles";
import { categories } from "@/lib/data/categories";
import { getPublishedTools } from "@/lib/data/tools";
import type { SearchHit } from "@/lib/types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\-_/·]/g, "")
    .replace(/[()]/g, "");
}

function scoreMatch(haystack: string, needle: string): number {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n) return 0;
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  if (h.includes(n)) return 50;
  return 0;
}

export function searchCatalog(query: string, limit = 20): SearchHit[] {
  const q = query.trim();
  if (!q) return [];

  const hits: SearchHit[] = [];

  for (const tool of getPublishedTools()) {
    const parts = [tool.name, tool.nameEn, tool.description, ...tool.tags, ...tool.synonyms];
    const score = Math.max(...parts.map((part) => scoreMatch(part, q)), 0);
    if (score > 0) {
      hits.push({
        id: tool.id,
        type: "calculator",
        title: tool.name,
        description: tool.description,
        href: tool.href,
        badges: [tool.domain === "electrical" ? "전기" : "시설", tool.complexity],
        score,
      });
    }
  }

  for (const article of articles) {
    const parts = [article.title, article.summary, ...article.tags, ...article.synonyms];
    const score = Math.max(...parts.map((part) => scoreMatch(part, q)), 0);
    if (score > 0) {
      hits.push({
        id: article.id,
        type: "article",
        title: article.title,
        description: article.summary,
        href: article.href,
        badges: ["참고자료"],
        score: score - 2,
      });
    }
  }

  for (const category of categories) {
    const parts = [category.name, category.nameEn, category.description, category.slug];
    const score = Math.max(...parts.map((part) => scoreMatch(part, q)), 0);
    if (score > 0) {
      const href =
        category.domain === "facility" ? `/tools/facility#${category.slug}` : `/tools/electrical#${category.slug}`;
      hits.push({
        id: category.id,
        type: "category",
        title: category.name,
        description: category.description,
        href,
        badges: ["분류"],
        score: score - 5,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ko"));
  return hits.slice(0, limit);
}

export const SEARCH_EXAMPLES = ["전압강하", "voltage drop", "UPS", "변압기", "kVA", "역률"];
