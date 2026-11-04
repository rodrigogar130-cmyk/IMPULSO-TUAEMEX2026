const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let navigationFrame=0;

function targetFromHash(hash){
 if(!hash||hash==='#')return null;
 try{return document.getElementById(decodeURIComponent(hash.slice(1)));}catch{return null;}
}
function documentPath(path){
 const normalized=path.replace(/\/+$/,'')||'/';
 return normalized==='/index.html'?'/':normalized;
}
function sameDocumentHash(link){
 const href=link.getAttribute('href');
 if(!href||href==='#')return null;
 try{
  const url=new URL(href,location.href);
  if(url.origin!==location.origin||documentPath(url.pathname)!==documentPath(location.pathname)||url.search!==location.search)return null;
  return url.hash||null;
 }catch{return null;}
}
function reveal(target){
 const section=target.closest?.('section[id]')||target;
 if(section?.style)section.style.contentVisibility='visible';
 if(target.id==='agenda'){
  document.getElementById('agendaDisclosure')?.setAttribute('open','');
  document.dispatchEvent(new CustomEvent('impulso:section-open',{detail:'agenda'}));
 }
}
function slideTo(target,behavior){
 cancelAnimationFrame(navigationFrame);
 reveal(target);
 navigationFrame=requestAnimationFrame(()=>{
  // content-visibility needs one layout frame before measuring the final offset.
  navigationFrame=requestAnimationFrame(()=>{
   const headerOffset=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-offset'))||92;
   const top=Math.max(0,window.scrollY+target.getBoundingClientRect().top-headerOffset);
   window.scrollTo({top,behavior});
   if(target.matches('section,[tabindex]')){
    target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
   }
  });
 });
}
function navigate(hash,{updateHistory=false,behavior=reducedMotion.matches?'auto':'smooth'}={}){
 const target=targetFromHash(hash);if(!target)return false;
 if(updateHistory&&location.hash!==hash)history.pushState(null,'',hash);
 slideTo(target,behavior);return true;
}

document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const link=event.target.closest?.('a[href]');if(!link)return;
 const hash=sameDocumentHash(link);if(!hash)return;
 if(!targetFromHash(hash))return;
 event.preventDefault();navigate(hash,{updateHistory:true});
});
window.addEventListener('hashchange',()=>{void navigate(location.hash,{behavior:'auto'});});
window.addEventListener('popstate',()=>{void navigate(location.hash,{behavior:'auto'});});
if(location.hash)requestAnimationFrame(()=>navigate(location.hash,{behavior:'auto'}));
