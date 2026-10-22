import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
test('main navigation warms destinations and changes pages without reloading the document',async({page})=>{
 const fetched:string[]=[];const heavy:string[]=[];let documents=0;
 page.on('request',request=>{if(request.headers()['rsc']==='1')fetched.push(new URL(request.url()).pathname);if(request.isNavigationRequest()&&request.frame()===page.mainFrame())documents++;if(/\/monaco\/|\/runners\/|pyodide/.test(request.url()))heavy.push(request.url());});
 await page.goto('/path/');
 await expect.poll(()=>fetched.some(path=>path.startsWith('/progress/')),{timeout:15000}).toBe(true);
 await expect(page.getByRole('contentinfo')).not.toContainText(/Made by|Snowi/);
 const marker=await page.evaluate(()=>{const value=crypto.randomUUID();(window as Window&{navigationMarker?:string}).navigationMarker=value;return value;});
 await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'Progress',exact:true}).click();
 await expect(page).toHaveURL(/\/progress\/$/);await expect(page.locator('main h1')).toBeVisible();
 expect(await page.evaluate(()=>(window as Window&{navigationMarker?:string}).navigationMarker)).toBe(marker);expect(documents).toBe(1);expect(heavy).toEqual([]);
});
