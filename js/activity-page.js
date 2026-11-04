import { client } from './supabase-client.js?v=20260921-4';
import { getVerifiedSession,onAuthStateChange } from './auth.js?v=20260921-4';
import { prepareAccount } from './prepare-account.js?v=20260921-4';
import { authLink,requestedCheckin,requestedPointToken,preserveAuthLinks } from './return-to.js?v=20260921-4';
import { parseNfcRoute,nfcDestination } from './nfc-path.js?v=20260921-4';
import { getMyAttendances,attendanceMessage,notifyAttendance } from './attendance.js?v=20261002-1';
import { element,formatActivityTime,scenarioName } from './route-ui.js?v=20260921-4';
import { SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY } from './config.js?v=20260921-4';
import { TURNSTILE_SITE_KEY } from './nfc-config.js?v=20260921-4';
const status=document.querySelector('#attendance-status'),actions=document.querySelector('#attendance-actions');
const title=document.querySelector('#activity-title'),scenario=document.querySelector('#activity-scenario'),detail=document.querySelector('#activity-detail');
const bootcampPanel=document.querySelector('#bootcamp-private'),bootcampDetails=document.querySelector('#bootcamp-private-details'),bootcampResult=document.querySelector('#bootcamp-attendance-result');
let busy=false,done=false,widget=null,owner=null,activity=null,accountState=null,bootcamp=false;
const say=code=>{status.textContent=attendanceMessage(code);};
function showBootcampResult(code,attendance){
 const profile=accountState?.profile||{},registration=accountState?.registration||{};
 const name=[profile.nombre,profile.apellidos].filter(Boolean).join(' ')||'Participante';
 const attendedAt=attendance?.created_at||attendance?.attended_at||null;
 const parsedDate=attendedAt?new Date(attendedAt):null;
 const date=parsedDate&&!Number.isNaN(parsedDate.getTime())?new Intl.DateTimeFormat('es-MX',{dateStyle:'long',timeStyle:'short',timeZone:'America/Mexico_City'}).format(parsedDate):'Fecha y hora no disponibles';
 bootcampResult.replaceChildren();
 bootcampResult.append(element('p',code==='RECORDED'?'ASISTENCIA REGISTRADA ✓':'ASISTENCIA YA REGISTRADA ✓','bootcamp-attendance-state'));
 for(const [label,value] of [['PARTICIPANTE',name],['FOLIO IMPULSO',registration.folio||'—'],['FECHA Y HORA',date]]){
  const field=element('p',label,'bootcamp-attendance-field');field.append(element('strong',value));bootcampResult.append(field);
 }
 bootcampDetails.hidden=false;bootcampResult.hidden=false;status.textContent='';actions.replaceChildren();
}
function login(){
 status.textContent=bootcamp?'Para registrar tu asistencia necesitas ingresar o crear tu cuenta de Impulso TUAEMÉX 2026.':attendanceMessage('AUTH_REQUIRED');actions.replaceChildren();
 const link=element('a','INICIAR SESIÓN','btn btn-primary');link.href=authLink('login.html');actions.append(link);
 if(bootcamp){const register=element('a','CREAR CUENTA','btn btn-outline');register.href=authLink('registro.html');actions.append(register);}
}
function retry(){
 actions.replaceChildren();const button=element('button','VOLVER A INTENTAR','btn btn-outline');button.type='button';
 button.onclick=()=>{if(busy||done)return;actions.replaceChildren();status.textContent='Verificando asistencia…';
  if(widget!==null)window.turnstile.reset(widget);else location.reload();};actions.append(button);
}
async function submit(token){
 if(busy||done)return;busy=true;actions.replaceChildren();status.textContent='Verificando asistencia…';
 try{
  const session=await getVerifiedSession();
  if(!session||session.user.id!==owner){login();return;}
  const response=await fetch(SUPABASE_URL+'/functions/v1/nfc-attendance',{
   method:'POST',credentials:'omit',headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},
   body:JSON.stringify({activity_id:activity.id,token,point_token:requestedPointToken()}),signal:AbortSignal.timeout(25000)});
  const result=await response.json();
  if(!response.ok&&['RECORDED','ALREADY_COMPLETED'].includes(result?.code))throw new Error('Invalid response');
  say(result?.code);
  if(['RECORDED','ALREADY_COMPLETED'].includes(result.code)){
   done=true;notifyAttendance();
   if(bootcamp){const rows=await getMyAttendances().catch(()=>[]);showBootcampResult(result.code,rows.find(row=>row.activity_id===activity.id));}
  }
  else if(result.code==='AUTH_REQUIRED')login();
  else if(result.code==='BOOTCAMP_ACCESS_RESTRICTED'){
   actions.replaceChildren();
  }
  else if(['PRIVACY_REQUIRED','EVENT_REGISTRATION_REQUIRED'].includes(result.code)){
   const link=element('a','REVISAR MI CUENTA','btn btn-outline');link.href='mi-cuenta.html';actions.append(link);
  }else retry();
 }catch{say('SERVICE_UNAVAILABLE');retry();}
 finally{busy=false;}
}
try{
 preserveAuthLinks();
 const route=parseNfcRoute(requestedCheckin());
 if(!route){say('ACTIVITY_NOT_FOUND');}
 else{
  // Fuente de verdad: RPC existente. No se utiliza el catálogo JSON de respaldo para asistencia.
  const {data,error}=await client().rpc('get_attendance_activity',{p_scenario:route.scenario,p_slug:route.slug,p_point_token:requestedPointToken()});
  if(error)throw error;
  activity=data?.find(a=>a.scenario===route.scenario&&a.slug===route.slug);
  if(!activity)say('ACTIVITY_NOT_FOUND');
  else{
  bootcamp=activity.is_bootcamp===true||/bootcamp/i.test(`${activity.slug||''} ${activity.title||''}`);
  if(bootcamp){bootcampPanel.hidden=false;title.hidden=true;scenario.hidden=true;detail.hidden=true;}
  else{
   title.textContent=activity.title;
   scenario.textContent=scenarioName(activity.scenario);
   detail.hidden=false;
   for(const value of [activity.description,formatActivityTime(activity)+' · Hora de Ciudad de México',activity.location||'Ubicación por confirmar',activity.speaker||'Ponente por confirmar'])if(value)detail.append(element('p',value));
  }
  if(bootcamp&&!requestedPointToken())say('POINT_TOKEN_INVALID');
  else{
   const session=await getVerifiedSession();
   if(!session?.user.email_confirmed_at)login();
   else{
    owner=session.user.id;
    onAuthStateChange((event,next)=>{if(event==='SIGNED_OUT'||(next&&next.user.id!==owner)){done=true;location.reload();}});
   accountState=await prepareAccount(session.user,nfcDestination(requestedCheckin(),requestedPointToken()));
   if(!accountState.privacyRequired){
    if(accountState.registration?.status!=='confirmed')say('EVENT_REGISTRATION_REQUIRED');
     else{
      const attendances=await getMyAttendances();
    if(!requestedPointToken())say('POINT_TOKEN_INVALID');
      else if(!activity.attendance_enabled)say('ATTENDANCE_CLOSED');
      else if(!TURNSTILE_SITE_KEY)say('NOT_CONFIGURED');
    else if(!bootcamp&&attendances.some(a=>a.activity_id===activity.id)){done=true;say('ALREADY_COMPLETED');}
      else{
       status.textContent='Verificando asistencia…';
       const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
       let scriptReady=false;
       const loadTimeout=setTimeout(()=>{if(!scriptReady&&!done){scriptReady=true;say('SECURITY_UNAVAILABLE');retry();}},15000);
       script.onload=()=>{if(scriptReady||done)return;scriptReady=true;clearTimeout(loadTimeout);
        try{widget=window.turnstile.render('#attendance-challenge',{
        sitekey:TURNSTILE_SITE_KEY,action:'nfc-attendance',cData:activity.id,appearance:'interaction-only',theme:'dark',size:'flexible',
        callback:submit,'error-callback':()=>{say('TURNSTILE_INVALID');retry();},
        'expired-callback':()=>{if(!busy&&!done){say('TURNSTILE_INVALID');retry();}},
        'timeout-callback':()=>{if(!busy&&!done){say('TURNSTILE_INVALID');retry();}}
       });}catch{say('SECURITY_UNAVAILABLE');retry();}};
       script.onerror=()=>{scriptReady=true;clearTimeout(loadTimeout);if(!done){say('SECURITY_UNAVAILABLE');retry();}};document.head.append(script);
      }
     }
    }
    }
   }
  }
 }
}catch{say('SERVICE_UNAVAILABLE');retry();}
