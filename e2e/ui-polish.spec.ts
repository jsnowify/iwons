import {test,expect} from "@playwright/test";
test("mobile navigation and readable filters keep native interaction",async({page})=>{
 await page.setViewportSize({width:360,height:800});await page.goto("/problems/");
 const menu=page.getByRole("button",{name:"Open navigation",exact:true});await expect(menu).toBeVisible();
 expect(await menu.locator("svg").evaluate(node=>node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(16);
 const bottom=page.getByRole("navigation",{name:"Mobile navigation",exact:true});await expect(bottom.getByRole("link",{name:"Review queue",exact:true})).toBeVisible();
 await bottom.getByRole("button",{name:"More pages",exact:true}).click();const dialog=page.getByRole("dialog",{name:"Your workspace",exact:true});await expect(dialog).toBeVisible();await expect(dialog.getByRole("link",{name:"Review queue",exact:true})).toBeVisible();await expect(dialog.getByRole("link",{name:"Contest",exact:true})).toBeVisible();await page.keyboard.press("Escape");await expect(dialog).not.toBeVisible();
 await expect(page.locator(".problem-row").first()).toBeInViewport({ratio:0.8});
 const filters=page.getByRole("button",{name:/Filters and order/});await filters.click();await expect(filters).toHaveAttribute("aria-expanded","true");
 const level=page.getByRole("combobox",{name:"Level filter",exact:true});await level.focus();await page.keyboard.press("ArrowDown");await expect(level).toHaveValue("0");
 const difficulty=page.getByRole("combobox",{name:"Difficulty filter",exact:true});await difficulty.selectOption("easy");await expect(difficulty).toHaveValue("easy");
 expect(await difficulty.evaluate(node=>getComputedStyle(node).backgroundImage)).not.toBe("none");
 const geometry=await page.locator(".problem-filter select").evaluateAll(nodes=>nodes.map(node=>({width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height})));expect(geometry.every(box=>box.width>=140&&box.height>=44)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await filters.click();await expect(filters).toHaveAttribute("aria-expanded","false");await filters.click();await expect(difficulty).toHaveValue("easy");
 await page.getByRole("button",{name:"Open navigation",exact:true}).click();await expect(dialog).toBeVisible();
});
