/** The person behind Iwons, as one schema.org entity reused by every page's structured data. */
export const creatorUrl = "https://snowi-cambronero.vercel.app/";
export const creator = {
  "@type": "Person",
  "@id": `${creatorUrl}#person`,
  name: "Joshua Cambronero",
  alternateName: ["Snowi Cambronero", "Snowi", "jsnowify"],
  jobTitle: "Web designer and developer",
  url: creatorUrl,
  sameAs: [creatorUrl, "https://github.com/jsnowify"],
} as const;
