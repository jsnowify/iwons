import type { MetadataRoute } from "next";
import { palette } from "@/lib/design-tokens";
export const dynamic = "force-static";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Iwons — Type it. Test it. Own it.",
    short_name: "Iwons",
    description: "Your focused, local-first coding practice space.",
    start_url: "/",
    display: "standalone",
    background_color: palette.bg,
    theme_color: palette.bg,
    icons: [
      { src: "/icons/192/", sizes: "192x192", type: "image/png" },
      {
        src: "/icons/512/",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
