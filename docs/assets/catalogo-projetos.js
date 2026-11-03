/* Catálogo: título oficial preservado, com cadastros locais identificados pela origem. */
(function(){
'use strict';
const STORE='oitavaparede_web_projects_v1';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const personKey=s=>['giovanna barbosa','giovana barbosa','giovanna barbosa arantes'].includes(norm(s))?'giovanna barbosa arantes':norm(s);
function officialURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname.endsWith('.gov.br')||u.hostname==='plenussistemas.dioenet.com.br');}catch{return false;}}
function groupOfficial(rows){
 const groups=new Map();
 for(const row of Array.isArray(rows)?rows:[]){
  if(!row||typeof row.titulo!=='string'||!row.titulo.trim()||typeof row.proponente!=='string'||!officialURL(row.fonte_url)||!Number.isInteger(row.pagina)||row.pagina<1||!['documental','campos_rotulados'].includes(row.conferencia))continue;
  const key=[norm(row.titulo),personKey(row.proponente),norm(row.edital||row.programa)].join('|');
  if(!groups.has(key))groups.set(key,{...row,origin:'oficial',evidencias:[]});
  const group=groups.get(key);
  if(!group.evidencias.some(e=>e.fonte_url===row.fonte_url&&e.pagina===row.pagina))group.evidencias.push(row);
 }
 return Array.from(groups.values());
}
function localRows(rows){return (Array.isArray(rows)?rows:[]).filter(r=>r&&typeof r.id==='string'&&typeof r.title==='string'&&r.title.trim()).map(r=>({id:r.id,titulo:r.title,proponente:r.proponent||'Não informado',programa:r.program||'Edital não informado',protocolo:r.protocol||'',situacao_na_fonte:r.status||'',notes:r.notes||'',url:r.url||'',origin:'local'}));}
function filterRows(rows,{query='',person='',origin='todos'}={}){
 const words=norm(query).split(' ').filter(Boolean);
 return rows.filter(r=>(origin==='todos'||r.origin===origin)&&(!person||personKey(r.proponente)===personKey(person))&&words.every(w=>norm([r.titulo,r.proponente,r.programa,r.protocolo,r.edital].join(' ')).includes(w)));
}
function init(){
 const node=document.getElementById('catalogo-projetos');if(!node)return;
 let data={projetos:[],pessoas_monitoradas:[]},origin='todos',loading=true,error=false;
 const query=document.getElementById('opCatalogSearch'),person=document.getElementById('opCatalogPerson'),grid=document.getElementById('opCatalogGrid'),count=document.getElementById('opCatalogCount'),status=document.getElementById('opCatalogStatus');
 function readLocals(){try{return localRows(JSON.parse(localStorage.getItem(STORE)||'[]'));}catch{return [];}}
 function options(rows){
  const previous=person.value,values=new Map();
  for(const name of [...(data.pessoas_monitoradas||[]),...rows.map(r=>r.proponente)])if(name&&name!=='Não informado')values.set(personKey(name),personKey(name)==='giovanna barbosa arantes'?'Giovanna Barbosa Arantes':name);
  person.innerHTML='<option value="">Todas as pessoas</option>'+Array.from(values).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');
  if(values.has(previous))person.value=previous;
 }
 function sourceLink(r){const url=new URL(r.fonte_url);url.hash='page='+r.pagina;return esc(url.href);}
 function officialCard(r){
  return '<article class="op-catalog-card"><span class="op-catalog-origin">Fonte oficial · nome na publicação</span><h3>'+esc(r.titulo)+'</h3><p class="op-catalog-person"><span>Proponente na publicação</span><strong>'+esc(r.proponente)+'</strong></p><p class="op-catalog-program">'+esc(r.programa)+'</p><p class="op-catalog-snapshot">'+esc(r.etapa)+' · '+esc(r.situacao_na_fonte)+'</p><details><summary>Ver inscrição e fonte'+(r.evidencias.length>1?'s ('+r.evidencias.length+')':'')+'</summary>'+r.evidencias.map(e=>'<div class="op-catalog-evidence"><p><strong>Campo PROJETO:</strong> '+esc(e.titulo)+'</p>'+(e.protocolo?'<p><strong>Protocolo:</strong> '+esc(e.protocolo)+'</p>':'')+'<p>'+esc(e.fonte_titulo)+' · página '+e.pagina+'</p><p>Nome conferido em '+esc(String(e.verificado_em).slice(0,10).split('-').reverse().join('/'))+'</p><a target="_blank" rel="noopener noreferrer" href="'+sourceLink(e)+'">Abrir documento oficial ↗</a></div>').join('')+'</details></article>';
 }
 function localCard(r){
  const statuses={aguardando:'Aguardando resultado',inscrito:'Inscrito',habilitado:'Habilitado',classificado:'Classificado',contemplado:'Contemplado',indeferido:'Indeferido',recurso:'Em recurso',revogado:'Afetado por revogação','nao-contemplado':'Não contemplado'};
  return '<article class="op-catalog-card is-local"><span class="op-catalog-origin">Cadastro neste navegador</span><h3>'+esc(r.titulo)+'</h3><p class="op-catalog-person"><span>Responsável informado</span><strong>'+esc(r.proponente)+'</strong></p><p class="op-catalog-program">'+esc(r.programa)+'</p>'+'<p class="op-catalog-local-note">Situação informada: '+esc(statuses[r.situacao_na_fonte]||r.situacao_na_fonte||'Não informada')+'</p>'+(r.protocolo?'<p><strong>Protocolo:</strong> '+esc(r.protocolo)+'</p>':'')+(r.notes?'<p class="op-catalog-local-note">'+esc(r.notes)+'</p>':'')+'<p class="op-catalog-local-note">Nome informado no cadastro. A origem local não comprova inscrição em edital.</p><a href="#projetos" class="op-catalog-local-link">Abrir meus cadastros ↓</a></article>';
 }
 function render(){
  const official=groupOfficial(data.projetos),locals=readLocals(),all=[...official,...locals];options(all);
  const filtered=filterRows(all,{query:query.value,person:person.value,origin});
  count.textContent=filtered.length+' registro'+(filtered.length===1?'':'s')+' na seleção · '+official.length+' da fonte oficial · '+locals.length+' neste navegador';
  grid.innerHTML=filtered.length?filtered.map(r=>r.origin==='oficial'?officialCard(r):localCard(r)).join(''):'<div class="op-catalog-empty"><strong>'+(loading?'Carregando as fontes…':'Nenhum projeto nesta seleção.')+'</strong><p>'+(loading?'Os cadastros deste navegador continuam disponíveis.':'Limpe os filtros ou consulte o Radar. A ausência neste catálogo não prova que não houve inscrição.')+'</p></div>';
  status.textContent=error?'Não foi possível atualizar as fontes oficiais agora. Tente novamente; seus cadastros locais continuam disponíveis.':loading?'Consultando o catálogo oficial…':'Os títulos oficiais mantêm a grafia do campo PROJETO. A situação mostrada pertence ao documento indicado; confira retificações e atos posteriores.';
  document.getElementById('opCatalogRetry').hidden=!error;
  node.querySelectorAll('[data-catalog-origin]').forEach(b=>{const active=b.dataset.catalogOrigin===origin;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active)document.getElementById('opCatalogPanel').setAttribute('aria-labelledby',b.id);});
 }
 async function load(){loading=true;error=false;render();try{const r=await fetch('./dados/projetos-oficiais.json',{cache:'no-store'});if(!r.ok)throw Error();const value=await r.json();if(value.schema!==1||!Array.isArray(value.projetos))throw Error();data=value;}catch{error=true;}loading=false;render();}
 query.addEventListener('input',render);person.addEventListener('change',render);
 document.getElementById('opCatalogReset').addEventListener('click',()=>{query.value='';person.value='';origin='todos';render();});
 node.querySelector('[role="tablist"]').addEventListener('click',e=>{const b=e.target.closest('[data-catalog-origin]');if(b){origin=b.dataset.catalogOrigin;render();}});
 node.querySelector('[role="tablist"]').addEventListener('keydown',e=>{
  const tabs=Array.from(node.querySelectorAll('[data-catalog-origin]')),i=tabs.indexOf(e.target);let next;
  if(e.key==='ArrowRight')next=(i+1)%tabs.length;else if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;
  e.preventDefault();origin=tabs[next].dataset.catalogOrigin;render();tabs[next].focus();
 });
 document.getElementById('opCatalogRetry').addEventListener('click',load);
 window.addEventListener('oitava:projetos-atualizados',render);window.addEventListener('storage',e=>{if(e.key===STORE)render();});
 load();
}
if(typeof module==='object'&&module.exports)module.exports={norm,personKey,officialURL,groupOfficial,localRows,filterRows};
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();}
})();
