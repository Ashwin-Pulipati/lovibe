import type { NextConfig } from "next";

type NextConfigWithEslint = NextConfig & {
  eslint?: {
    ignoreDuringBuilds?: boolean;
  };
};

const nextConfig: NextConfigWithEslint = {
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
