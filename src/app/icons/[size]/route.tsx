import { ImageResponse } from "next/og";
import { palette } from "@/lib/design-tokens";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  const n = Number(size);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: palette.accent,
        color: palette.ink,
        alignItems: "center",
        justifyContent: "center",
        fontSize: n * 0.8,
        fontWeight: 700,
        borderRadius: n * 0.08,
        border: `${n * 0.035}px solid ${palette.ink}`,
      }}
    >
      I
    </div>,
    { width: n, height: n },
  );
}
