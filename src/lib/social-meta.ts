import type { Metadata } from "next";
import { ogImage } from "./og";
import { siteUrl } from "./site-url";

type Page = Metadata & { title: string; description: string; alternates: { canonical: string } };

/**
 * Adds Open Graph and Twitter cards that match the page's own title and description,
 * so a pasted link previews the page it points to instead of the home page.
 */
export function withSocial(page: Page): Metadata {
  const canonical = page.alternates.canonical;
  const url = canonical.startsWith("http") ? canonical : `${siteUrl}${canonical}`;
  const title = `${page.title} | Iwons`;
  const image = `${siteUrl}${ogImage("home")}`;
  return {
    ...page,
    openGraph: { title, description: page.description, url, siteName: "Iwons", locale: "en_US", type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: "Iwons coding practice adventure", type: "image/png" }] },
    twitter: { card: "summary_large_image", title, description: page.description, images: [image] },
  };
}
