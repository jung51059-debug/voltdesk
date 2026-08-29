import Image from "next/image";

export function AmporyMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/ampory-icon.png"
      alt=""
      width={72}
      height={72}
      className={className}
      aria-hidden
      priority={priority}
    />
  );
}

export function AmporyWordmark({ className }: { className?: string }) {
  return (
    <span className={`font-bold tracking-[0.16em] ${className ?? ""}`}>
      <span className="text-[#0D1B2A] dark:text-white">AMP</span>
      <span className="text-[#FFC107]">ORY</span>
    </span>
  );
}
