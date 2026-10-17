# Search Console, Bing & Crawler Monitoring Guide

**Project:** Iwons (`https://iwons.vercel.app/`)  
**Target Audience:** Site Owner / Maintainer  
**Status:** Codebase optimization complete. The following manual steps must be performed in external search console dashboards and hosting settings.

---

> [!IMPORTANT]
> **Indexing takes time.** Search engines (Googlebot, Bingbot) and AI indexing systems (GPTBot, ClaudeBot, PerplexityBot) discover and crawl pages over days or weeks. No optimization guarantees immediate indexing, high rankings, or automatic inclusion in AI citations.

---

## 1. Google Search Console Verification & Sitemap Submission

1. **Confirm Ownership Verification:**
   - Go to [Google Search Console](https://search.google.com/search-console).
   - The ownership meta tag is already active on the homepage:
     ```html
     <meta name="google-site-verification" content="iB53T08hbGrfdsAmrKTVhocsuFV5rgOwT5imiFu2Iu8" />
     ```
   - If not already verified, select **HTML tag** under "Other verification methods" and click **Verify**.

2. **Submit the Sitemap:**
   - In the left sidebar under *Indexing*, click **Sitemaps**.
   - In the "Add a new sitemap" input field, type:
     ```text
     sitemap.xml
     ```
   - Click **Submit**.
   - Verify that the status shows **Success** and that discovered URLs match ~650 pages.

3. **Request Indexing for Key Entry Points:**
   - Use the **URL Inspection** bar at the top for these key landing pages:
     - `https://iwons.vercel.app/`
     - `https://iwons.vercel.app/path/`
     - `https://iwons.vercel.app/problems/`
     - `https://iwons.vercel.app/visualizer/`
     - `https://iwons.vercel.app/about/`
   - Click **Test Live URL**.
   - Once verified green, click **Request Indexing**.

4. **Monitor the "Pages" Report (Weekly):**
   - Under *Indexing* → *Pages*, inspect reasons for non-indexed URLs:
     - **"Excluded by ‘noindex’ tag"**: Should only list retired legacy exercises (44 URLs) and 404 pages.
     - **"Blocked by robots.txt"**: Should only list `/problem-data/` and `/dev/`.
     - **"Crawled - currently not indexed"**: Normal during early discovery; re-inspect or allow time.

5. **Core Web Vitals:**
   - Under *Experience* → *Core Web Vitals*, monitor real-user field data (CrUX) as search traffic builds.

---

## 2. Bing Webmaster Tools Setup

1. **Import or Add Site:**
   - Visit [Bing Webmaster Tools](https://www.bing.com/webmasters).
   - Click **Add a site** → Choose **Import from Google Search Console** (fastest), or add `https://iwons.vercel.app/` manually.

2. **Verification Meta Tag (If adding manually):**
   - If Bing provides an `msvalidate.01` authentication code, add it as an environment variable in Vercel:
     ```bash
     NEXT_PUBLIC_BING_SITE_VERIFICATION="your_msvalidate_code_here"
     ```
   - Trigger a redeploy. The root layout automatically injects:
     `<meta name="msvalidate.01" content="..." />`.

3. **Submit Sitemap in Bing:**
   - Go to *Sitemaps* → Click **Submit sitemap**.
   - Enter `https://iwons.vercel.app/sitemap.xml`.

4. **URL Submission / IndexNow:**
   - Submit the top 10 URLs directly in Bing Webmaster Tools for expedited crawl priority.

---

## 3. Vercel Dashboard Settings (Critical Check)

Search engine bots cannot reach your site if Vercel deployment protection or firewall rules block them. Perform this one-time check:

1. **Deployment Protection:**
   - In Vercel Project Dashboard → *Settings* → *Deployment Protection*.
   - Confirm **Vercel Authentication** is **Disabled** for the Production branch (`main`).
   - (Preview deployments should stay protected/noindexed to avoid duplicate content penalties).

2. **Firewall & Security:**
   - In *Settings* → *Security*.
   - Confirm **Attack Challenge Mode** is **Off** during normal operations.
   - Confirm no custom firewall rules challenge legitimate user-agents: `Googlebot`, `bingbot`, `GPTBot`, `ClaudeBot`, `PerplexityBot`.

---

## 4. Structured Data Live Validation

Test key pages using the official tools:
1. [Google Rich Results Test](https://search.google.com/test/rich-results):
   - `https://iwons.vercel.app/` → Validates `WebSite` & `CollectionPage`
   - `https://iwons.vercel.app/about/` → Validates `AboutPage`, `Person` (Snowi), and `FAQPage`
   - `https://iwons.vercel.app/problems/receipt-arithmetic-proof-strip/` → Validates `LearningResource` & `BreadcrumbList`
   - `https://iwons.vercel.app/visualizer/` → Validates `ItemList` & `BreadcrumbList`
   - `https://iwons.vercel.app/visualizer/bubble-sort/` → Validates `LearningResource` & `BreadcrumbList`
2. [Schema.org Validator](https://validator.schema.org/):
   - Confirm zero fatal errors or syntax violations.

---

## 5. Ongoing Monitoring Schedule

- **Day 1–3:** Monitor Search Console *Coverage / Pages* report for initial sitemap fetch.
- **Week 1:** Check if the homepage and top 10 pages appear in Google (`site:iwons.vercel.app`).
- **Week 2–4:** Review query performance under *Search Results* (impressions, clicks, average position).

