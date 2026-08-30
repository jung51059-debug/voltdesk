import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
