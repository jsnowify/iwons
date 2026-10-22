import "server-only";
import { decodeAuthSecret } from "./auth-secret";

export interface AuthConfig { secret: Uint8Array; origin: string; allowedOrigins: string[]; production: boolean; trustedIpHeader?: string }
export function authConfig(env: Record<string, string | undefined> = process.env): AuthConfig {
  const secret = decodeAuthSecret(env.AUTH_SECRET);
  function origin(value: string) {
    const url = new URL(value);
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash ||
      !(url.protocol === "https:" || url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      throw new Error("Use an HTTPS site origin in AUTH_URL (HTTP is allowed only for localhost).");
    return url.origin;
  }
  const site = origin(env.AUTH_URL || env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001");
  const allowedOrigins = [site];
  if (env.VERCEL === "1" && env.VERCEL_URL) allowedOrigins.push(origin(`https://${env.VERCEL_URL}`));
  return { secret, origin: site, allowedOrigins, production: env.NODE_ENV === "production",
    trustedIpHeader: env.VERCEL === "1" ? "x-vercel-forwarded-for" : env.TRUSTED_IP_HEADER || undefined };
}
