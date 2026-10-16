import fs from "node:fs";
import { chromium, expect } from "@playwright/test";
const browser=await chromium.launch();
const base=process.env.IWONS_DEV_URL||"http://127.0.0.1:4174";
try{
 const page=await browser.newPage({viewport:{width:1024,height:900},reducedMotion:"reduce"});
 const url=`${base}/learn/javascript/computer-programming-1/meet-the-language/the-first-message/`;
 await page.goto(url);const slip=page.getByRole("textbox",{name:"Your guess slip",exact:true});
 await slip.fill("Saved independent guess");await page.getByRole("button",{name:"4. Modify",exact:true}).click();
 const source='console.log("My saved edit");';await page.getByRole("textbox",{name:"Your program",exact:true}).fill(source);
 await page.reload();await expect(slip).toHaveValue("Saved independent guess");
 await page.getByRole("button",{name:"4. Modify",exact:true}).click();await expect(page.getByRole("textbox",{name:"Your program",exact:true})).toHaveValue(source);
 await page.getByRole("navigation",{name:"Code track",exact:true}).getByRole("link",{name:"Python",exact:true}).click();
 await expect(page).toHaveURL(/python\/computer-programming-1\/meet-the-language\/the-first-message/);
 await expect(slip).toHaveValue("");
 await page.getByRole("navigation",{name:"Code track",exact:true}).getByRole("link",{name:"JavaScript",exact:true}).click();await expect(slip).toHaveValue("Saved independent guess");
 await page.goto(`${base}/problems/arrange-two-desk-lines/`);
 await page.getByRole("navigation",{name:"Exercise code track",exact:true}).getByRole("button",{name:"JavaScript",exact:true}).click();
 const first=page.locator(".learning-parsons li").first();await expect(first).toContainText('console.log("Ready");');
 await page.getByRole("button",{name:"Move block 1 down",exact:true}).focus();await page.keyboard.press("Enter");
 await expect(page.locator(".learning-parsons li").last()).toBeFocused();await page.reload();await expect(first).toContainText('console.log("Open");');
 await page.getByRole("navigation",{name:"Exercise code track",exact:true}).getByRole("button",{name:"Python",exact:true}).click();await expect(first).toContainText('print("Ready")');
 await page.getByRole("navigation",{name:"Exercise code track",exact:true}).getByRole("button",{name:"JavaScript",exact:true}).click();await expect(first).toContainText('console.log("Open");');
 fs.mkdirSync("artifacts/learning-engine",{recursive:true});fs.writeFileSync("artifacts/learning-engine/persistence.json",JSON.stringify({lessonSlip:true,modifyDraft:true,perTrackIsolation:true,parsonsReload:true,parsonsTrackSwitch:true,keyboardBoundaryFocus:true})+"\n");
 console.log("Learning drafts: lesson prediction/Modify and Parsons survive reload and track switching; boundary focus retained.");
}finally{await browser.close();}
