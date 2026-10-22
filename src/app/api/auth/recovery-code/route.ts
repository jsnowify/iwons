import { recoveryEndpoint } from "@/lib/accounts/recovery-http";
export const runtime = "nodejs";
export const GET = (request: Request) => recoveryEndpoint("code", request);
export const POST = (request: Request) => recoveryEndpoint("code", request);
