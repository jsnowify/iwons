import { problems } from "@/lib/catalog";
import { withSocial } from "@/lib/social-meta";
import type { Metadata } from "next";
import { PlansPage } from "@/components/plans";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = withSocial({
  title: "Study plans",
  description:
    "Curated coding practice schedules and structured study plans for mastering data structures and algorithms.",
  alternates: { canonical: "/plans/" },
});
export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
                name: "Study plans",
                item: `${siteUrl}/plans/`,
              },
            ],
          }),
        }}
      />
      <PlansPage problems={problems.map(({id,slug,title,difficulty,level,topics,patterns})=>({id,slug,title,difficulty,level,topics,patterns}))} />
    </>
  );
}
