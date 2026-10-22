import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { JudgeError } from "../judge0/errors";
import type { AuthConfig } from "./auth-config";

export function accountIpHash(request: Request, config: AuthConfig) {
  const address = config.trustedIpHeader ? request.headers.get(config.trustedIpHeader)?.split(",")[0]?.trim() : undefined;
  if (config.trustedIpHeader && (!address || !isIP(address)) || !config.trustedIpHeader && config.production)
    throw new JudgeError(503, "Account services are temporarily unavailable.");
  return createHmac("sha256", config.secret).update(address ?? "local-development").digest("hex");
}
export function requireAccountOrigin(request: Request, config: AuthConfig) {
  if (!config.allowedOrigins.includes(request.headers.get("origin") ?? ""))
    throw new JudgeError(403, "Please use the account form on this website.");
}
