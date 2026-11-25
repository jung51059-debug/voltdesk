"use client";

import { usePreferences } from "@/components/providers/preferences-provider";
import type { UserPreference } from "@/lib/types";

export function UsSettingsClient() {
  const { prefs, patchPrefs } = usePreferences();

  return (
    <form className="max-w-lg space-y-4">
      <label className="block text-sm">
        Default voltage (V)
        <input
          type="number"
          className="mt-1 h-11 w-full rounded-lg border px-3"
          value={prefs.defaultVoltage}
          onChange={(e) => patchPrefs({ defaultVoltage: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Frequency (Hz)
        <select
          className="mt-1 h-11 w-full rounded-lg border px-3"
          value={prefs.defaultFrequency}
          onChange={(e) => patchPrefs({ defaultFrequency: Number(e.target.value) as 50 | 60 })}
        >
          <option value={60}>60 Hz (US)</option>
          <option value={50}>50 Hz</option>
        </select>
      </label>
      <label className="block text-sm">
        Unit system
        <select
          className="mt-1 h-11 w-full rounded-lg border px-3"
          value={prefs.unitSystem}
          onChange={(e) => patchPrefs({ unitSystem: e.target.value as UserPreference["unitSystem"] })}
        >
          <option value="mixed">US customary + SI (mixed)</option>
          <option value="si">SI only</option>
        </select>
      </label>
      <label className="block text-sm">
        Theme
        <select
          className="mt-1 h-11 w-full rounded-lg border px-3"
          value={prefs.theme}
          onChange={(e) => patchPrefs({ theme: e.target.value as UserPreference["theme"] })}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <p className="text-xs text-muted">
        US settings persist under <code>voltdesk:preferences:us</code>. Korea settings remain under{" "}
        <code>voltdesk:preferences</code>.
      </p>
    </form>
  );
}