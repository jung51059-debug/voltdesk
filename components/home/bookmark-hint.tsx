"use client";

import { useSyncExternalStore } from "react";

function subscribeClientHint() {
  return () => {};
}

function readMacPlatform(): boolean {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac/i.test(platform);
}

/** 즐겨찾기를 대신 저장하지 않습니다. 브라우저 단축키만 안내합니다. */
export function BookmarkHint() {
  const mac = useSyncExternalStore(subscribeClientHint, readMacPlatform, () => false);
  const coarse = useSyncExternalStore(
    subscribeClientHint,
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false,
  );

  const shortcut = mac ? "⌘+D로 저장해두세요." : "Ctrl+D로 저장해두세요.";

  return (
    <p className="text-sm leading-6 text-muted lg:col-span-2">
      <span className={coarse ? undefined : "md:hidden"}>
        ⚡ 전기 실무 계산, 하나로. 브라우저에 저장해두고 필요할 때 바로 사용하세요.
      </span>
      <span className={coarse ? "hidden" : "hidden md:inline"}>
        ⚡ 전기 실무 계산, 하나로. {shortcut}
      </span>
    </p>
  );
}
