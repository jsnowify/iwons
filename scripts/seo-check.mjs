import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const OUT_DIR = path.resolve("out");
if (!fs.existsSync(OUT_DIR)) {
  console.error("Error: out/ directory does not exist. Run 'npm run build' first.");
  process.exit(1);
}

const PRODUCTION_DOMAIN = "https://iwons.vercel.app";
let failures = 0;

function report(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failures++;
  }
}

console.log("🔍 Running SEO, Crawlability, and Indexability Checks...");

// 1. Robots.txt checks
const robotsPath = path.join(OUT_DIR, "robots.txt");
report(fs.existsSync(robotsPath), "out/robots.txt must exist");
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, "utf8");
  report(robots.includes("Allow: /"), "robots.txt must allow root /");
  report(!/^Disallow:\s*\/$/m.test(robots), "robots.txt must NEVER Disallow: /");
  report(robots.includes(`Sitemap: ${PRODUCTION_DOMAIN}/sitemap.xml`), "robots.txt must link production sitemap.xml");
  report(!robots.includes("/problems/"), "robots.txt must not disallow /problems/");
  report(!robots.includes("/path/"), "robots.txt must not disallow /path/");
  report(!robots.includes("/visualizer/"), "robots.txt must not disallow /visualizer/");
}

// 2. Sitemap.xml checks
const sitemapPath = path.join(OUT_DIR, "sitemap.xml");
report(fs.existsSync(sitemapPath), "out/sitemap.xml must exist");
let sitemapUrls = [];
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  report(!sitemap.includes("VERCEL_URL"), "sitemap.xml must not contain VERCEL_URL");
  report(!/[a-z0-9-]+\.vercel\.app/i.test(sitemap.replace(/https:\/\/iwons\.vercel\.app/g, "")), "sitemap.xml must not contain preview vercel.app domains");
  
  const matches = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)];
  sitemapUrls = matches.map(m => m[1]);
  report(sitemapUrls.length >= 600, `sitemap.xml must contain all indexable URLs (found ${sitemapUrls.length})`);

  for (const url of sitemapUrls) {
    report(url.startsWith(PRODUCTION_DOMAIN), `Sitemap URL must start with production domain: ${url}`);
    report(url.endsWith("/") || url.endsWith(".xml") || url.endsWith(".html"), `Sitemap URL must have trailing slash: ${url}`);
  }

  // Ensure retired problems are NOT in sitemap
  const legacyProblems = JSON.parse(fs.readFileSync("src/data/legacy-problems.json", "utf8"));
  for (const lp of legacyProblems) {
    report(!sitemap.includes(`/problems/${lp.slug}/`), `Retired problem must NOT be in sitemap: ${lp.slug}`);
  }
}

// 3. llms.txt check
const llmsPath = path.join(OUT_DIR, "llms.txt");
report(fs.existsSync(llmsPath), "out/llms.txt must exist");
if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, "utf8");
  report(llms.includes(PRODUCTION_DOMAIN), "llms.txt must reference production domain");
  report(llms.includes("Snowi"), "llms.txt must credit creator Snowi");
}

// 4. HTML Head & Content Audit
const retiredSlugs = new Set(JSON.parse(fs.readFileSync("src/data/legacy-problems.json", "utf8")).map(p => p.slug));

function walkHtml(dir, fileList = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walkHtml(full, fileList);
    } else if (item.name.endsWith(".html")) {
      fileList.push(full);
    }
  }
  return fileList;
}

const htmlFiles = walkHtml(OUT_DIR);
const titles = new Map();

for (const file of htmlFiles) {
  const rel = path.relative(OUT_DIR, file).replace(/\\/g, "/");

  // Skip Google Search Console static verification file
  if (/^google[a-z0-9]+\.html$/i.test(path.basename(file))) {
    continue;
  }

  const html = fs.readFileSync(file, "utf8");

  // Skip 404 page and _not-found
  if (rel === "404.html" || rel === "404/index.html" || rel.startsWith("_not-found")) {
    report(html.includes("noindex") || html.includes("UNDEFINED"), "404 page should have noindex or error state");
    continue;
  }

  // Check if retired legacy problem
  const problemSlugMatch = rel.match(/^problems\/([^/]+)\/index\.html$/);
  const isRetired = problemSlugMatch && retiredSlugs.has(problemSlugMatch[1]);

  if (isRetired) {
    report(html.includes("noindex"), `Retired legacy problem must have noindex: ${rel}`);
    continue;
  }

  // Public indexable page checks
  report(!html.includes('content="noindex') && !html.includes('content="none'), `Public page must not contain noindex: ${rel}`);
  report(!html.includes('content="nofollow'), `Public page must not contain nofollow: ${rel}`);

  // Canonical tag check
  const canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) ||
                         html.match(/<link[^>]+href="([^"]+)"[^>]+rel="canonical"/i);
  report(!!canonicalMatch, `Missing canonical tag in ${rel}`);
  if (canonicalMatch) {
    const canonical = canonicalMatch[1];
    report(canonical.startsWith(PRODUCTION_DOMAIN), `Canonical must use production domain: ${canonical} in ${rel}`);
    report(canonical.endsWith("/"), `Canonical must end with trailing slash: ${canonical} in ${rel}`);
    report(!canonical.includes("VERCEL_URL"), `Canonical must not include VERCEL_URL: ${canonical} in ${rel}`);
  }

  // Title tag check
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  report(!!titleMatch && titleMatch[1].trim().length > 0, `Missing or empty <title> in ${rel}`);
  if (titleMatch) {
    const title = titleMatch[1].trim();
    report(!title.includes("| Iwons | Iwons"), `Duplicate branding in title: "${title}" in ${rel}`);
    if (rel.endsWith("index.html") && !rel.startsWith("dev/")) {
      titles.set(rel, title);
    }
  }

  // H1 tag check
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  report(h1Count === 1, `Expected exactly 1 <h1> in ${rel}, found ${h1Count}`);

  // Meta description check
  const descMatch = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ||
                    html.match(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i);
  report(!!descMatch && descMatch[1].trim().length > 10, `Missing or too short meta description in ${rel}`);

  // Preview domain leak check in OG tags
  report(!/[a-z0-9-]+\.vercel\.app/i.test(html.replace(/https:\/\/iwons\.vercel\.app/g, "").replace(/https:\/\/snowi-cambronero\.vercel\.app/g, "")), `Preview vercel.app domain leaked in HTML of ${rel}`);

  // JSON-LD scripts check
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const jm of jsonLdMatches) {
    try {
      JSON.parse(jm[1]);
    } catch (e) {
      report(false, `Invalid JSON-LD syntax in ${rel}: ${e.message}`);
    }
  }
}

// 5. Google verification in homepage
const homeHtml = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf8");
report(
  homeHtml.includes('name="google-site-verification"') && homeHtml.includes("iB53T08hbGrfdsAmrKTVhocsuFV5rgOwT5imiFu2Iu8"),
  "Homepage must contain Google Search Console verification meta tag"
);

if (failures === 0) {
  console.log(`✅ All SEO checks passed! Inspected ${htmlFiles.length} HTML files and ${sitemapUrls.length} sitemap URLs.`);
  process.exit(0);
} else {
  console.error(`💥 Found ${failures} SEO check failure(s).`);
  process.exit(1);
}
