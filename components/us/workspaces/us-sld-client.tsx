"use client";

import Link from "next/link";
import {isUsNavigationVisible} from '@/lib/us/release-gate';
import { useEffect } from "react";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { SLD_KIND_LABEL, type SldEdge, type SldKind, type SldNode } from "@/lib/data/sld";
import { US_SLD_KIND_LINKS } from "@/lib/data/sld-us";
import { useUsDraft } from './use-us-draft';
import { decodeUsSld } from '@/lib/us/workspaces/draft-shapes';
import { pushRecentTool } from "@/lib/storage/local";

type Draft = { nodes: SldNode[]; edges: SldEdge[] };

const DEFAULT_DRAFT:Draft = {
  nodes: [
    { id: "N1", kind: "utility", name: "Utility service", calculatorHref: US_SLD_KIND_LINKS.utility },
    { id: "N2", kind: "transformer", name: "XFMR-1", calculatorHref: US_SLD_KIND_LINKS.transformer },
    { id: "N3", kind: "panel", name: "MDP", calculatorHref: US_SLD_KIND_LINKS.panel },
  ],
  edges: [
    { id: "E1", from: "N1", to: "N2", kind: "cable" },
    { id: "E2", from: "N2", to: "N3", kind: "bus" },
  ],
};

export function UsSldClient() {
  const [draft,setDraft,storageError]=useUsDraft('voltdesk:us:sld-draft',DEFAULT_DRAFT,decodeUsSld);
  useEffect(() => {
    pushRecentTool("us-ws-sld");
  }, []);

  function addNode(kind: SldKind) {
    const id = `N${draft.nodes.length + 1}`;
    setDraft({
      ...draft,
      nodes: [
        ...draft.nodes,
        { id, kind, name: `${SLD_KIND_LABEL[kind]}-${id}`, calculatorHref: US_SLD_KIND_LINKS[kind] },
      ],
    });
  }

  return (
    <div>
      {storageError?<p role="alert" className="text-danger-ink">{storageError}</p>:null}
      <header className="mb-6 flex justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Single-line diagram draft</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            List-based SLD with links to US calculators. Symbol names are descriptive only — not an ANSI/IEEE compliance
            drawing or approval package.
          </p>
        </div>
        <FavoriteButton toolId="us-ws-sld" toolName="SLD draft" />
      </header>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SLD_KIND_LABEL) as SldKind[]).map((kind) => (
          <button key={kind} type="button" className="rounded-full border px-3 py-1 text-sm" onClick={() => addNode(kind)}>
            Add {SLD_KIND_LABEL[kind]}
          </button>
        ))}
      </div>
      <ul className="mt-6 space-y-2">
        {draft.nodes.map((node) => (
          <li key={node.id} className="rounded-xl border bg-card px-4 py-3 text-sm">
            <span className="font-medium">{node.name}</span>
            <span className="ml-2 text-muted">{SLD_KIND_LABEL[node.kind]}</span>
            {node.calculatorHref && isUsNavigationVisible(node.calculatorHref) ? (
              <Link href={node.calculatorHref} className="ml-3 text-primary underline">
                Related tool
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <h2 className="mt-6 font-semibold">Connections</h2>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        {draft.edges.map((edge) => (
          <li key={edge.id}>
            {edge.from} → {edge.to} ({edge.kind})
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">
        List + schematic preview only — not ANSI/IEEE symbol certification. Korea SLD uses the same list model (no canvas
        engine to reuse).
      </p>
      {draft.nodes.length > 0 ? (
        <svg role="img" className="mt-4 h-36 w-full rounded-lg border border-border bg-card" aria-label="Schematic preview">
          {draft.nodes.map((node, i) => {
            const x = 40 + i * (Math.min(120, 600 / draft.nodes.length) || 80);
            return (
              <g key={node.id}>
                <circle cx={x} cy={60} r={18} fill="var(--color-card)" stroke="currentColor" />
                <text x={x} y={64} textAnchor="middle" fontSize="10" fill="currentColor">
                  {node.id}
                </text>
              </g>
            );
          })}
          {draft.edges.map((edge, i) => {
            const fromI = draft.nodes.findIndex((n) => n.id === edge.from);
            const toI = draft.nodes.findIndex((n) => n.id === edge.to);
            if (fromI < 0 || toI < 0) return null;
            const step = Math.min(120, 600 / Math.max(draft.nodes.length, 1)) || 80;
            const x1 = 40 + fromI * step;
            const x2 = 40 + toI * step;
            return <line key={edge.id + i} x1={x1 + 18} y1={60} x2={x2 - 18} y2={60} stroke="currentColor" strokeWidth={2} />;
          })}
        </svg>
      ) : null}
    </div>
  );
}
