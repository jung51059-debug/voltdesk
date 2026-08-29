import { readJson, writeJson } from "@/lib/storage/local";

export function persist<T>(key: string, fallback: T) {
  return {
    load: () => readJson<T>(key, fallback),
    save: (value: T) => writeJson(key, value),
  };
}

export function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
