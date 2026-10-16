import fs from "node:fs";
import { chromium, expect } from "@playwright/test";
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:768,height:1024},reducedMotion:"reduce"});
 const errors=[];page.on("pageerror",error=>errors.push(error.message));
 await page.goto(`${process.env.IWONS_DEV_URL||"http://127.0.0.1:4174"}/design/learning/session/`);
 await page.getByRole("button",{name:"Start a 10-minute session",exact:true}).click();
 await page.getByRole("navigation",{name:"Session code track"}).getByRole("button",{name:"JavaScript",exact:true}).click();
 await page.getByRole("button",{name:"Continue to the lesson step",exact:true}).click();
 await page.getByRole("textbox",{name:"Your guess slip",exact:true}).fill("Ready");
 await page.getByRole("button",{name:"Keep my guess and try it",exact:true}).click();
 await page.getByRole("button",{name:"Try it",exact:true}).click();
 await expect(page.getByRole("button",{name:"Continue to the exercise",exact:true})).toBeEnabled({timeout:120000});
 await page.getByRole("button",{name:"Continue to the exercise",exact:true}).click();
 await page.getByRole("button",{name:"Very sure",exact:true}).click();
 await page.locator(".monaco-editor").waitFor();
 const keys=JSON.parse(fs.readFileSync("public/learn-data/exercise-tool-demo-program.json","utf8"));
 await page.evaluate(source=>new Promise(resolve=>window.require(["vs/editor/editor.main"],monaco=>{monaco.editor.getModels()[0].setValue(source);resolve();})),keys.variants.javascript.referenceSolution);
 await page.getByRole("button",{name:"Submit solution",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Your session recap",exact:true})).toBeVisible({timeout:120000});
 await expect(page.getByText("0 successful recalls. 1 exercises passed. 0 items to revisit.",{exact:true})).toBeVisible();
 expect(errors).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 fs.mkdirSync("artifacts/learning-engine",{recursive:true});
 await page.screenshot({path:"artifacts/learning-engine/session-recap.png"});
 fs.writeFileSync("artifacts/learning-engine/session.json",JSON.stringify({passed:true,errors})+"\n");
 console.log("Short session: prediction, worker run, exercise submission and recap passed.");
}finally{await browser.close();}
