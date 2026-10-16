const privateFields=new Set(["privateData","hiddenCases","referenceSolution","referenceSolutions","correctOptionId","correctAnswer","answers","expectedOutput"]);
export function assertLearningPublicContent(value:unknown,location="content"):void {
 if(Array.isArray(value)){value.forEach((item,index)=>assertLearningPublicContent(item,`${location}[${index}]`));return;}
 if(value&&typeof value==="object")for(const [key,child]of Object.entries(value)){
  if(privateFields.has(key))throw new Error(`Private learning field in public HTML data: ${location}.${key}`);
  assertLearningPublicContent(child,`${location}.${key}`);
 }
}
