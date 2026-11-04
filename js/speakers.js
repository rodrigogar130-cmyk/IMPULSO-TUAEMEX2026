import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js?v=20260921-4';
import { listActivities } from './activities.js?v=20261002-2';
import { element, scenarioName } from './route-ui.js?v=20260921-4';
import { addToLocalRoute, getLocalRoute, hasLocalRouteItem, removeFromLocalRoute } from './local-route.js?v=20261103-1';

const target=document.querySelector('#speakersDynamic');
const filters=document.querySelector('#speakerFilters');
const routePanel=document.querySelector('#speakerRoutePanel');
const placeholderSvg=`data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#1a1a1a"/><circle cx="60" cy="43" r="22" fill="#777"/><path d="M20 112c5-25 21-38 40-38s35 13 40 38" fill="#777"/></svg>')}`;
const scenarioNames={cultura:'Cultura',deporte:'Deporte',tecnologia:'Tecnología',diseno:'Diseño',investigacion:'Investigación aplicada',gobernanza:'Gobernanza',bienestar:'Bienestar Integral'};
const activityTypeLabels={dde_talk:'DDE TALK',conferencia_magistral:'CONFERENCIA MAGISTRAL',panel:'PANEL',workshop:'WORKSHOP',caso_de_exito:'CASO DE ÉXITO'};
let publicSpeakersPromise;
let activitiesBySlug=new Map();
let activeStage='all';

function normalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function activityScheduleKey(activity){
  return [activity?.activity_date||'9999-12-31',activity?.start_time||'99:99:99',normalize(activity?.title)].join('|');
}
function orderedSpeakers(speakers){
  if(!activitiesBySlug.size)return speakers||[];
  return (speakers||[]).map((speaker,index)=>({speaker,index,key:(speaker.participations||[])
    .map(participation=>activitiesBySlug.get(participation.slug))
    .filter(Boolean)
    .map(activityScheduleKey)
    .sort()[0]||`9999-12-31|99:99:99|${String(index).padStart(4,'0')}`}))
    .sort((a,b)=>a.key.localeCompare(b.key,'es')||a.index-b.index)
    .map(item=>item.speaker);
}
function orderedActivities(activities){
  return [...activities].sort((a,b)=>activityScheduleKey(a).localeCompare(activityScheduleKey(b),'es'));
}
function orderedParticipations(participations){
  if(!activitiesBySlug.size)return participations||[];
  return (participations||[]).map((participation,index)=>({participation,index,key:activityScheduleKey(activitiesBySlug.get(participation.slug))}))
    .sort((a,b)=>a.key.localeCompare(b.key,'es')||a.index-b.index)
    .map(item=>item.participation);
}
function activityTypeLabel(type){return activityTypeLabels[type]||String(type||'').trim().toLocaleUpperCase('es-MX');}
function relativePhotoPath(path){const value=String(path||'').trim().replace(/\\/g,'/');return !value||value.startsWith('/')||value.split('/').some(part=>!part||part==='.'||part==='..')?null:value;}
function encodedPhotoPath(path){return path.split('/').map(encodeURIComponent).join('/');}
function photoUrls(path){const relativePath=relativePhotoPath(path);if(!relativePath)return null;const encodedPath=encodedPhotoPath(relativePath);return {hosted:`/imagenes/ponentes/${encodedPath}?v=20261103-speaker-photos`,legacy:`${SUPABASE_URL}/storage/v1/object/public/speaker-photos/${encodedPath}`};}
function loadSpeakerPhoto(image,path){const urls=photoUrls(path);if(!urls){image.src=placeholderSvg;return;}image.dataset.speakerPhotoFallback=urls.legacy;image.src=urls.hosted;image.onerror=()=>{const fallback=image.dataset.speakerPhotoFallback;if(fallback){delete image.dataset.speakerPhotoFallback;image.src=fallback;return;}image.onerror=null;image.src=placeholderSvg;};}
function dateLabel(date){if(!date)return null;const parsed=new Date(`${date}T12:00:00`);return Number.isNaN(parsed.valueOf())?null:new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',year:'numeric'}).format(parsed);}
function timeLabel(activity){const start=activity?.start_time?.slice(0,5),end=activity?.end_time?.slice(0,5);return start&&end?`${start} – ${end}`:start?`${start} · fin por confirmar`:end?`inicio por confirmar · ${end}`:null;}
function scheduleMeta(activity,groupScenario){
  if(!activity)return null;
  const meta=element('dl',undefined,'speaker-activity-meta');
  const add=(label,value)=>{if(!value)return;const row=element('div');row.append(element('dt',label),element('dd',value));meta.append(row);};
  add('FECHA',dateLabel(activity.activity_date));add('HORARIO',timeLabel(activity));add('SEDE',activity.location);
  if(activity.scenario&&activity.scenario!==groupScenario)add('ESCENARIO',scenarioName(activity.scenario));
  return meta.childElementCount?meta:null;
}
function activityLink(activity){
  const link=element('a','VER ACTIVIDAD ','text-link');link.href=activity?.slug?'#agenda':'#ponentes';link.append(element('span','↗'));
  link.addEventListener('click',event=>{if(!activity?.slug)return;event.preventDefault();const card=[...document.querySelectorAll('[data-activity-slug]')].find(item=>item.dataset.activitySlug===activity.slug);if(!card)return;card.setAttribute('tabindex','-1');card.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});card.focus({preventScroll:true});});
  return link;
}
function routeButton(activity){
  if(!activity?.slug)return null;
  const selected=hasLocalRouteItem(activity.slug);const button=element('button',selected?'QUITAR DE MI RUTA':'+ AGREGAR A MI RUTA','btn btn-outline speaker-route-button');button.type='button';button.dataset.routeSlug=activity.slug;button.setAttribute('aria-pressed',String(selected));
  button.addEventListener('click',()=>{if(hasLocalRouteItem(activity.slug)){removeFromLocalRoute(activity.slug);return;}const result=addToLocalRoute(activity);const status=routePanel?.querySelector('[data-local-route-status]');if(status)status.textContent=result.conflicts.length?'Actividad agregada. Se identificó un cruce de horario en tu ruta.':'Actividad agregada a Mi Ruta Impulso.';});
  return button;
}
function participationCard(participation,groupScenario){
  const activity=activitiesBySlug.get(participation.slug);const item=element('article',undefined,'speaker-participation');if(activity?.slug)item.dataset.activitySlug=activity.slug;
  const type=activityTypeLabel(activity?.activity_type||participation.activity_type);if(type)item.append(element('span',type,'micro-label'));
  item.append(element('p',activity?.title||participation.title));const meta=scheduleMeta(activity,groupScenario);if(meta)item.append(meta);
  const actions=element('div',undefined,'speaker-activity-actions');actions.append(activityLink(activity||participation));const button=routeButton(activity);if(button)actions.append(button);item.append(actions);return item;
}
function speakerCard(speaker,scenario){
  const card=element('article',undefined,'speaker speaker-dynamic');const image=element('img',undefined,'speaker-photo');image.alt=speaker.photo_path?speaker.name:`Fotografía no disponible de ${speaker.name}`;image.width=150;image.height=150;image.loading='lazy';image.decoding='async';loadSpeakerPhoto(image,speaker.photo_path);
  card.append(image,element('h4',speaker.name));if(speaker.bio)card.append(element('p',speaker.bio,'speaker-profile'));if(speaker.organization)card.append(element('p',speaker.organization,'content-note'));
  const participations=element('div',undefined,'speaker-participations');for(const participation of orderedParticipations(speaker.participations))participations.append(participationCard(participation,scenario));card.append(participations);
  card.dataset.search=normalize([speaker.name,speaker.bio,speaker.organization,...(speaker.participations||[]).flatMap(item=>[item.title,activitiesBySlug.get(item.slug)?.location])].join(' '));return card;
}
function activityOnlyCard(activity){
  const card=element('article',undefined,'speaker speaker-dynamic speaker-activity-only');card.dataset.scenario=activity.scenario||'';card.dataset.search=normalize([activity.title,activity.speaker,activity.location,activity.scenario].join(' '));
  card.append(element('h4','PONENTE POR CONFIRMAR'),participationCard(activity,activity.scenario));return card;
}
function applyFilters(){
  const query=normalize(filters?.querySelector('input')?.value);let visible=0;
  target?.querySelectorAll('.speaker-group').forEach(group=>{const stageMatch=activeStage==='all'||group.dataset.scenario===activeStage;let groupVisible=0;group.querySelectorAll('.speaker').forEach(card=>{const cardStageMatch=group.dataset.unassigned==='true'?(activeStage==='all'||card.dataset.scenario===activeStage):stageMatch;const match=cardStageMatch&&(!query||card.dataset.search.includes(query));card.hidden=!match;if(match)groupVisible++;});group.hidden=!groupVisible;if(groupVisible&&(activeStage!=='all'||query))group.open=true;if(groupVisible)visible+=groupVisible;});
  const status=filters?.querySelector('[data-speaker-results]');if(status)status.textContent=visible?`${visible} ${visible===1?'ponente disponible':'ponentes disponibles'}`:'No hay ponentes con esos filtros.';
  filters?.querySelectorAll('[data-speaker-stage]').forEach(button=>{const active=button.dataset.speakerStage===activeStage;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
}
function routeItem(item,items){
  const card=element('article',undefined,'local-route-item'),copy=element('div');copy.append(element('strong',item.title||'Actividad sin título'),element('p',[dateLabel(item.activity_date),timeLabel(item),item.location].filter(Boolean).join(' · ')||'Información por confirmar'));
  const overlaps=items.filter(other=>other.slug!==item.slug&&other.activity_date===item.activity_date&&item.start_time&&item.end_time&&other.start_time&&other.end_time&&item.start_time<other.end_time&&other.start_time<item.end_time);if(overlaps.length)copy.append(element('small','Cruce de horario detectado.','route-conflict'));
  const remove=element('button','QUITAR','btn btn-outline');remove.type='button';remove.addEventListener('click',()=>removeFromLocalRoute(item.slug));card.append(copy,remove);return card;
}
function renderRoute(){
  if(!routePanel)return;const items=getLocalRoute();routePanel.replaceChildren();const heading=element('h3','MI RUTA IMPULSO'),count=element('p',items.length?`${items.length} ${items.length===1?'actividad guardada':'actividades guardadas'}`:'Aún no has guardado actividades.','local-route-count'),status=element('p','','content-note');status.dataset.localRouteStatus='';status.setAttribute('role','status');
  const list=element('div',undefined,'local-route-list');if(items.length)items.forEach(item=>list.append(routeItem(item,items)));else list.append(element('p','Agrega actividades desde las tarjetas de ponentes. La selección se guarda en este dispositivo.','content-note'));
  routePanel.append(heading,count,status,list);target?.querySelectorAll('[data-route-slug]').forEach(button=>{const selected=hasLocalRouteItem(button.dataset.routeSlug);button.textContent=selected?'QUITAR DE MI RUTA':'+ AGREGAR A MI RUTA';button.setAttribute('aria-pressed',String(selected));});
}
function render(groups){
  if(!target)return;target.replaceChildren();for(const [index,group] of (groups||[]).entries()){const details=element('details',undefined,'speaker-group');details.dataset.scenario=group.scenario;details.open=index===0;const summary=element('summary');summary.append(element('span',String(group.position).padStart(2,'0'),'group-index'),element('h3',group.label||scenarioNames[group.scenario]),element('span','+','group-action'));details.append(summary);details.addEventListener('toggle',()=>{if(!details.open||activeStage!=='all'||filters?.querySelector('input')?.value)return;target.querySelectorAll('.speaker-group[open]').forEach(other=>{if(other!==details)other.open=false;});});if(!group.speakers?.length)details.append(element('p','Ponentes por confirmar.','content-note'));else{const grid=element('div',undefined,'speakers-grid');orderedSpeakers(group.speakers).forEach(speaker=>grid.append(speakerCard(speaker,group.scenario)));details.append(grid);}target.append(details);}
  const assigned=new Set((groups||[]).flatMap(group=>(group.speakers||[]).flatMap(speaker=>(speaker.participations||[]).map(item=>item.slug))).filter(Boolean));
  const unassigned=[...activitiesBySlug.values()].filter(activity=>activity.status==='open'&&!assigned.has(activity.slug));
  if(unassigned.length){const details=element('details',undefined,'speaker-group speaker-unassigned-group');details.dataset.unassigned='true';const summary=element('summary');summary.append(element('span','—','group-index'),element('h3','ACTIVIDADES SIN PONENTE CONFIRMADO'),element('span','+','group-action'));details.append(summary);const grid=element('div',undefined,'speakers-grid');orderedActivities(unassigned).forEach(activity=>grid.append(activityOnlyCard(activity)));details.append(grid);target.append(details);}
  applyFilters();renderRoute();
}
export function listPublicSpeakers(){
  if(!publicSpeakersPromise)publicSpeakersPromise=fetch(`${SUPABASE_URL}/rest/v1/rpc/public_list_speakers`,{method:'POST',credentials:'omit',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${SUPABASE_PUBLISHABLE_KEY}`,'Content-Type':'application/json',Accept:'application/json'},body:'{}'}).then(async response=>{if(!response.ok)throw new Error('PUBLIC_SPEAKERS_UNAVAILABLE');const groups=await response.json();if(!Array.isArray(groups))throw new Error('INVALID_PUBLIC_SPEAKERS');return groups;}).catch(error=>{publicSpeakersPromise=undefined;throw error;});
  return publicSpeakersPromise;
}
async function load(){
  if(!target)return;target.setAttribute('aria-busy','true');
  try{
    // Las tarjetas de ponentes nunca dependen de que la agenda responda: primero
    // se restauran foto, nombre, semblanza y actividad original.
    const groups=await listPublicSpeakers();
    render(groups);
    try{
      const activities=await listActivities();
      activitiesBySlug=new Map(activities.map(activity=>[activity.slug,activity]));
      render(groups);
    }catch{
      // Se mantiene la tarjeta original; sólo se omiten los metadatos no verificados.
    }
  }catch{target.replaceChildren(element('p','No pudimos cargar los ponentes en este momento.','content-note'));}
  finally{target.removeAttribute('aria-busy');}
}
function scheduleLoad(){if(!target)return;let started=false;const start=()=>{if(started)return;started=true;observer?.disconnect();void load();};let observer;if('IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))start();},{rootMargin:'800px 0px',threshold:0});observer.observe(target);}else start();}
filters?.addEventListener('input',applyFilters);filters?.querySelectorAll('[data-speaker-stage]').forEach(button=>button.addEventListener('click',()=>{activeStage=button.dataset.speakerStage||'all';applyFilters();}));
document.addEventListener('click',event=>{const link=event.target.closest?.('[data-agenda-stage]');if(!link)return;event.preventDefault();activeStage=link.dataset.agendaStage||'all';const input=filters?.querySelector('input');if(input)input.value='';applyFilters();document.getElementById('ponentes')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});history.replaceState(null,'','#agenda');});
document.addEventListener('impulso:local-route-changed',renderRoute);document.addEventListener('impulso:section-open',event=>{if(event.detail==='agenda')document.getElementById('ponentes')?.scrollIntoView({behavior:'smooth',block:'start'});});void scheduleLoad();
