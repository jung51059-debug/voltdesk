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

/** 한글·영문 동의어. 검색어를 여러 표현으로 펼칩니다. */
const QUERY_ALIASES: Record<string, string[]> = {
  전선: ["전선", "케이블", "cable", "wire", "굵기"],
  케이블: ["케이블", "전선", "cable", "wire"],
  cable: ["cable", "케이블", "전선", "wire"],
  wire: ["wire", "전선", "케이블", "cable"],
  전압강하: ["전압강하", "voltage drop", "선로전압강하"],
  "voltage drop": ["voltage drop", "전압강하"],
  단락: ["단락", "단락전류", "short circuit", "fault current"],
  단락전류: ["단락전류", "단락", "short circuit", "fault current"],
  "short circuit": ["short circuit", "단락", "단락전류", "fault current"],
  "fault current": ["fault current", "단락전류", "단락", "short circuit"],
  변압기: ["변압기", "transformer", "kVA"],
  transformer: ["transformer", "변압기"],
  모터: ["모터", "전동기", "motor", "FLC"],
  motor: ["motor", "모터", "전동기"],
  발전기: ["발전기", "generator", "비상발전기"],
  generator: ["generator", "발전기"],
  ups: ["ups", "무정전"],
  배터리: ["배터리", "battery", "축전지"],
  battery: ["battery", "배터리"],
  ct: ["ct", "변류기", "변류비"],
  변류기: ["변류기", "ct", "변류비"],
  pt: ["pt", "vt", "변성기"],
  vt: ["vt", "pt", "변성기"],
  역률: ["역률", "power factor", "콘덴서", "역률개선"],
  "power factor": ["power factor", "역률"],
  콘덴서: ["콘덴서", "역률", "kvar", "capacitor"],
  접지: ["접지", "grounding", "earth", "접지봉"],
  grounding: ["grounding", "접지", "earth"],
  spd: ["spd", "서지", "피뢰", "낙뢰"],
  낙뢰: ["낙뢰", "spd", "피뢰"],
  조명: ["조명", "lux", "조도", "루멘"],
  lux: ["lux", "조명", "조도"],
  태양광: ["태양광", "solar", "pv", "태양광발전"],
  solar: ["solar", "태양광", "pv"],
};

function expandQuery(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const key = trimmed.toLowerCase();
  const aliases = QUERY_ALIASES[key] ?? QUERY_ALIASES[trimmed];
  const extra = aliases ? aliases : [];
  return Array.from(new Set([trimmed, ...extra]));
}

export function searchCatalog(query: string, limit = 20): SearchHit[] {
  const needles = expandQuery(query);
  if (needles.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const tool of getPublishedTools()) {
    const parts = [tool.name, tool.nameEn, tool.description, ...tool.tags, ...tool.synonyms];
    const score = Math.max(0, ...needles.flatMap((needle) => parts.map((part) => scoreMatch(part, needle))));
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
    const score = Math.max(0, ...needles.flatMap((needle) => parts.map((part) => scoreMatch(part, needle))));
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
    const score = Math.max(0, ...needles.flatMap((needle) => parts.map((part) => scoreMatch(part, needle))));
    if (score > 0) {
      const href = category.order < 90 ? `/tools/categories/${category.slug}` : `/references#${category.slug}`;
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

export const SEARCH_EXAMPLES = [
  "전압강하",
  "voltage drop",
  "단락전류",
  "변압기",
  "모터",
  "UPS",
  "배터리",
  "CT",
  "역률",
  "접지",
  "조명",
  "태양광",
];
