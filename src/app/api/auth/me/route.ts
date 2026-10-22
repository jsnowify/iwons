import { credentialEndpoint } from "@/lib/accounts/credential-http";
export const runtime = "nodejs";
export async function GET(request: Request) { return credentialEndpoint("me", request); }
