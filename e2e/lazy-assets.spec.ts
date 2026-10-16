import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
test('problem runtime and editor assets wait for interaction',async({page})=>{
 const heavy:string[]=[];page.on('request',request=>{if(/\/monaco\/|\/runners\/|pyodide/.test(request.url()))heavy.push(request.url());});
 await page.goto('/problems/receipt-arithmetic-proof-strip/');const open=page.getByRole('button',{name:'Open code editor',exact:true});await expect(open).toBeVisible();
 expect(heavy).toEqual([]);await open.click();await expect(page.locator('.monaco-editor')).toBeVisible();expect(heavy.some(url=>url.includes('/monaco/'))).toBe(true);
});
