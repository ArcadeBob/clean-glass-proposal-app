import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variable validation happens at runtime in the app
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
