import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
test('retired course links redirect while Path tools remain available',async({page,request})=>{
 for(const [url,target] of [['/learn/','/'],['/tl/learn/java/','/'],['/ceb/path/0/','/path/0/']]){
  const response=await request.get(url,{maxRedirects:0});expect(response.status()).toBe(308);expect(response.headers().location).toBe(target);
 }
 await page.goto('/visualizer/');await expect(page.getByRole('heading',{name:'Algorithm Visualizer'})).toBeVisible();
 await expect(page.locator('a[href^="/learn"]')).toHaveCount(0);
 await page.goto('/visualizer/binary-search/');
 const stage=page.getByRole('region',{name:'Algorithm animation stage'});await expect(stage).toBeVisible();await expect(page.locator('.caption-badge')).toContainText('Step 1 of');await page.getByRole('button',{name:'Step forward',exact:true}).click();await expect(page.locator('.caption-badge')).toContainText('Step 2 of');
 await page.goto('/warm-up/');await expect(page.getByRole('heading',{name:'Daily Warm-up 3'})).toBeVisible();
 await page.getByRole('button',{name:/Find today/}).click();await expect(page.getByRole('heading',{name:'A fresh page for now.'})).toBeVisible();
 await page.goto('/settings/');await expect(page.getByText('Lesson language',{exact:true})).toHaveCount(0);
});
