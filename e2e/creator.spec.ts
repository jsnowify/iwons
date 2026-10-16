import {test,expect} from '@playwright/test';
test('Snowi creator credit uses the portfolio only',async({page})=>{
 await page.goto('/about/');const creator=page.getByRole('region',{name:'Made by Snowi'});await expect(creator).toContainText('creative web designer and developer');await expect(creator.getByRole('link',{name:'Snowi',exact:true})).toHaveAttribute('href','https://snowi-cambronero.vercel.app/');
 await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
});
