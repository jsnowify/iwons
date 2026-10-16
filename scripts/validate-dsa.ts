import { validateLearnStructure } from "./validate-learn.ts";
const manifest=validateLearnStructure(["dsa"]);
if(manifest.courses.find(course=>course.id==="dsa")?.modules.length!==20)throw new Error("DSA must include its 20 module maps.");
console.log("Algorithm course structure, existing Path practice-unit references and any ready lesson runtimes passed.");
