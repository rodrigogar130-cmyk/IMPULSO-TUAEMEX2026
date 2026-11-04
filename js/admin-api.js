import { client } from './supabase-client.js?v=20260921-4';
export async function adminCall(name,args={}) {
  const {data,error}=await client().rpc(name,args);
  if(error)throw error;
  return data;
}
export function adminError(error){
  const code=error?.message||'';
  if(code.includes('ACTIVITY_HAS_REGISTRATIONS'))return 'No se puede eliminar porque esta actividad tiene participantes registrados. Cámbiala a CANCELADA para retirarla de la agenda sin perder el historial.';
  if(code.includes('ACTIVITY_HAS_ATTENDANCES'))return 'No se puede eliminar porque esta actividad tiene asistencias confirmadas. Cámbiala a CANCELADA para conservar el historial.';
  if(code.includes('SPEAKER_HAS_ACTIVITY_LINKS'))return 'No se puede eliminar porque el ponente sigue vinculado a actividades. Desvincúlalo primero para conservar el historial de cada actividad.';
  if(code.includes('SPEAKER_NOT_FOUND'))return 'No se encontró el ponente.';
  if(code.includes('INVALID_ACTIVITY_STATUS'))return 'Selecciona un estado válido.';
  if(code.includes('EVENT_UNAVAILABLE'))return 'El festival no está disponible para crear actividades.';
  if(code.includes('SCENARIO_ADMIN_REQUIRED'))return 'No tienes permiso para administrar este escenario. Vuelve a escenarios para consultar tus accesos.';
  if(code.includes('SUPER_ADMIN_REQUIRED'))return 'Esta consulta requiere permisos de superadministrador.';
  if(code.includes('ADMIN_REQUIRED'))return 'No tienes permisos para acceder a esta sección.';
  if(code.includes('EDIT_CONFLICT'))return 'Otro administrador modificó esta actividad. Recarga sus datos antes de guardar.';
  if(code.includes('ACTIVITY_DATE_REQUIRED'))return 'Una actividad OPEN necesita fecha.';
  if(code.includes('INVALID_ACTIVITY_TIME'))return 'La hora de término debe ser posterior al inicio.';
  if(code.includes('ACTIVITY_TITLE_REQUIRED'))return 'El título es obligatorio.';
  if(code.includes('INVALID_ACTIVITY_SCENARIO'))return 'Selecciona un escenario válido.';
  if(code.includes('ACTIVITY_UNAVAILABLE'))return 'No se encontró esta actividad dentro del festival.';
  if(code.includes('USER_NOT_FOUND'))return 'No se encontró el usuario dentro del festival.';
  if(code.includes('INVALID_BADGE_FILTER'))return 'Selecciona un filtro de insignias válido.';
  if(code.includes('INVALID_BOOTCAMP_EMAIL'))return 'Ingresa un correo válido para el participante.';
  if(code.includes('INVALID_BOOTCAMP_IMPORT'))return 'El CSV debe incluir una columna correo/email y contener máximo 1,000 filas.';
  if(code.includes('BOOTCAMP_PARTICIPANT_NOT_FOUND'))return 'No se encontró el participante del Bootcamp.';
  return 'No se pudo completar la operación. Inténtalo de nuevo.';
}
