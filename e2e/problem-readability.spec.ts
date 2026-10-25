import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const manifest: {slug:string;level:number;unit:string}[]=JSON.parse(readFileSync('src/data/curriculum.json','utf8'));
test.use({serviceWorkers:'block'});
test('each chapter explains the task, labels example arguments and separates efficiency notes',async({page})=>{
 for(let level=0;level<9;level++){
  const entry=manifest.find(item=>item.level===level)!;
  await page.goto(`/problems/${entry.slug}/`);const description=page.locator('.description-content');
  for(const name of ['Inputs','Your tasks','Example','Test data','Input limits'])await expect(description.getByRole('heading',{name,exact:true})).toBeVisible();
  await expect(description.locator('.task-list li').first()).toContainText('Create a list');await expect(description.locator('.example').first().locator('pre')).toContainText(' = ');await expect(description.locator('.example').first().locator('code').first()).toBeVisible();
  const efficiency=description.locator('.efficiency-goal');await expect(efficiency).not.toHaveAttribute('open');await efficiency.locator('summary').click();await expect(efficiency).toHaveAttribute('open','');await expect(efficiency).toContainText('Big-O describes');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
