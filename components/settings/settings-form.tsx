"use client";

import { DEFAULT_PREFERENCES, type LanguagePreference, type ThemePreference, type UnitSystem } from "@/lib/types";
import { usePreferences } from "@/components/providers/preferences-provider";
import { clearHistory, clearRecent } from "@/lib/storage/local";
import { useToast } from "@/components/providers/toast-provider";

export function SettingsForm() {
  const { prefs, setPrefs, patchPrefs } = usePreferences();
  const { push } = useToast();

  return (
    <form className="max-w-xl space-y-6 rounded-[22px] border border-border bg-card p-6" onSubmit={(e) => e.preventDefault()}>
      <label className="block text-sm font-medium">
        테마
        <select
          className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-3"
          value={prefs.theme}
          onChange={(e) => patchPrefs({ theme: e.target.value as ThemePreference })}
        >
          <option value="system">시스템</option>
          <option value="light">라이트</option>
          <option value="dark">다크</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        기본 전압 (V)
        <input
          className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-3"
          type="number"
          value={prefs.defaultVoltage}
          onChange={(e) => patchPrefs({ defaultVoltage: Number(e.target.value) || 0 })}
        />
      </label>
      <label className="block text-sm font-medium">
        기본 주파수
        <select
          className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-3"
          value={prefs.defaultFrequency}
          onChange={(e) => patchPrefs({ defaultFrequency: Number(e.target.value) === 50 ? 50 : 60 })}
        >
          <option value={60}>60 Hz (한국 표준)</option>
          <option value={50}>50 Hz</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        단위계
        <select
          className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-3"
          value={prefs.unitSystem}
          onChange={(e) => patchPrefs({ unitSystem: e.target.value as UnitSystem })}
        >
          <option value="si">SI (kW, m, mm²)</option>
          <option value="mixed">혼합 (HP, ft 허용)</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        소수점 자릿수
        <input
          className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-3"
          type="number"
          min={0}
          max={6}
          value={prefs.precision}
          onChange={(e) => patchPrefs({ precision: Math.min(6, Math.max(0, Number(e.target.value) || 0)) })}
        />
      </label>
      <label className="block text-sm font-medium">
        언어 (구조만 준비)
        <select
          className="mt-2 h-12 w-full rounded-xl border border-border bg-surface px-3"
          value={prefs.language}
          onChange={(e) => patchPrefs({ language: e.target.value as LanguagePreference })}
        >
          <option value="ko">한국어</option>
          <option value="en">English (준비 중, UI는 한국어 유지)</option>
        </select>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="h-12 rounded-xl border border-border"
          onClick={() => {
            clearRecent();
            push("최근 도구·검색 기록을 삭제했습니다.");
          }}
        >
          최근 기록 삭제
        </button>
        <button
          type="button"
          className="h-12 rounded-xl border border-border"
          onClick={() => {
            clearHistory();
            push("로컬 계산 이력을 삭제했습니다.");
          }}
        >
          계산 이력 삭제
        </button>
      </div>
      <button
        type="button"
        className="h-12 w-full rounded-xl bg-info text-sm font-medium text-primary"
        onClick={() => {
          setPrefs(DEFAULT_PREFERENCES);
          push("기본값으로 되돌렸습니다.");
        }}
      >
        설정 기본값 복원
      </button>
    </form>
  );
}
