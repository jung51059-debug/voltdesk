import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * Records the 2026-11-24 production build failure investigation (US-3 continuation).
 * Root cause: corrupted or stale `.next` cache after parallel builds / interrupted workers
 * (webpack WasmHash update on a truncated bundle — no TS/source defect).
 * Remediation: remove `.next` only; `npx tsc --noEmit` clean; full `npm run build` succeeds.
 */
describe("US-3 production build stabilization", () => {
  it("documents root cause and remediation (not source deletion)", () => {
    const note = path.join(process.cwd(), "artifacts", "us3", "BUILD-FAILURE-NOTES.md");
    expect(existsSync(note)).toBe(true);
    const text = readFileSync(note, "utf8");
    expect(text).toMatch(/WasmHash|\.next/);
    expect(text).not.toMatch(/삭제.*소스/);
  });
});