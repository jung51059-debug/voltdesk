/**
 * US region discovery on Korean pages is off until a deliberate US public build is deployed.
 * Set NEXT_PUBLIC_AMPORY_US_PUBLIC=true for local QA without Vercel production flags.
 */
export function isUsNavPublic(): boolean {
  return (
    process.env.NEXT_PUBLIC_AMPORY_US_PUBLIC === "true" ||
    process.env.AMPORY_US_BUILD_MODE === "public"
  );
}

/** All US app routes are noindex in US-1 unless explicitly published later. */
export const US_DEFAULT_ROBOTS = {
  index: false,
  follow: false,
} as const;