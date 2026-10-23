import "server-only";
import { createHmac } from "node:crypto";
import { JudgeError } from "../judge0/errors";
import { normalizeClientAddress } from "../client-address";
import type { AuthConfig } from "./auth-config";

export function accountIpHash(request: Request, config: AuthConfig) {
  const address = config.trustedIpHeader ? normalizeClientAddress(request.headers.get(config.trustedIpHeader)) : undefined;
  if (config.trustedIpHeader && !address || !config.trustedIpHeader && config.production)
    throw new JudgeError(503, "Account services are temporarily unavailable.");
  return createHmac("sha256", config.secret).update(address ?? "local-development").digest("hex");
}
export function requireAccountOrigin(request: Request, config: AuthConfig) {
  const origin = request.headers.get("origin") ?? "";
  if (config.allowedOrigins.includes(origin)) return;
  // A form on this site always sends an Origin equal to the address the page was opened from, which is also the Host it
  // called. Accepting that keeps sign-in working on another port, 127.0.0.1, www or a preview URL. A page on another
  // site can never match, and plain HTTP is accepted outside production only.
  const host = request.headers.get("host") ?? new URL(request.url).host;
  try {
    const parsed = new URL(origin);
    if (parsed.origin === origin && parsed.host === host && (parsed.protocol === "https:" || (parsed.protocol === "http:" && !config.production))) return;
  } catch { /* fall through to the refusal below */ }
  throw new JudgeError(403, "We couldn’t confirm this sign-in came from the Iwons site. Reload the page and try again. If it keeps happening, open Iwons from its main address.");
}
