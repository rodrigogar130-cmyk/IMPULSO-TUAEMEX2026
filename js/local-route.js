const STORAGE_KEY='impulso-2026-ruta-local';

function validItem(item){return item&&typeof item.slug==='string'&&item.slug.trim();}
function read(){
  try{
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
    return Array.isArray(data)?data.filter(validItem):[];
  }catch{return [];}
}
function sort(items){
  return [...items].sort((a,b)=>`${a.activity_date||'9999-12-31'}T${a.start_time||'99:99'}${a.title||''}`.localeCompare(`${b.activity_date||'9999-12-31'}T${b.start_time||'99:99'}${b.title||''}`,'es'));
}
function save(items){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(sort(items)));}catch{}
  document.dispatchEvent(new CustomEvent('impulso:local-route-changed',{detail:getLocalRoute()}));
}
function minutes(value){
  const match=/^(\d{2}):(\d{2})/.exec(String(value||''));
  return match?Number(match[1])*60+Number(match[2]):null;
}
export function getLocalRoute(){return sort(read());}
export function hasLocalRouteItem(slug){return getLocalRoute().some(item=>item.slug===slug);}
export function conflictingActivities(activity,items=getLocalRoute()){
  const start=minutes(activity?.start_time),end=minutes(activity?.end_time);
  if(!activity?.activity_date||start===null||end===null||end<=start)return [];
  return items.filter(item=>{
    if(item.slug===activity.slug||item.activity_date!==activity.activity_date)return false;
    const itemStart=minutes(item.start_time),itemEnd=minutes(item.end_time);
    return itemStart!==null&&itemEnd!==null&&itemEnd>itemStart&&start<itemEnd&&itemStart<end;
  });
}
export function addToLocalRoute(activity){
  if(!validItem(activity))return {added:false,reason:'invalid',conflicts:[]};
  const items=getLocalRoute();
  if(items.some(item=>item.slug===activity.slug))return {added:false,reason:'exists',conflicts:conflictingActivities(activity,items)};
  const record={id:activity.id||null,slug:activity.slug,title:activity.title||'',activity_type:activity.activity_type||'',scenario:activity.scenario||'',activity_date:activity.activity_date||null,start_time:activity.start_time||null,end_time:activity.end_time||null,location:activity.location||null};
  const conflicts=conflictingActivities(record,items);
  save([...items,record]);
  return {added:true,conflicts};
}
export function removeFromLocalRoute(slug){
  const items=getLocalRoute(),next=items.filter(item=>item.slug!==slug);
  if(next.length===items.length)return false;
  save(next);return true;
}
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)document.dispatchEvent(new CustomEvent('impulso:local-route-changed',{detail:getLocalRoute()}));});
