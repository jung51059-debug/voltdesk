import fs from "node:fs";

// Minimal CSV parse for quoted fields (accessibility export shape).
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (c === "," && !q) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const raw = fs.readFileSync("PHASE-US8-ACCESSIBILITY-QA.csv", "utf8").trim().split("\n");
const header = splitCsvLine(raw[0]);
const vi = header.indexOf("violations");
const ii = header.indexOf("incomplete");
const ai = header.indexOf("automatic_axe");
let violPages = 0;
let incompPages = 0;
let incompNodes = 0;
const ruleCounts = new Map();
for (const line of raw.slice(1)) {
  const cols = splitCsvLine(line);
  const violations = JSON.parse(cols[vi] || "[]");
  const incomplete = JSON.parse(cols[ii] || "[]");
  if (violations.length) violPages++;
  if (incomplete.length) {
    incompPages++;
    for (const r of incomplete) {
      incompNodes += r.nodes ?? 0;
      ruleCounts.set(r.id, (ruleCounts.get(r.id) ?? 0) + 1);
    }
  }
}
const axeFail = raw.slice(1).filter((l) => splitCsvLine(l)[ai] === "FAIL").length;
console.log(
  JSON.stringify(
    {
      axeRowsAt390: raw.length - 1,
      automaticAxeFail: axeFail,
      pagesWithViolations: violPages,
      pagesWithIncomplete: incompPages,
      incompleteNodeRefs: incompNodes,
      incompleteRulesByPage: Object.fromEntries(ruleCounts),
      screenReader: "NOT_RUN (column marked NOT_RUN)",
    },
    null,
    2,
  ),
);