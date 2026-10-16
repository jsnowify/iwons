import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { cpus: 4 },
};
export default config;
