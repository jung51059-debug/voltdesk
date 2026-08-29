import { useId } from "react";

const NAVY = "#0D1B2A";
const YELLOW = "#FFC107";

/** 시안: 볼드한 흰 A + 오른쪽 가로대를 가르는 노란 번개 */
export function AmporyMark({ className }: { className?: string }) {
  const clipId = useId();

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <path d="M32 6.5 55.8 58H8.2Z" />
        </clipPath>
      </defs>
      <rect width="64" height="64" rx="14" fill={NAVY} />
      <path
        fill="#FFFFFF"
        fillRule="evenodd"
        d="M32 6.5 55.8 58H45.1L40.6 45.6H23.4L18.9 58H8.2ZM32 20.2 25.8 36.6h12.4Z"
      />
      <path
        fill={YELLOW}
        clipPath={`url(#${clipId})`}
        d="M42.2 23.4 34.6 36.6h4.6L33.2 48.2 47.8 34.8h-5.1l-.5-11.4Z"
      />
    </svg>
  );
}

export function AmporyWordmark({ className }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-[0.04em] ${className ?? ""}`}>
      <span className="text-[#0D1B2A] dark:text-white">AMP</span>
      <span className="text-[#FFC107]">ORY</span>
    </span>
  );
}
