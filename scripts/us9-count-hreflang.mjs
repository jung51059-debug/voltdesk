import fs from "node:fs";
import { sitemapEntries } from "../lib/seo.ts";

const inv = JSON.parse(fs.readFileSync("lib/us/release-allowlist.json", "utf8"));
const index = new Set(
  inv.filter((r) => r.status === "READY_FOR_RELEASE" && r.proposedIndex).map((r) => r.path),
);

function parseCsv(s) {
  const result = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      if (quoted && s[i + 1] === '"') {
        value += '"';
        i++;
      } else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(value.replace(/\r$/, ""));
      value = "";
      if (c === "\n") {
        result.push(row);
        row = [];
      }
    } else value += c;
  }
  if (value || row.length) {
    row.push(value);
    result.push(row);
  }
  const [keys, ...rows] = result;
  return rows.filter((r) => r.length === keys.length).map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i]])));
}

const mappings = parseCsv(fs.readFileSync("PHASE-US7-HREFLANG-MAPPING.csv", "utf8"));
const krUrls = new Set(sitemapEntries());
const eligible = mappings.filter(
  (m) =>
    index.has(m.us_url) &&
    m.kr_url &&
    krUrls.has(m.kr_url) &&
    m.proposed_pair === "ELIGIBLE_AFTER_BOTH_PAGES_APPROVED",
);
console.log(JSON.stringify({ eligible: eligible.length, index: index.size, pairs: eligible }, null, 2));