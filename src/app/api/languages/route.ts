import { languages } from "@/lib/judge0/languages";
export function GET() {
  return Response.json(Object.entries(languages).map(([key, value]) => ({ key, displayName: value.displayName })),
    { headers: { "Cache-Control": "public, max-age=300" } });
}
