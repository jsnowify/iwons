import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
test('editor opens directly while code runtimes wait for Run',async({page})=>{
 const runtime:string[]=[];page.on('request',request=>{if(/\/runners\/|pyodide/.test(request.url()))runtime.push(request.url());});
 await page.goto('/problems/receipt-arithmetic-proof-strip/');await expect(page.locator('.monaco-editor')).toBeVisible();
 await expect(page.getByRole('button',{name:'Open code editor',exact:true})).toHaveCount(0);expect(runtime).toEqual([]);
});
