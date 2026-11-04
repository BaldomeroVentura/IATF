const FIELDS=['id','task','department','owner','status','priority','due','done','verified','verifiedAt','blocked','evidence','notes','updatedAt'];
function doGet(){return HtmlService.createHtmlOutputFromFile('Index').setTitle('IATF · Checklist V27').addMetaTag('viewport','width=device-width, initial-scale=1')}
function role_(pass){const p=PropertiesService.getScriptProperties(),adm=p.getProperty('ADMIN_PASSWORD'),std=p.getProperty('STANDARD_PASSWORD');if(!adm||!std)throw Error('Configura las contraseñas del script');if(pass===adm)return 'admin';if(pass===std)return 'standard';throw Error('Contraseña incorrecta')}
function db_(){const id=PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');if(!id)throw Error('Ejecuta configurarInicial una vez antes de acceder.');return SpreadsheetApp.openById(id)}
function configurarInicial(){const p=PropertiesService.getScriptProperties(),a=p.getProperty('ADMIN_PASSWORD'),s=p.getProperty('STANDARD_PASSWORD');if(!a||!s||a===s||a.length<8||s.length<8)throw Error('Establece dos contraseñas distintas de al menos 8 caracteres en Propiedades del script.');if(p.getProperty('SPREADSHEET_ID'))throw Error('La hoja ya está creada; no se inicializa otra vez.');const b=SpreadsheetApp.create('IATF - Checklist compartido - 143 tareas'),sh=b.getSheets()[0];sh.setName('Tareas');sh.getRange(1,1,1,FIELDS.length).setValues([FIELDS]);const values=INITIAL_TASKS.map(t=>FIELDS.map(k=>t[k]??''));sh.getRange(2,1,values.length,FIELDS.length).setValues(values);sh.setFrozenRows(1);const log=b.insertSheet('Logs');log.appendRow(['FechaHora','Rol','Acción','ID','Campo','Anterior','Nuevo']);const v=b.insertSheet('Versiones');v.appendRow(['Versión','Fecha','Autor','Descripción']);v.appendRow(['V27','2026-11-04','B. Ventura · Calidad','Checklist compartido con Google Sheets; acceso estándar y administrador; verificación exclusiva de administrador']);v.appendRow(['V25','2026-11-04','B. Ventura · Calidad','143 tareas iniciales y métricas']);p.setProperty('SPREADSHEET_ID',b.getId());return b.getUrl()}
// V27.1 — Normalizar los valores Date que Google Sheets devuelve al leer las fechas.
function fechaISO_(value, timezone){
  if(value===null||value===undefined||value==='')return '';
  const tz=timezone||'Europe/Madrid';
  if(value instanceof Date){
    if(isNaN(value.getTime()))throw Error('Fecha incorrecta en Google Sheets');
    return Utilities.formatDate(value,tz,'yyyy-MM-dd');
  }
  const text=String(value).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(text))return text;
  const local=text.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4})$/);
  if(local)return local[3]+'-'+local[2].padStart(2,'0')+'-'+local[1].padStart(2,'0');
  const parsed=new Date(text);
  if(!isNaN(parsed.getTime()))return Utilities.formatDate(parsed,tz,'yyyy-MM-dd');
  throw Error('Formato de fecha no reconocido: '+text);
}
function tareaDesdeFila_(row,timezone){
  return Object.fromEntries(FIELDS.map((key,i)=>{
    const val=row[i];
    if(['done','verified','blocked'].includes(key))return [key,val===true||String(val).toLowerCase()==='true'];
    if(key==='id')return [key,Number(val)];
    if(key==='due'||key==='verifiedAt')return [key,fechaISO_(val,timezone)];
    if(key==='updatedAt'&&val instanceof Date)return [key,val.toISOString()];
    return [key,String(val??'')];
  }));
}
function registrarVersionV271_(sheet){
  const versiones=sheet.getSheetByName('Versiones');
  if(!versiones)return;
  const num=versiones.getLastRow();
  if(num>1&&versiones.getRange(2,1,num-1,1).getDisplayValues().some(row=>row[0]==='V27.1'))return;
  versiones.appendRow(['V27.1','2026-11-04','B. Ventura · Calidad','Corrección de conversión de fechas de Google Sheets al guardar Hecho o Verificado por mí; se conservan tareas y logs']);
}

function tasks_(){const sheet=db_(),timezone=sheet.getSpreadsheetTimeZone()||'Europe/Madrid';return sheet.getSheetByName('Tareas').getDataRange().getValues().slice(1).filter(r=>r[0]!==''&&r[0]!==null).map(r=>tareaDesdeFila_(r,timezone));}
function loadApp(password){const role=role_(password),b=db_(),response={role,version:'V27.1',tasks:tasks_()};if(role==='admin'){registrarVersionV271_(b);const log=b.getSheetByName('Logs'),n=log.getLastRow();response.logs=n>1?log.getRange(Math.max(2,n-298),1,Math.min(299,n-1),7).getDisplayValues().reverse():[];response.versions=b.getSheetByName('Versiones').getDataRange().getDisplayValues().slice(1)}return response}
function saveTask(password,proposed,expectedUpdatedAt){const role=role_(password);if(!proposed||!Number.isInteger(Number(proposed.id)))throw Error('Tarea inválida');const lock=LockService.getScriptLock();lock.waitLock(25000);try{const b=db_(),sh=b.getSheetByName('Tareas'),data=sh.getDataRange().getValues(),idx=data.findIndex((r,i)=>i>0&&Number(r[0])===Number(proposed.id));if(idx<1)throw Error('Tarea no encontrada');const old=tareaDesdeFila_(data[idx],b.getSpreadsheetTimeZone()||'Europe/Madrid');if(String(expectedUpdatedAt??'')!==old.updatedAt)throw Error('Otro usuario ha modificado esta tarea. Actualiza antes de editarla.');if(role!=='admin'&&Object.prototype.hasOwnProperty.call(proposed,'verified')&&proposed.verified!==old.verified)throw Error('Solo el administrador puede verificar');if(role!=='admin'&&proposed.status==='Verificado por mí'&&!old.verified)throw Error('Solo el administrador puede verificar');const next={...old},editable=['task','department','owner','priority','due','done','blocked','evidence','notes','status'];for(const k of editable)if(Object.prototype.hasOwnProperty.call(proposed,k))next[k]=['done','blocked'].includes(k)?proposed[k]===true:String(proposed[k]??'');if(!['Normal','Alta','Crítica'].includes(next.priority))throw Error('Prioridad inválida');if(next.due&&!/^\d{4}-\d{2}-\d{2}$/.test(next.due))throw Error('Fecha límite inválida');if(!next.due)next.due='2026-11-12';const modified=editable.some(k=>String(next[k])!==String(old[k]));if(modified&&old.verified)next.verified=false;if(role==='admin'&&Object.prototype.hasOwnProperty.call(proposed,'verified'))next.verified=proposed.verified===true;if(!next.done)next.verified=false;const tz=b.getSpreadsheetTimeZone()||Session.getScriptTimeZone()||'Europe/Madrid';if(next.verified&&!old.verified)next.verifiedAt=Utilities.formatDate(new Date(),tz,'yyyy-MM-dd');if(!next.verified)next.verifiedAt='';next.status=next.verified?'Verificado por mí':next.done?'Hecho':(['No empezado','Empezado','En curso'].includes(next.status)?next.status:'No empezado');next.updatedAt=new Date().toISOString();const changed=FIELDS.filter(k=>k!=='updatedAt'&&String(old[k])!==String(next[k]));if(!changed.length)return old;sh.getRange(idx+1,1,1,FIELDS.length).setValues([FIELDS.map(k=>next[k])]);const l=b.getSheetByName('Logs'),now=Utilities.formatDate(new Date(),tz,'yyyy-MM-dd HH:mm:ss');l.getRange(l.getLastRow()+1,1,changed.length,7).setValues(changed.map(k=>[now,role,'EDITAR',next.id,k,String(old[k]),String(next[k])]));return next}finally{lock.releaseLock()}}
function addTask(password,input){if(role_(password)!=='admin')throw Error('Solo administrador puede crear tareas');const lock=LockService.getScriptLock();lock.waitLock(25000);try{const b=db_(),sh=b.getSheetByName('Tareas'),ids=sh.getDataRange().getValues().slice(1).map(r=>Number(r[0])||0),id=Math.max(0,...ids)+1,ob={id,task:String(input?.task||'Nueva tarea'),department:'',owner:'Pendiente',status:'No empezado',priority:'Normal',due:'2026-11-12',done:false,verified:false,verifiedAt:'',blocked:false,evidence:'',notes:'',updatedAt:new Date().toISOString()};sh.appendRow(FIELDS.map(k=>ob[k]));b.getSheetByName('Logs').appendRow([new Date().toISOString(),'admin','CREAR',id,'task','',ob.task]);return ob}finally{lock.releaseLock()}}
