const english=new Set(["path","problems","dashboard","submissions","progress","review","lists","plans","contest","settings","about","visualizer","warm-up","topics"]);
export function legacyRedirect(pathname){
 if(/^\/learn(?:\/|$)/.test(pathname))return "/";
 const locale=pathname.match(/^\/(?:tl|ceb)(?:\/(.*))?$/);
 if(!locale)return null;
 const rest=locale[1]??"",section=rest.split("/")[0];
 return english.has(section)?`/${rest.replace(/\/+$/,"")}/`:"/";
}
