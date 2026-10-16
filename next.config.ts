import type { NextConfig } from "next";
const benchmarkDir=process.env.IWONS_PERF_DIST;
if(benchmarkDir&&!/^\.next-perf-[a-z0-9-]+$/i.test(benchmarkDir))throw new Error("Use a dedicated performance build directory.");
const config: NextConfig = {
  distDir: benchmarkDir||".next",
  devIndicators: false,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { cpus: 4 },
};
export default config;
