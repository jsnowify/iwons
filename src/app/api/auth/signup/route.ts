import { credentialEndpoint } from "@/lib/accounts/credential-http";
export const runtime = "nodejs";
export async function POST(request: Request) { return credentialEndpoint("signup", request); }
