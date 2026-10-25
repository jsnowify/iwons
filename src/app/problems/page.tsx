import { problems } from "@/lib/catalog";
import { withSocial } from "@/lib/social-meta";
import type { Metadata } from "next";
import { ProblemList } from "@/components/problem-list";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = withSocial({
  title: "Coding problems",
  description:
    "Explore 500 original JavaScript, TypeScript, Python, and Java coding challenges. Practice foundations, arrays, strings, trees, graphs and dynamic programming on the Iwons Path.",
  alternates: { canonical: "/problems/" },
});
export default function Problems() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Coding Problems",
              description:
                "Explore 500 original JavaScript, TypeScript, Python, and Java coding challenges.",
              url: `${siteUrl}/problems/`,
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
                  name: "Problems",
                  item: `${siteUrl}/problems/`,
                },
              ],
            },
          ]),
        }}
      />
      <ProblemList problems={problems.map(({id,slug,title,difficulty,level,topics,patterns,unit,stage,boss,revisit,summary,order})=>({id,slug,title,difficulty,level,topics,patterns,unit,stage,boss,revisit,summary,order}))} />
    </>
  );
}
