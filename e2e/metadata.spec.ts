import {test,expect} from '@playwright/test';
test('static production metadata and cached OG assets',async({request})=>{
 for(const route of ['/','/problems/receipt-arithmetic-proof-strip/']){
  const response=await request.get(route);const html=await response.text();expect(html).not.toContain('iwons-gxqlfrii4');
  const image=html.match(/property="og:image" content="([^"]+)"/)?.[1];expect(image).toMatch(/^https:\/\/iwons\.vercel\.app\/og\/.+\.[a-f0-9]{16}\.png$/);
  expect(html.match(/name="twitter:image" content="([^"]+)"/)?.[1]).toBe(image);
  expect(html).toContain(`rel="canonical" href="https://iwons.vercel.app${route}"`);
  if(route==='/')expect(image).toContain('/og/home.');
  const png=await request.get(new URL(image!).pathname);expect(png.status()).toBe(200);expect(png.headers()['cache-control']).toContain('immutable');expect((await png.body()).subarray(1,4).toString()).toBe('PNG');
 }
 const old=await request.get('/og/receipt-arithmetic-proof-strip/',{maxRedirects:0});expect(old.status()).toBe(308);expect(old.headers().location).toBe('/og/receipt-arithmetic-proof-strip.png');
});
