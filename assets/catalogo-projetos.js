/* Catálogo: título oficial preservado, com cadastros locais identificados pela origem. */
(function(){
'use strict';
const STORE='oitavaparede_web_projects_v1';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const personKey=s=>['giovanna barbosa','giovana barbosa','giovanna barbosa arantes'].includes(norm(s))?'giovanna barbosa arantes':norm(s);
function officialURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname.endsWith('.gov.br')||u.hostname==='plenussistemas.dioenet.com.br');}catch{return false;}}
function yearFor(row){
 const explicit=Number(row.ano_edital||row.year);
 if(Number.isInteger(explicit)&&explicit>=1900&&explicit<=2100)return String(explicit);
 const value=String(row.edital||row.programa||row.program||'');
 const match=value.match(/\/(20\d{2})\b/)||value.match(/\b(20\d{2})\b/);
 return match?match[1]:'';
}
function groupYears(rows,currentYear){
 const groups=new Map();
 for(const row of rows){const year=yearFor(row);if(!groups.has(year))groups.set(year,[]);groups.get(year).push(row);}
 return Array.from(groups,([year,items])=>({year,items,label:!year?'Ano não informado':year===String(currentYear)?year+' · Ano atual':Number(year)<Number(currentYear)?year+' · Histórico':year+' · Próximo ciclo'})).sort((a,b)=>Number(b.year||0)-Number(a.year||0));
}
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
function localRows(rows){return (Array.isArray(rows)?rows:[]).filter(r=>r&&typeof r.id==='string'&&typeof r.title==='string'&&r.title.trim()).map(r=>({id:r.id,titulo:r.title,proponente:r.proponent||'Não informado',programa:r.program||'Edital não informado',protocolo:r.protocol||'',situacao_na_fonte:r.status||'',notes:r.notes||'',url:r.url||'',ano_edital:r.year||r.ano_edital||null,origin:'local'}));}
function filterRows(rows,{query='',person='',origin='todos',year=''}={}){
 const words=norm(query).split(' ').filter(Boolean);
 return rows.filter(r=>(!year||(year==='sem-ano'?!yearFor(r):yearFor(r)===String(year)))&&(origin==='todos'||r.origin===origin)&&(!person||personKey(r.proponente)===personKey(person))&&words.every(w=>norm([r.titulo,r.proponente,r.programa,r.protocolo,r.edital].join(' ')).includes(w)));
}
function init(){
 const node=document.getElementById('catalogo-projetos');if(!node)return;
 const currentYear=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric'});
 const year=document.getElementById('opCatalogYear');
 let selectedYear=currentYear;
 let data={projetos:[],pessoas_monitoradas:[]},origin='todos',loading=true,error=false;
 const query=document.getElementById('opCatalogSearch'),person=document.getElementById('opCatalogPerson'),grid=document.getElementById('opCatalogGrid'),count=document.getElementById('opCatalogCount'),status=document.getElementById('opCatalogStatus');
 function readLocals(){try{return localRows(JSON.parse(localStorage.getItem(STORE)||'[]'));}catch{return [];}}
 function options(rows){
  const previous=person.value,values=new Map();
  for(const name of [...(data.pessoas_monitoradas||[]),...rows.map(r=>r.proponente)])if(name&&name!=='Não informado')values.set(personKey(name),personKey(name)==='giovanna barbosa arantes'?'Giovanna Barbosa Arantes':name);
  person.innerHTML='<option value="">Todas as pessoas</option>'+Array.from(values).sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');
  if(values.has(previous))person.value=previous;
  const years=Array.from(new Set([currentYear,...rows.map(yearFor).filter(Boolean)])).sort((a,b)=>Number(b)-Number(a));
  year.innerHTML='<option value="">Todos os anos</option>'+years.map(value=>'<option value="'+value+'">'+value+(value===currentYear?' · Ano atual':Number(value)<Number(currentYear)?' · Histórico':' · Próximo ciclo')+'</option>').join('')+(rows.some(r=>!yearFor(r))?'<option value="sem-ano">Ano não informado</option>':'');
  year.value=selectedYear;

 }
 function sourceLink(r){const url=new URL(r.fonte_url);url.hash='page='+r.pagina;return esc(url.href);}
 function officialCard(r){
  const progress=r.acompanhamento;
  const completed=progress?.aprovacao==='aprovado'&&progress?.execucao==='concluido';
  const currentState=completed?'<p class="op-catalog-completed">Aprovado e concluído</p><p class="op-catalog-local-note">Atualização informada pelo coletivo.</p>':'<p class="op-catalog-snapshot">'+esc(r.etapa)+' · '+esc(r.situacao_na_fonte)+'</p>';

  return '<article class="op-catalog-card"><span class="op-catalog-origin">Fonte oficial · nome na publicação</span><h4>'+esc(r.titulo)+'</h4><p class="op-catalog-person"><span>Proponente na publicação</span><strong>'+esc(r.proponente)+'</strong></p><p class="op-catalog-program">'+esc(r.programa)+'</p>'+currentState+'<details><summary>Ver inscrição e fonte'+(r.evidencias.length>1?'s ('+r.evidencias.length+')':'')+'</summary>'+r.evidencias.map(e=>'<div class="op-catalog-evidence"><p><strong>Campo PROJETO:</strong> '+esc(e.titulo)+'</p><p><strong>Situação neste documento:</strong> '+esc(e.etapa)+' · '+esc(e.situacao_na_fonte)+'</p>'+(e.protocolo?'<p><strong>Protocolo:</strong> '+esc(e.protocolo)+'</p>':'')+'<p>'+esc(e.fonte_titulo)+' · página '+e.pagina+'</p><p>Nome conferido em '+esc(String(e.verificado_em).slice(0,10).split('-').reverse().join('/'))+'</p><a target="_blank" rel="noopener noreferrer" href="'+sourceLink(e)+'">Abrir documento oficial ↗</a></div>').join('')+'</details></article>';
 }
 function localCard(r){
  const statuses={aguardando:'Aguardando resultado',inscrito:'Inscrito',habilitado:'Habilitado',classificado:'Classificado',contemplado:'Contemplado',indeferido:'Indeferido',recurso:'Em recurso',revogado:'Afetado por revogação','nao-contemplado':'Não contemplado'};
  return '<article class="op-catalog-card is-local"><span class="op-catalog-origin">Cadastro neste navegador</span><h4>'+esc(r.titulo)+'</h4><p class="op-catalog-person"><span>Responsável informado</span><strong>'+esc(r.proponente)+'</strong></p><p class="op-catalog-program">'+esc(r.programa)+'</p>'+'<p class="op-catalog-local-note">Situação informada: '+esc(statuses[r.situacao_na_fonte]||r.situacao_na_fonte||'Não informada')+'</p>'+(r.protocolo?'<p><strong>Protocolo:</strong> '+esc(r.protocolo)+'</p>':'')+(r.notes?'<p class="op-catalog-local-note">'+esc(r.notes)+'</p>':'')+'<p class="op-catalog-local-note">Nome informado no cadastro. A origem local não comprova inscrição em edital.</p><a href="#projetos" class="op-catalog-local-link">Abrir meus cadastros ↓</a></article>';
 }
 function render(){
  const official=groupOfficial(data.projetos),locals=readLocals(),all=[...official,...locals];options(all);
  const filtered=filterRows(all,{query:query.value,person:person.value,origin,year:selectedYear});
  count.textContent=filtered.length+' registro'+(filtered.length===1?'':'s')+' na seleção · '+filtered.filter(r=>r.origin==='oficial').length+' da fonte oficial · '+filtered.filter(r=>r.origin==='local').length+' neste navegador';
  grid.innerHTML=filtered.length?groupYears(filtered,currentYear).map(group=>'<section class="op-catalog-year-group" aria-label="'+esc(group.label)+'"><div class="op-catalog-year-heading"><h3>'+esc(group.label)+'</h3><span>'+group.items.length+' registro'+(group.items.length===1?'':'s')+'</span></div><div class="op-catalog-year-grid">'+group.items.map(r=>r.origin==='oficial'?officialCard(r):localCard(r)).join('')+'</div></section>').join(''):'<div class="op-catalog-empty"><strong>'+(loading?'Carregando as fontes…':'Nenhum projeto nesta seleção.')+'</strong><p>'+(loading?'Os cadastros deste navegador continuam disponíveis.':'Escolha outro ano ou limpe os filtros. A ausência nesta seleção não prova que não houve inscrição.')+'</p></div>';
  status.textContent=error?'Não foi possível atualizar as fontes oficiais agora. Tente novamente; seus cadastros locais continuam disponíveis.':loading?'Consultando o catálogo oficial…':'Organização pelo ano do edital, não pelo ano em que o documento foi publicado. Situações das fontes e atualizações informadas pelo coletivo são identificadas separadamente.';
  document.getElementById('opCatalogRetry').hidden=!error;
  node.querySelectorAll('[data-catalog-origin]').forEach(b=>{const active=b.dataset.catalogOrigin===origin;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active)document.getElementById('opCatalogPanel').setAttribute('aria-labelledby',b.id);});
 }
 async function load(){loading=true;error=false;render();try{const r=await fetch('./dados/projetos-oficiais.json',{cache:'no-store'});if(!r.ok)throw Error();const value=await r.json();if(value.schema!==1||!Array.isArray(value.projetos))throw Error();data=value;}catch{error=true;}loading=false;render();}
 query.addEventListener('input',render);person.addEventListener('change',render);year.addEventListener('change',()=>{selectedYear=year.value;render();});
 document.getElementById('opCatalogReset').addEventListener('click',()=>{query.value='';person.value='';origin='todos';selectedYear=currentYear;render();});
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
if(typeof module==='object'&&module.exports)module.exports={norm,personKey,officialURL,groupOfficial,localRows,filterRows,yearFor,groupYears};
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();}
})();
