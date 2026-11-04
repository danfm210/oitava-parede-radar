/* iCalendar: encontro escolhido pelo visitante, sem envio a serviços externos. */
(function(root){
'use strict';
const safeURL=value=>{try{const u=new URL(String(value||''));return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}};
function validDay(day){return /^\d{4}-\d{2}-\d{2}$/.test(day||'')&&Number.isFinite(Date.parse(day+'T12:00:00Z'))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;}
function escapeText(value){return String(value??'').replace(/\r\n?/g,'\n').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g,'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
function foldLine(line){
 const encoder=new TextEncoder();let current='',bytes=0;const lines=[];
 for(const char of line){const size=encoder.encode(char).length;if(bytes+size>75){lines.push(current);current=' ';bytes=1;}current+=char;bytes+=size;}
 lines.push(current);return lines.join('\r\n');
}
const compact=date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
function brasiliaInstant(day,time){
 if(!validDay(day)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time||''))return null;
 const [y,m,d]=day.split('-').map(Number),[h,min]=time.split(':').map(Number),nominal=Date.UTC(y,m-1,d,h,min);
 const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 let stamp=nominal;
 for(let i=0;i<4;i++){const p=Object.fromEntries(formatter.formatToParts(new Date(stamp)).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));const delta=nominal-Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);if(delta===0)return new Date(stamp);stamp+=delta;}
 return null;
}
function buildCalendar({id,title,date,time='',location='',description='',url=''}={},now=new Date()){
 if(!validDay(date)||!String(title||'').trim()||!safeURL(url)||!Number.isFinite(now.getTime()))return '';
 const uid=String(id||'encontro').replace(/[^a-z0-9_-]/gi,'').slice(0,100)||'encontro';
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Oitava Parede//Encontros//PT-BR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:oitava-'+uid+'-'+date.replaceAll('-','')+'-'+(time.replace(':','')||'dia')+'@oitavaparede.local','DTSTAMP:'+compact(now)];
 if(time){const instant=brasiliaInstant(date,time);if(!instant)return '';lines.push('DTSTART:'+compact(instant));}
 else{const end=new Date(date+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+1);lines.push('DTSTART;VALUE=DATE:'+date.replaceAll('-',''),'DTEND;VALUE=DATE:'+end.toISOString().slice(0,10).replaceAll('-',''));}
 lines.push('SUMMARY:'+escapeText('Oitava Parede · '+title),'LOCATION:'+escapeText(location),'DESCRIPTION:'+escapeText(description),'URL:'+safeURL(url),'TRANSP:TRANSPARENT','END:VEVENT','END:VCALENDAR');
 return lines.map(foldLine).join('\r\n')+'\r\n';
}
const api={buildCalendar,brasiliaInstant,escapeText,foldLine};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.OitavaCalendar=api;
})(typeof window!=='undefined'?window:null);
