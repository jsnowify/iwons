import { test, expect } from "@playwright/test";

test("static production metadata and cached OG assets", async ({ request }) => {
  for (const route of ["/", "/problems/receipt-arithmetic-proof-strip/"]) {
    const response = await request.get(route);
    const html = await response.text();
    expect(html).not.toContain("iwons-gxqlfrii4");
    const image = html.match(/property="og:image" content="([^"]+)"/)?.[1];
    expect(image).toMatch(
      /^https:\/\/iwons\.vercel\.app\/og\/.+\.[a-f0-9]{16}\.png$/
    );
    expect(html.match(/name="twitter:image" content="([^"]+)"/)?.[1]).toBe(image);
    expect(html).toContain(
      `rel="canonical" href="https://iwons.vercel.app${route}"`
    );
    if (route === "/") expect(image).toContain("/og/home.");
    const png = await request.get(new URL(image!).pathname);
    expect(png.status()).toBe(200);
    expect(png.headers()["cache-control"]).toContain("immutable");
    expect((await png.body()).subarray(1, 4).toString()).toBe("PNG");
  }
  const old = await request.get("/og/receipt-arithmetic-proof-strip/", {
    maxRedirects: 0,
  });
  expect(old.status()).toBe(308);
  expect(old.headers().location).toBe(
    "/og/receipt-arithmetic-proof-strip.png"
  );
});

test("all indexable page types have canonical, meta description, single h1, and no noindex", async ({
  request,
}) => {
  const sampleRoutes = [
    "/",
    "/path/",
    "/path/0/",
    "/problems/",
    "/problems/receipt-arithmetic-proof-strip/",
    "/visualizer/",
    "/visualizer/bubble-sort/",
    "/about/",
    "/plans/",
    "/dashboard/",
    "/progress/",
    "/warm-up/",
    "/contest/",
    "/settings/",
  ];

  for (const route of sampleRoutes) {
    const res = await request.get(route);
    expect(res.status(), `Route ${route} should return 200`).toBe(200);
    const html = await res.text();

    // Must not have noindex or nofollow
    expect(html, `Route ${route} must not carry noindex`).not.toContain(
      'content="noindex'
    );
    expect(html, `Route ${route} must not carry nofollow`).not.toContain(
      'content="nofollow'
    );

    // Canonical tag
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical, `Route ${route} missing canonical`).toBe(
      `https://iwons.vercel.app${route}`
    );

    // Single h1
    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
    expect(h1Count, `Route ${route} should have exactly one <h1>`).toBe(1);

    // Title and description
    expect(html).toContain("<title>");
    expect(html).toContain('name="description"');
  }

  // Google Search Console verification meta tag on homepage
  const home = await (await request.get("/")).text();
  expect(home).toContain('name="google-site-verification"');
  expect(home).toContain("iB53T08hbGrfdsAmrKTVhocsuFV5rgOwT5imiFu2Iu8");

  // Robots, sitemap, and llms.txt endpoints
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Allow: /");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("https://iwons.vercel.app/visualizer/bubble-sort/");

  const llms = await request.get("/llms.txt");
  expect(llms.status()).toBe(200);
  expect(await llms.text()).toContain("Snowi");
});

