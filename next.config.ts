import type { NextConfig } from "next";
import { resolveUsReleaseMode } from './lib/us/release-environment.mjs';

const nextConfig: NextConfig = {
  // Allow isolated local regression builds without overwriting a running dev server.
  distDir: process.env.AMPORY_QA_DIST_DIR || ".next",
  // Preview/Development 배포에서 Production GA4로 이벤트가 섞이지 않게 클라이언트에 노출합니다.
  env: {
    AMPORY_US_BUILD_MODE: resolveUsReleaseMode(process.env) || 'disabled',
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
  async redirects() {
    return [
      {
        source: "/tools/electrical/motor-start-vd",
        destination: "/tools/electrical/motor-starting",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
