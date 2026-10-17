import { ogImage } from "@/lib/og";
import { siteUrl } from "@/lib/site-url";
import type { Metadata, Viewport } from "next";
import {
  Geist,
  Fraunces,
  Courier_Prime,
  Special_Elite,
  JetBrains_Mono,
} from "next/font/google";
import { palette } from "@/lib/design-tokens";
import { Footer } from "@/components/footer";
import { Shell } from "@/components/shell";
import "./globals.css";
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  preload: false,
});
const space = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
});
const courier = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier",
  display: "swap",
});
const elite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-elite",
  display: "swap",
  preload: false,
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Iwons — Type it. Test it. Own it.",
    template: "%s | Iwons",
  },
  description:
    "An original coding adventure, one keystroke at a time. Start the Iwons Path with 500 original challenges in JavaScript, TypeScript, Python, and Java.",
  verification: { google: "iB53T08hbGrfdsAmrKTVhocsuFV5rgOwT5imiFu2Iu8" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Iwons — Type it. Test it. Own it.",
    description: "Build the habit. Learn the patterns. Own every solve.",
    type: "website",
    images: [ogImage("home")],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg", apple: "/icons/192/" },
};
export const viewport: Viewport = {
  themeColor: palette.bg,
  width: "device-width",
  initialScale: 1,
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <style
          id="picker-scrollbar-rules"
          dangerouslySetInnerHTML={{
            __html: `
::picker(select)::-webkit-scrollbar { width: 12px; height: 12px; }
::picker(select)::-webkit-scrollbar-track, ::picker(select)::-webkit-scrollbar-corner { background: var(--surface); }
::picker(select)::-webkit-scrollbar-thumb { background: var(--ink); border: 2px solid var(--surface); border-radius: 4px; }
::picker(select)::-webkit-scrollbar-thumb:hover { background: var(--accent-text); }
::picker(select)::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
`,
          }}
        />
      </head>
      <body
        className={`${geist.variable} ${space.variable} ${courier.variable} ${elite.variable} ${jetbrains.variable}`}
      >
        <Shell footer={<Footer />}>{children}</Shell>
      </body>
    </html>
  );
}
