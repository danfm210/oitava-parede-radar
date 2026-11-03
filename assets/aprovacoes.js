/* Resultados confirmados por conferência documental; não infere aprovação de menções. */
(function(){
'use strict';
const PEOPLE=['Giovanna Barbosa Arantes','Giovanna Barbosa','Giovana Barbosa','Oscar Stefanno Fornari','Matheus de Castro Santos Soares','Daniel Fernandes Melquiades dos Santos','Julia Xavier de Freitas','Enzo Santana Borges','Julia Xavier','Enzo Borges','Oitava Parede'];
const RESULTS={contemplado:'Projeto contemplado',selecionado:'Projeto selecionado no resultado final',aprovado:'Projeto aprovado'};
const STAGES={resultado_final:'Resultado final',homologacao:'Homologação'};
const SEEN='oitava_aprovacoes_vistas_v1';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function officialURL(value){
 try{
  const u=new URL(value),h=u.hostname.toLowerCase();
  return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(
   h==='gov.br'||h.endsWith('.gov.br')||h==='plenussistemas.dioenet.com.br');
 }catch{return false;}
}
function validDate(date){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const parsed=new Date(date+'T12:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===date;
}
function eligible(record,today){
 if(!record||record.confirmado!==true||record.conferencia!=='documental')return false;
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(record.id||'')||!Number.isInteger(record.revisao)||record.revisao<1)return false;
 if(!Object.hasOwn(RESULTS,record.resultado)||!Object.hasOwn(STAGES,record.etapa))return false;
 if(!PEOPLE.some(p=>norm(p)===norm(record.proponente)))return false;
 for(const key of ['projeto','programa','explicacao','trecho_fonte'])if(typeof record[key]!=='string'||!record[key].trim())return false;
 return officialURL(record.fonte_url)&&validDate(record.publicado_em)&&validDate(record.conferido_em)&&record.publicado_em<=today&&record.conferido_em<=today&&record.conferido_em>=record.publicado_em;
}
function confirmedResults(data,today){
 if(!data||data.schema!==1||!Array.isArray(data.aprovacoes))return [];
 const unique=new Map();
 for(const record of data.aprovacoes){
  if(!record||typeof record.id!=='string'||!Number.isInteger(record.revisao))continue;
  const previous=unique.get(record.id);
  if(!previous||previous.revisao<record.revisao)unique.set(record.id,record);
  else if(previous.revisao===record.revisao&&JSON.stringify(previous)!==JSON.stringify(record))unique.set(record.id,{...record,confirmado:false});
 }
 return Array.from(unique.values()).filter(r=>eligible(r,today)).sort((a,b)=>b.publicado_em.localeCompare(a.publicado_em));
}
function revisionKey(record){return record.id+':'+record.revisao;}
function readSeen(){try{const v=JSON.parse(sessionStorage.getItem(SEEN)||'[]');return new Set(Array.isArray(v)?v.filter(x=>typeof x==='string'):[]);}catch{return new Set();}}
function formatDate(value){return value.split('-').reverse().join('/');}
async function init(){
 if(document.getElementById('opApprovalDialog'))return;
 let rows;
 try{
  const response=await fetch('./dados/aprovacoes.json',{cache:'no-store'});
  if(!response.ok)return;
  rows=confirmedResults(await response.json(),new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'}));
 }catch{return;}
 if(!rows.length)return;
 const note=document.querySelector('#visao .guide-note');
 if(note)note.textContent='Há resultados positivos confirmados no cadastro. Use “Ver resultados confirmados” no Radar para consultar a etapa e o documento oficial de cada projeto.';
 const dialog=document.createElement('dialog');dialog.id='opApprovalDialog';dialog.className='op-approval-dialog';
 dialog.setAttribute('aria-modal','true');
 dialog.setAttribute('aria-labelledby','opApprovalTitle');dialog.setAttribute('aria-describedby','opApprovalIntro');
 dialog.innerHTML='<div class="op-approval-top"><span>OITAVA PAREDE · RESULTADO OFICIAL</span><button type="button" class="op-approval-close" aria-label="Fechar aviso de aprovação">×</button></div>'+
 '<div class="op-approval-content"><div class="op-approval-seal" aria-hidden="true">✓</div><h2 id="opApprovalTitle">Tem notícia boa para a Oitava!</h2>'+
 '<p id="opApprovalIntro">'+(rows.length===1?'Um projeto teve resultado positivo confirmado em fonte oficial.':'Projetos tiveram resultados positivos confirmados em fontes oficiais.')+'</p>'+
 '<div class="op-approval-list">'+rows.map(r=>'<article class="op-approval-item"><span class="op-approval-status">'+esc(RESULTS[r.resultado])+'</span><h3>'+esc(r.projeto)+'</h3><p class="op-approval-person">'+esc(r.proponente)+'</p><dl><div><dt>Programa / edital</dt><dd>'+esc(r.programa)+'</dd></div><div><dt>Etapa confirmada</dt><dd>'+esc(STAGES[r.etapa])+'</dd></div><div><dt>Publicação oficial</dt><dd>'+formatDate(r.publicado_em)+'</dd></div></dl><p class="op-approval-explanation">'+esc(r.explicacao)+'</p><blockquote>'+esc(r.trecho_fonte)+'</blockquote><a class="op-approval-source" target="_blank" rel="noopener noreferrer" href="'+esc(r.fonte_url)+'">Consultar a fonte oficial ↗</a></article>').join('')+
 '</div><div class="op-approval-footer"><span>Conferência documental registrada. O aviso descreve a etapa publicada.</span><button type="button" class="op-approval-understood" autofocus>Entendi, continuar no site</button></div></div>';
 document.body.appendChild(dialog);
 const button=document.createElement('button');button.type='button';button.className='op-approval-reopen';button.textContent='Ver resultados confirmados ('+rows.length+')';
 document.querySelector('#monitor .monitor-header')?.appendChild(button);
 let previousOverflow='';
 function open(){if(!dialog.open&&typeof dialog.showModal==='function'){previousOverflow=document.body.style.overflow;dialog.showModal();document.body.style.overflow='hidden';}}
 button.addEventListener('click',open);
 dialog.querySelector('.op-approval-close').addEventListener('click',()=>dialog.close());
 dialog.querySelector('.op-approval-understood').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{
  document.body.style.overflow=previousOverflow;
  const seen=readSeen();rows.forEach(r=>seen.add(revisionKey(r)));
  try{sessionStorage.setItem(SEEN,JSON.stringify(Array.from(seen).slice(-300)));}catch{}
 });
 const seen=readSeen();if(rows.every(r=>seen.has(revisionKey(r))))return;
 let attempts=0;
 function present(){
  if(++attempts>12)return;
  const busy=document.hidden||document.activeElement?.matches('input,select,textarea')||Array.from(document.querySelectorAll('dialog[open],[aria-modal="true"]')).some(el=>el!==dialog&&el.getClientRects().length);
  if(busy){window.setTimeout(present,3000);return;}
  open();
 }
 window.setTimeout(present,1500);
}
const api={PEOPLE,RESULTS,STAGES,officialURL,validDate,eligible,confirmedResults,revisionKey};
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();}
})();
