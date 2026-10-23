import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { requireAccountOrigin } from "@/lib/accounts/request-security";
import { authConfig, type AuthConfig } from "@/lib/accounts/auth-config";

const config = (production: boolean): AuthConfig => ({ secret: randomBytes(32), origin: production ? "https://iwons.test" : "http://localhost:3001",
  allowedOrigins: [production ? "https://iwons.test" : "http://localhost:3001"], production });
const post = (origin: string | null, host: string) => new Request(`http://internal.invalid/api/auth/login/`, { method: "POST",
  headers: { host, ...(origin === null ? {} : { origin }) } });
const refused = (action: () => void) => { try { action(); return null; } catch (error) { return (error as { status: number }).status; } };

describe("account form origin check", () => {
  it("accepts the configured site and any address the page was really opened from", () => {
    expect(refused(() => requireAccountOrigin(post("https://iwons.test", "iwons.test"), config(true)))).toBeNull();
    // Another host for the same deployment, such as www or a preview address, works because Origin equals Host.
    expect(refused(() => requireAccountOrigin(post("https://www.iwons.test", "www.iwons.test"), config(true)))).toBeNull();
    expect(refused(() => requireAccountOrigin(post("http://localhost:3002", "localhost:3002"), config(false)))).toBeNull();
    expect(refused(() => requireAccountOrigin(post("http://127.0.0.1:3001", "127.0.0.1:3001"), config(false)))).toBeNull();
  });
  it("still refuses other sites, missing or malformed origins, and plain HTTP in production", () => {
    expect(refused(() => requireAccountOrigin(post("https://evil.test", "iwons.test"), config(true)))).toBe(403);
    expect(refused(() => requireAccountOrigin(post("http://localhost:3002", "localhost:3001"), config(false)))).toBe(403);
    expect(refused(() => requireAccountOrigin(post(null, "iwons.test"), config(true)))).toBe(403);
    expect(refused(() => requireAccountOrigin(post("null", "iwons.test"), config(true)))).toBe(403);
    expect(refused(() => requireAccountOrigin(post("https://iwons.test.evil.test", "iwons.test"), config(true)))).toBe(403);
    expect(refused(() => requireAccountOrigin(post("http://www.iwons.test", "www.iwons.test"), config(true)))).toBe(403);
    expect(refused(() => requireAccountOrigin(post("https://iwons.test/path", "iwons.test"), config(true)))).toBe(403);
  });
  it("explains the refusal in plain words without revealing configuration", () => {
    try { requireAccountOrigin(post("https://evil.test", "iwons.test"), config(true)); } catch (error) {
      expect((error as Error).message).toMatch(/Reload the page and try again/);
      expect((error as Error).message).not.toMatch(/AUTH_URL|localhost|iwons\.test/);
    }
  });
});

describe("production site address", () => {
  const secret = randomBytes(32).toString("base64");
  it("refuses to start in production without a site address instead of falling back to localhost", () => {
    expect(() => authConfig({ AUTH_SECRET: secret, NODE_ENV: "production" })).toThrow(/Set AUTH_URL/);
    expect(authConfig({ AUTH_SECRET: secret, NODE_ENV: "production", AUTH_URL: "https://iwons.example" }).allowedOrigins).toEqual(["https://iwons.example"]);
    expect(authConfig({ AUTH_SECRET: secret, NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://iwons.example" }).origin).toBe("https://iwons.example");
  });
  it("uses Vercel's production domain when AUTH_URL is not set, and still allows the preview address", () => {
    const config = authConfig({ AUTH_SECRET: secret, NODE_ENV: "production", VERCEL: "1", VERCEL_PROJECT_PRODUCTION_URL: "iwons.example", VERCEL_URL: "iwons-abc.vercel.app" });
    expect(config.origin).toBe("https://iwons.example");
    expect(config.allowedOrigins).toEqual(["https://iwons.example", "https://iwons-abc.vercel.app"]);
    expect(config.trustedIpHeader).toBe("x-vercel-forwarded-for");
  });
  it("keeps localhost as the development default and rejects insecure or malformed production addresses", () => {
    expect(authConfig({ AUTH_SECRET: secret, NODE_ENV: "development" }).origin).toBe("http://localhost:3001");
    expect(() => authConfig({ AUTH_SECRET: secret, NODE_ENV: "production", AUTH_URL: "http://iwons.example" })).toThrow(/HTTPS/);
    expect(() => authConfig({ AUTH_SECRET: secret, NODE_ENV: "production", AUTH_URL: "https://iwons.example/path" })).toThrow(/HTTPS/);
  });
});
