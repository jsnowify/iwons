// Retire the old provider/session endpoints. Specific first-party credential
// routes take precedence, and there is no alternate login path around limits.
const retired = () => Response.json({ error: "Not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
export const GET = retired;
export const POST = retired;
