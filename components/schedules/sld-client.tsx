"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TechnicalDisclosure } from "@/components/calculators/technical-disclosure";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { SLD_KIND_LABEL, SLD_KIND_LINKS, type SldEdge, type SldKind, type SldNode } from "@/lib/data/sld";
import { getFormulaById } from "@/lib/data/formulas";
import { persist } from "@/lib/storage/persist";
import { pushRecentTool } from "@/lib/storage/local";

type Draft = { nodes: SldNode[]; edges: SldEdge[] };
const store = persist<Draft>("voltdesk:sld-draft", {
  nodes: [
    { id: "N1", kind: "utility", name: "한전 인입", calculatorHref: SLD_KIND_LINKS.utility },
    { id: "N2", kind: "transformer", name: "TR-1", calculatorHref: SLD_KIND_LINKS.transformer },
    { id: "N3", kind: "bus", name: "LV BUS", calculatorHref: SLD_KIND_LINKS.bus },
  ],
  edges: [
    { id: "E1", from: "N1", to: "N2", kind: "cable" },
    { id: "E2", from: "N2", to: "N3", kind: "bus" },
  ],
});

export function SldClient() {
  const [draft, setDraft] = useState<Draft>(store.load());
  const formula = getFormulaById("formula-sld");
  useEffect(() => {
    pushRecentTool("tool-sld");
  }, []);
  useEffect(() => store.save(draft), [draft]);

  function addNode(kind: SldKind) {
    const id = `N${draft.nodes.length + 1}`;
    setDraft({
      ...draft,
      nodes: [...draft.nodes, { id, kind, name: `${SLD_KIND_LABEL[kind]}-${id}`, calculatorHref: SLD_KIND_LINKS[kind] }],
    });
  }

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">설계 / Schedule</p>
          <h1 className="mt-1 text-2xl font-semibold">단선도 초안</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            캔버스 편집은 후순위입니다. 지금은 노드·엣지 구조와 계산기 연결만 저장합니다.
          </p>
        </div>
        <FavoriteButton toolId="tool-sld" toolName="단선도 초안" />
      </header>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SLD_KIND_LABEL) as SldKind[]).map((kind) => (
          <button key={kind} type="button" className="rounded-full border px-3 py-1 text-sm" onClick={() => addNode(kind)}>
            {SLD_KIND_LABEL[kind]} 추가
          </button>
        ))}
      </div>
      <ul className="mt-6 space-y-2">
        {draft.nodes.map((node) => (
          <li key={node.id} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <span className="font-medium">{node.name}</span>
            <span className="ml-2 text-muted">{SLD_KIND_LABEL[node.kind]}</span>
            {node.calculatorHref ? (
              <Link href={node.calculatorHref} className="ml-3 text-primary">
                연결 계산기
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <h2 className="mt-6 font-semibold">연결</h2>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        {draft.edges.map((edge) => (
          <li key={edge.id}>
            {edge.from} → {edge.to} ({edge.kind})
          </li>
        ))}
      </ul>
      {formula ? <TechnicalDisclosure formula={formula} /> : null}
    </div>
  );
}
