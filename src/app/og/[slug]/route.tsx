import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getProblems } from "@/lib/problems";
import { palette as c } from "@/lib/design-tokens";
const font = readFileSync(join(process.cwd(), "assets/fonts/CourierPrime-Bold.ttf"));
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return getProblems().map((p) => ({ slug: p.slug }));
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const p = getProblems().find((p) => p.slug === slug);
  if (!p) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: c.bg,
          color: c.ink,
          padding: 38,
          fontFamily: "Courier",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            border: `3px solid ${c.ink}`,
            boxShadow: `8px 8px 0 ${c.ink}`,
            background: c.surface,
            padding: 42,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", fontSize: 40 }}>
              Iwons<span style={{ display: "flex", marginLeft: 8, width: 10, height: 36, background: c.accent }} />
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                border: `2px solid ${c.ink}`,
                padding: "10px 18px",
                transform: "rotate(-3deg)",
                background: c["accent-2"],
              }}
            >
              LEVEL 0{p.level} / {p.difficulty.toUpperCase()}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: c.muted,
              letterSpacing: 3,
              marginTop: 68,
            }}
          >
            TYPE IT. TEST IT. OWN IT.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: p.title.length > 42 ? 48 : 64,
              lineHeight: 1.15,
              marginTop: 18,
            }}
          >
            {p.title}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "auto",
              paddingTop: 26,
              borderTop: `2px dashed ${c.ink}`,
              fontSize: 22,
            }}
          >
            <span>{p.topics.join(" / ")}</span>
            <span>YOUR NEXT CHAPTER →</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Courier", data: font, weight: 700, style: "normal" }],
    },
  );
}
