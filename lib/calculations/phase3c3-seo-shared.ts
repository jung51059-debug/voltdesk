/** phase3c2c·phase3c3 공용 — meta fallback 판별 */
export function phase3c2cUsesMetaFallback(tool: {
  metaTitle?: string;
  metaDescription?: string;
  name: string;
  longDescription: string;
}): boolean {
  const title = tool.metaTitle?.trim() ?? "";
  const desc = tool.metaDescription?.trim() ?? "";
  if (!title || !desc) return true;
  if (title === tool.name) return true;
  if (desc === tool.longDescription) return true;
  return false;
}