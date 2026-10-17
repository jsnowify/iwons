export const metadata = {alternates:{canonical:"/"}};
import { siteUrl } from "@/lib/site-url";
import { Landing } from "@/components/landing";
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Iwons",
              url: `${siteUrl}/`,
              inLanguage: "en",
              description:
                "An original coding adventure, one keystroke at a time. Practice 500 challenges in JavaScript, TypeScript, Python, and Java.",
              publisher: {
                "@type": "Person",
                name: "Snowi",
                url: "https://snowi-cambronero.vercel.app/",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "The Iwons Path",
              description:
                "A 9-chapter coding adventure covering 500 challenges and 54 units from programming foundations to dynamic programming and graphs.",
              url: `${siteUrl}/`,
              hasPart: [
                {
                  "@type": "ItemList",
                  name: "Iwons Path Chapters",
                  numberOfItems: 9,
                  itemListElement: [
                    { "@type": "ListItem", position: 1, name: "Chapter 1: Hello, Keys", url: `${siteUrl}/path/0/` },
                    { "@type": "ListItem", position: 2, name: "Chapter 2: Typebars", url: `${siteUrl}/path/1/` },
                    { "@type": "ListItem", position: 3, name: "Chapter 3: Roller & Platen", url: `${siteUrl}/path/2/` },
                    { "@type": "ListItem", position: 4, name: "Chapter 4: Ribbon & Spool", url: `${siteUrl}/path/3/` },
                    { "@type": "ListItem", position: 5, name: "Chapter 5: Line Space Lever", url: `${siteUrl}/path/4/` },
                    { "@type": "ListItem", position: 6, name: "Chapter 6: Carriage Return", url: `${siteUrl}/path/5/` },
                    { "@type": "ListItem", position: 7, name: "Chapter 7: Shift Lock", url: `${siteUrl}/path/6/` },
                    { "@type": "ListItem", position: 8, name: "Chapter 8: Bell & Margin", url: `${siteUrl}/path/7/` },
                    { "@type": "ListItem", position: 9, name: "Chapter 9: Escapement", url: `${siteUrl}/path/8/` },
                  ],
                },
              ],
            },
          ]),
        }}
      />
      <Landing />
    </>
  );
}
