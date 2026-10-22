import type { Metadata } from "next";
import { getLevels } from "@/lib/problems";
import { PathMap } from "@/components/path-map";
import { siteUrl } from "@/lib/site-url";
import { FoundationDiscovery } from "@/components/foundation-discovery";

export const metadata: Metadata = {
  title: "The Iwons Path",
  description:
    "A nine-chapter coding adventure from your first loop to your first graph. Explore 500 original exercises in 54 units across nine chapters.",
  alternates: { canonical: "/path/" },
};
export default function Page() {
  const levels = getLevels();
  return (
    <div className="content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "The Iwons Path",
              description:
                "A nine-chapter coding adventure from your first loop to your first graph. Explore 500 original exercises in 54 units across nine chapters.",
              url: `${siteUrl}/path/`,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: `${siteUrl}/`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "The Path",
                  item: `${siteUrl}/path/`,
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Iwons Chapters",
              itemListElement: levels.map((l) => ({
                "@type": "ListItem",
                position: l.id + 1,
                name: `Chapter ${l.id + 1}: ${l.name}`,
                url: `${siteUrl}/path/${l.id}/`,
              })),
            },
          ]),
        }}
      />
      <FoundationDiscovery />
      <PathMap levels={levels.map(({id,name,subtitle,tier,count,released,concepts}) => ({id,name,subtitle,tier,count,released,concepts}))} />
    </div>
  );
}
