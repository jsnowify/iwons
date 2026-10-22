import type { NextConfig } from "next";
import deployment from "./vercel.json";
import { decodeAuthSecret } from "./src/lib/accounts/auth-secret.ts";
// Exit startup on invalid secrets; instrumentation also
// validates runtime configuration when a serverless instance initializes.
decodeAuthSecret(process.env.AUTH_SECRET);
const benchmarkDir=process.env.IWONS_PERF_DIST;
if(benchmarkDir&&!/^\.next-perf-[a-z0-9-]+$/i.test(benchmarkDir))throw new Error("Use a dedicated performance build directory.");
const config: NextConfig = {
  distDir: benchmarkDir||".next",
  devIndicators: false,
  trailingSlash: true,
  images: { unoptimized: true },
  // Next owns /_next/static caching: dev chunks change at stable URLs, while
  // production chunks receive immutable headers only when content-hashed.
  async headers() { return deployment.headers; },
  async redirects() { return deployment.redirects; },
  experimental: { cpus: 4, webpackBuildWorker: true },
};
export default config;
