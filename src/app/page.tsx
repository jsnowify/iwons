export const metadata = {alternates:{canonical:"/"}};
import { siteUrl } from "@/lib/site-url";
import { Landing } from "@/components/landing";
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Iwons",
            url: siteUrl,
            description:
              "Solve it. Own it. Original coding challenges and honest, local-first practice.",
          }),
        }}
      />
      <Landing />
    </>
  );
}
