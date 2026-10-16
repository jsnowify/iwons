import fs from "node:fs";
const slugs = { cp1: "computer-programming-1", cp2: "computer-programming-2", dsa: "data-structures-and-algorithms" };
const rules = Object.entries(slugs).map(([id, slug]) => ({
  source: `/learn/:track/${id}/:rest*`, destination: `/learn/:track/${slug}/:rest*`, permanent: true,
}));
fs.writeFileSync("out/learn-redirects.json", JSON.stringify(rules, null, 2) + "\n");
fs.writeFileSync("out/_redirects", Object.entries(slugs).flatMap(([id, slug]) => ["java", "javascript", "typescript", "python"].flatMap(track => [
  `/learn/${track}/${id} /learn/${track}/${slug}/ 301`,
  `/learn/${track}/${id}/ /learn/${track}/${slug}/ 301`,
  `/learn/${track}/${id}/* /learn/${track}/${slug}/:splat 301`,
])).join("\n") + "\n");
console.log("Learn legacy redirect map prepared for static hosts.");
