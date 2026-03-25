import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PWA configuration will be added via next-pwa wrapper if needed
  // For now we use the web app manifest directly
};

export default nextConfig;
