import {test,expect} from '@playwright/test';
test.use({serviceWorkers:'block'});
for(const width of [390,1024,1440])test(`ready visualizer and attached pickers at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.goto('/visualizer/');
 await expect(page.getByRole('button',{name:'Open the workbench',exact:true})).toHaveCount(0);
 const algorithm=page.getByRole('combobox',{name:'Algorithm',exact:true});await expect(algorithm.locator('option')).toHaveCount(9);
 for(const [id,title]of [['binary','Binary search'],['linear','Linear search'],['sort','Insertion sort'],['bubble','Bubble sort'],['selection','Selection sort'],['merge','Merge sort'],['quick','Quicksort'],['grid','BFS on a grid'],['dfs','DFS on a grid']]){
  await algorithm.selectOption(id);const board=page.getByRole('region',{name:title,exact:true});await expect(board).toContainText('Step 1 of');await board.getByRole('button',{name:'Step forward',exact:true}).click();await expect(board).toContainText('Step 2 of');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await algorithm.selectOption('binary');await algorithm.click();
 expect(await algorithm.evaluate(node=>node.matches(':open'))).toBe(true);
 const style=await algorithm.evaluate(node=>({appearance:getComputedStyle(node).appearance,background:getComputedStyle(node,'::picker(select)').backgroundColor}));expect(style.appearance).toBe('base-select');expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
 expect(await algorithm.locator('option').first().evaluate(node=>getComputedStyle(node,'::checkmark').display)).toBe('none');
 expect(await algorithm.evaluate(node=>getComputedStyle(node,'::picker(select)').overflowY)).toBe('auto');
 await page.screenshot({path:`artifacts/visualizer-picker-${width}.png`});await page.keyboard.press('Escape');
 await page.getByRole('button',{name:/Switch to .* theme/}).click();await page.screenshot({path:`artifacts/visualizer-night-${width}.png`});
});
test('each step has a tone after a gesture, mute survives algorithm changes, and reduced motion stops autoplay',async({page})=>{
 await page.addInitScript(()=>{
  const tracked=window as typeof window&{tones:number;contexts:number};tracked.tones=0;tracked.contexts=0;
  const Original=window.AudioContext;
  window.AudioContext=class extends Original {constructor(){super();tracked.contexts++;}createOscillator(){tracked.tones++;return super.createOscillator();}};
 });
 await page.goto('/visualizer/');await expect(page.getByRole('region',{name:'Binary search',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>(window as typeof window&{contexts:number}).contexts)).toBe(0);
 const next=page.getByRole('button',{name:'Step forward',exact:true});await next.click();await expect.poll(()=>page.evaluate(()=>(window as typeof window&{tones:number}).tones)).toBe(1);
 await next.click();await expect.poll(()=>page.evaluate(()=>(window as typeof window&{tones:number}).tones)).toBe(2);
 await page.getByRole('button',{name:'Visualizer sound',exact:true}).click();await next.click();expect(await page.evaluate(()=>(window as typeof window&{tones:number}).tones)).toBe(2);
 await page.getByRole('combobox',{name:'Algorithm',exact:true}).selectOption('bubble');await expect(page.getByRole('button',{name:'Visualizer sound',exact:true})).toHaveAttribute('aria-pressed','false');
 await page.getByRole('button',{name:'Visualizer sound',exact:true}).click();await page.getByRole('combobox',{name:'Speed',exact:true}).selectOption('350');await page.getByRole('button',{name:'Play',exact:true}).click();await expect.poll(()=>page.evaluate(()=>(window as typeof window&{tones:number}).tones)).toBeGreaterThan(3);await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.getByRole('button',{name:'Play',exact:true})).toBeDisabled();await next.click();expect(await page.locator('.visual-cell').first().evaluate(node=>getComputedStyle(node).animationName)).toBe('none');
});
