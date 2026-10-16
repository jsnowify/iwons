const english=new Set(["path","problems","dashboard","submissions","progress","review","lists","plans","contest","settings","about","visualizer","warm-up","topics"]);
export function legacyRedirect(pathname){
 const og=pathname.match(/^\/og\/([a-z0-9-]+)\/$/);if(og)return `/og/${og[1]}.png`;
 if(/^\/learn(?:\/|$)/.test(pathname))return "/";
 const locale=pathname.match(/^\/(?:tl|ceb)(?:\/(.*))?$/);
 if(!locale)return null;
 const rest=locale[1]??"",section=rest.split("/")[0];
 return english.has(section)?`/${rest.replace(/\/+$/,"")}/`:"/";
}
