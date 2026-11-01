import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preview/Development 배포에서 Production GA4로 이벤트가 섞이지 않게 클라이언트에 노출합니다.
  env: {
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
