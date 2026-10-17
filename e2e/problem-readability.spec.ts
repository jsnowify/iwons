import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const manifest: {slug:string;level:number;unit:string}[]=JSON.parse(readFileSync('src/data/curriculum.json','utf8'));
test.use({serviceWorkers:'block'});
test('each chapter explains the task, labels example arguments and separates efficiency notes',async({page})=>{
 for(let level=0;level<9;level++){
  const entry=manifest.find(item=>item.level===level)!;
  await page.goto(`/problems/${entry.slug}/`);const description=page.locator('.description-content');
  for(const name of ['Your task','Inputs','Step 1: Build the result list','Step 2: Return the answer','Write your function','Input limits'])await expect(description.getByRole('heading',{name,exact:true})).toBeVisible();
  await expect(description.locator('.example').first().locator('pre')).toContainText('k = ');await expect(description.locator('.example').first()).toContainText('Step 1 gives the result list');
  const efficiency=description.locator('.efficiency-goal');await expect(efficiency).not.toHaveAttribute('open');await efficiency.locator('summary').click();await expect(efficiency).toHaveAttribute('open','');await expect(efficiency).toContainText('Big-O describes');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
