import { recoveryEndpoint } from "@/lib/accounts/recovery-http";
export const runtime = "nodejs";
export const POST = (request: Request) => recoveryEndpoint("reset", request);
