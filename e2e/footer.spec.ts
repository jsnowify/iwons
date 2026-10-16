import {test,expect} from '@playwright/test';
const routes=['/','/path/','/path/0/','/path/0/#receipt-arithmetic','/problems/receipt-arithmetic-proof-strip/','/progress/','/settings/','/about/'];
test.use({serviceWorkers:'block'});
for(const width of [360,390,768,1024,1440])for(const theme of ['light','dark'])test(`shared footer and clean page bottom ${width}px ${theme}`,async({page})=>{
 await page.setViewportSize({width,height:900});const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 for(const route of routes){
  await page.goto(route);await page.waitForFunction(()=>document.documentElement.dataset.motion);
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('button',{name:/Switch to .* theme/}).click();
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));});
  const footer=page.getByRole('contentinfo');await expect(footer).toHaveCount(1);await footer.scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await expect(footer).toBeInViewport({ratio:0.99});await expect(footer.getByRole('navigation',{name:'Footer',exact:true})).toBeVisible();
  const bounds=await page.evaluate(()=>{const f=document.querySelector('footer')!.getBoundingClientRect(),m=document.querySelector('main')!.getBoundingClientRect(),nav=document.querySelector('.mobile-nav')?.getBoundingClientRect();return{top:f.top,bottom:f.bottom,mainBottom:m.bottom,navTop:nav&&nav.height?nav.top:null,overflow:document.documentElement.scrollWidth>innerWidth,links:[...document.querySelectorAll('footer a')].map(a=>a.getBoundingClientRect().height)}});
  expect(bounds.top).toBeGreaterThanOrEqual(bounds.mainBottom-1);expect(bounds.top).toBeGreaterThanOrEqual(-1);expect(bounds.bottom).toBeLessThanOrEqual(901);expect(bounds.overflow).toBe(false);expect(bounds.links.every(height=>height>=44)).toBe(true);
  if(bounds.navTop!==null)expect(bounds.bottom).toBeLessThanOrEqual(bounds.navTop+1);
  await footer.getByRole('link',{name:'The Path',exact:true}).focus();await expect(footer.getByRole('link',{name:'The Path',exact:true})).toBeFocused();
  if(width===360&&theme==='light'&&['/','/about/','/problems/receipt-arithmetic-proof-strip/'].includes(route))await page.screenshot({path:`artifacts/bottom-layout/after-${route==='/'?'home':route.includes('problems')?'problem':'about'}.png`});
 }
 expect(errors).toEqual([]);
});
