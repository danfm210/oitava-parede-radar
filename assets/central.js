/* Meu painel: itens locais, fontes identificadas e atalhos para ações reais da Central. */
(function(){
'use strict';
const DOCUMENT_STORE='oitava_documentos_salvos_v1',EVENT_STORE='oitava_favoritos_eventos_v1',PLACE_STORE='oitava_favoritos_encontros_v1';
const sourceLabels={pnab_pg:'PNAB · Praia Grande',lpg_pg:'Lei Paulo Gustavo',diario_pg:'Diário Oficial'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function safeURL(value,official=false){try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return '';if(official&&(u.protocol!=='https:'||!(u.hostname==='gov.br'||u.hostname.endsWith('.gov.br')||u.hostname==='plenussistemas.dioenet.com.br')))return '';return u.href;}catch{return '';}}
function readDocuments(raw){
 try{const rows=JSON.parse(raw||'[]');if(!Array.isArray(rows))return [];const unique=new Map();
  for(const row of rows.slice(0,1000)){const url=safeURL(row?.url,true),title=typeof row?.title==='string'?row.title.trim().slice(0,300):'';if(url&&title&&!unique.has(url))unique.set(url,{url,title,source:typeof row.source==='string'?row.source.slice(0,100):'Fonte oficial'});if(unique.size===200)break;}
  return [...unique.values()];
 }catch{return [];}
}
function radarHealth(data,now=Date.now()){
 if(!data||!Array.isArray(data.fontes))return {state:'loading',ok:0,total:0};
 const total=data.fontes.length,ok=data.fontes.filter(s=>s.situacao==='ok').length,stamp=Date.parse(data.generated_at),age=now-stamp;
 if(!Number.isFinite(stamp)||age< -300000)return {state:'date',ok,total};
 if(!total||ok!==total)return {state:'partial',ok,total};
 return {state:age>36*3600000?'old':age>18*3600000?'late':'ready',ok,total};
}
function nextEvent(events,today){
 const valid=day=>/^\d{4}-\d{2}-\d{2}$/.test(day||'')&&Number.isFinite(Date.parse(day+'T12:00:00Z'))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;
 if(!valid(today))return null;
 const rows=[];
 for(const event of Array.isArray(events)?events:[]){
  if(!event||typeof event.title!=='string'||!event.title.trim()||!valid(event.start)||!valid(event.end)||event.end<today||!safeURL(event.url))continue;
  let day=event.start>today?event.start:today;
  for(let n=0;n<7&&day<=event.end;n++){
   if(!Array.isArray(event.weekdays)||!event.weekdays.length||event.weekdays.includes(new Date(day+'T12:00:00Z').getUTCDay())){rows.push({...event,nextDay:day});break;}
   const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);day=d.toISOString().slice(0,10);
  }
 }
 return rows.sort((a,b)=>a.nextDay.localeCompare(b.nextDay)||String(a.title).localeCompare(String(b.title)))[0]||null;
}
function init(){
 const home=document.getElementById('inicio-editorial');if(!home||document.getElementById('meu-painel'))return;
 const section=document.createElement('section');section.id='meu-painel';section.className='op-workspace';section.tabIndex=-1;section.setAttribute('aria-labelledby','opWorkspaceTitle');
 section.innerHTML='<div class="wrap"><div class="op-workspace-heading"><div><span class="op-workspace-kicker">SEU ESPAÇO NA CENTRAL</span><h2 id="opWorkspaceTitle">Organize seu próximo <em>passo.</em></h2><p>Guarde o que importa e retome a pesquisa quando quiser.</p></div><span class="op-local-badge">Neste navegador</span></div><div class="op-workspace-grid"><div class="op-saved-panel"><div class="op-saved-heading"><h3>Meus salvos</h3><a href="#monitor">Explorar o radar <span aria-hidden="true">→</span></a></div><div class="op-saved-tabs" role="tablist" aria-label="Tipo de item salvo">'+[['documents','Documentos'],['events','Eventos'],['places','Lugares']].map(([id,label],i)=>'<button type="button" role="tab" id="opSavedTab-'+id+'" data-saved-tab="'+id+'" aria-controls="opSavedPanel" aria-selected="'+(i===0)+'" tabindex="'+(i===0?'0':'-1')+'">'+label+' <span data-saved-count="'+id+'">0</span></button>').join('')+'</div><div class="op-saved-search" hidden><input type="search" id="opSavedSearch" placeholder="Buscar nos seus salvos" aria-label="Buscar nos seus salvos"></div><div id="opSavedPanel" role="tabpanel" aria-labelledby="opSavedTab-documents" tabindex="0"><div id="opSavedList" class="op-saved-list"></div><button type="button" id="opSavedMore" class="op-saved-more" hidden>Ver todos os salvos</button></div><p class="op-local-note">Salvos são pessoais deste navegador. Use os links para conferir a fonte e os detalhes.</p></div><aside class="op-workspace-aside" aria-label="Verificação e próximos passos"><div id="opHealthCard" class="op-health-card"></div><div id="opNextEvent" class="op-next-event"></div><a class="op-project-start" href="#projetos"><span>Tem um projeto em andamento?</span><strong>Organize seu cadastro <span aria-hidden="true">→</span></strong></a></aside></div><section class="op-workspace-guide"><h3 class="op-inline-info-title">Como aproveitar a Central</h3><ol><li><strong>Pesquise e confira.</strong> Filtre os editais e abra sempre o documento original.</li><li><strong>Salve para retomar.</strong> Separe documentos, eventos e lugares que interessam ao coletivo.</li><li><strong>Combine o próximo passo.</strong> Cadastre o projeto ou prepare um convite para a equipe.</li></ol></section></div>';
 home.after(section);
 const toast=document.createElement('div');toast.id='opCentralToast';toast.className='op-central-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.hidden=true;document.body.appendChild(toast);
 let toastTimer;
 const say=text=>{clearTimeout(toastTimer);toast.textContent=text;toast.hidden=false;toastTimer=setTimeout(()=>toast.hidden=true,3400);};
 const get=key=>{try{return localStorage.getItem(key);}catch{return null;}};
 const ids=key=>{try{const x=JSON.parse(get(key)||'[]');return Array.isArray(x)?[...new Set(x.filter(s=>typeof s==='string'&&s.length<180).slice(0,500))]:[];}catch{return [];}};
 let documents=readDocuments(get(DOCUMENT_STORE)),active='documents',query='',expanded=false,lastMarkup=null;
 const cache=window.OitavaCentralData||{};let radar=cache.radar||null,agenda=cache.agenda||null,places=cache.places||null,radarError=Boolean(cache.radarError);
 const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
 const dayLabel=day=>Number.isFinite(Date.parse(day+'T12:00:00Z'))?new Date(day+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'short'}):'Data a confirmar';
 function itemRows(){
  const eventMap=new Map((agenda?.events||[]).map(e=>[e.id,e])),placeMap=new Map((places||agenda?.places||[]).map(p=>[p.id,p]));
  return {documents:documents.map(d=>({...d,id:d.url,kind:'documents',meta:d.source||'Fonte oficial'})),events:ids(EVENT_STORE).map(id=>{const e=eventMap.get(id);return e?{id,kind:'events',title:e.title,url:safeURL(e.url),meta:e.city+' · '+dayLabel(e.start)+(e.end<today()?' · Encerrado':''),ended:e.end<today()}:{id,kind:'events',title:'Evento salvo',meta:'Programação indisponível nesta consulta',url:'',unavailable:true};}),places:ids(PLACE_STORE).map(id=>{const p=placeMap.get(id);return p?{id,kind:'places',title:p.name,url:safeURL(p.url),meta:p.city+' · '+(p.custom?'Seu ponto personalizado':'Ponto de encontro'),place:p}:{id,kind:'places',title:'Lugar salvo',meta:'Cadastro indisponível nesta consulta',url:'',unavailable:true};})};
 }
 function rowHTML(row){
  const primary=row.kind==='documents'?'<a href="'+esc(row.url)+'" target="_blank" rel="noopener noreferrer">Abrir documento <span aria-hidden="true">→</span></a>':row.kind==='events'&&!row.ended&&!row.unavailable?'<button type="button" data-open-saved-event="'+esc(row.id)+'">Criar convite <span aria-hidden="true">→</span></button>':row.kind==='places'&&!row.unavailable?'<a href="#reunioes" data-find-place="'+esc(row.id)+'">Ver lugar <span aria-hidden="true">→</span></a>':row.url?'<a href="'+esc(row.url)+'" target="_blank" rel="noopener noreferrer">Consultar fonte <span aria-hidden="true">→</span></a>':'<span class="op-saved-unavailable">Consulte novamente mais tarde.</span>';
  return '<article class="op-saved-card"><div><span class="op-saved-meta">'+esc(row.meta)+'</span><h4>'+esc(row.title)+'</h4></div><div class="op-saved-actions">'+primary+'<button type="button" data-remove-saved="'+esc(row.id)+'" data-saved-kind="'+row.kind+'" aria-label="Remover dos salvos: '+esc(row.title)+'">Remover</button></div></article>';
 }
 function render(){
  const rows=itemRows();Object.keys(rows).forEach(kind=>{const node=section.querySelector('[data-saved-count="'+kind+'"]');if(node.textContent!==String(rows[kind].length))node.textContent=String(rows[kind].length);});
  const all=rows[active],visible=all.filter(row=>normalize(row.title+' '+row.meta).includes(normalize(query)));
  const search=section.querySelector('.op-saved-search');search.hidden=all.length<=4&&!query;
  let markup;
  if(!all.length){const defs={documents:['Separe as leituras importantes.','Use “Salvar” ao lado de um documento do radar para encontrá-lo aqui.','#monitor','Explorar documentos'],events:['Escolha seu próximo programa.','Salve eventos pelo coração da Agenda e retome aqui para criar um convite.','#agenda','Explorar a agenda'],places:['Guarde bons pontos de encontro.','Salve um café, espaço cultural ou seu próprio ponto na seção Reuniões.','#reunioes','Encontrar um lugar']};const [title,desc,href,label]=defs[active];markup='<div class="op-saved-empty"><span aria-hidden="true">☆</span><h4>'+title+'</h4><p>'+desc+'</p><a href="'+href+'">'+label+' <span aria-hidden="true">→</span></a></div>';}
  else markup=visible.length?(expanded?visible:visible.slice(0,3)).map(rowHTML).join(''):'<p class="op-saved-no-results">Nenhum salvo para esta busca. Tente outro termo.</p>';
  const list=document.getElementById('opSavedList');if(lastMarkup!==markup){list.innerHTML=markup;lastMarkup=markup;}
  const more=document.getElementById('opSavedMore');more.hidden=visible.length<=3;more.textContent=expanded?'Mostrar menos':'Ver todos ('+visible.length+')';
  document.querySelectorAll('[data-doc-save]').forEach(button=>{const saved=documents.some(d=>d.url===safeURL(button.dataset.docSave,true));button.setAttribute('aria-pressed',String(saved));const label=saved?'★ Salvo':'☆ Salvar';if(button.textContent!==label)button.textContent=label;const title=button.closest('.radar-entry')?.querySelector('.radar-entry-title')?.textContent||'documento';button.setAttribute('aria-label',(saved?'Remover dos salvos: ':'Salvar documento: ')+title);});
 }
 function renderHealth(){
  const health=radarHealth(radar),labels={loading:['Aguardando o radar','Os dados aparecem após o carregamento das fontes.'],date:['Confira a verificação','A data do relatório precisa ser conferida.'],partial:['Fontes precisam de atenção','Algumas fontes não foram verificadas com sucesso.'],late:['Verificação atrasada','A rotina ultrapassou 18 horas. Consulte as fontes oficiais enquanto a próxima leitura não chega.'],old:['Radar desatualizado','A última verificação ultrapassou 36 horas. Consulte os portais oficiais para novidades recentes.'],ready:['Radar atualizado','Verificado por rotina automática. Resultados exigem leitura da fonte.']};
  const [label,desc]=radarError?['Radar indisponível','Não foi possível atualizar o relatório nesta consulta.']:labels[health.state];
  const stamp=radar?.generated_at&&Number.isFinite(Date.parse(radar.generated_at))?new Date(radar.generated_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}):'';
  const card=document.getElementById('opHealthCard');card.className='op-health-card is-'+(radarError?'error':health.state);
  card.innerHTML='<span class="op-workspace-kicker">FONTES & VERIFICAÇÃO</span><h3><i aria-hidden="true" class="'+(!radarError&&health.state==='ready'?'is-ready':'')+'"></i>'+label+'</h3><p>'+desc+'</p>'+(health.total?'<strong>'+health.ok+' de '+health.total+' fontes verificadas</strong>':'')+(stamp?'<small>'+stamp+' · Brasília</small>':'')+'<a href="#monitor">Conferir o radar <span aria-hidden="true">→</span></a>';
  const next=nextEvent(agenda?.events,today());
  document.getElementById('opNextEvent').innerHTML=next?'<span class="op-workspace-kicker">NA AGENDA</span><strong>'+esc(next.title)+'</strong><span>'+esc(dayLabel(next.nextDay)+' · '+next.city)+'</span><a href="#agenda" data-find-event="'+esc(next.id)+'">Ver programação <span aria-hidden="true">→</span></a>':'<span class="op-workspace-kicker">AMPLIE O REPERTÓRIO</span><strong>O próximo encontro pode começar com um filme.</strong><a href="#agenda">Explorar a agenda cultural <span aria-hidden="true">→</span></a>';
 }
 let queued=false;
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render();});}
 window.addEventListener('op:radar-ready',e=>{radar=e.detail;radarError=false;renderHealth();schedule();});
 window.addEventListener('op:radar-error',()=>{radarError=true;renderHealth();});
 window.addEventListener('op:agenda-ready',e=>{agenda=e.detail;renderHealth();schedule();});
 window.addEventListener('op:places-ready',e=>{places=e.detail.places;schedule();});
 window.addEventListener('op:savedchange',schedule);
 window.addEventListener('storage',e=>{if(e.key===DOCUMENT_STORE)documents=readDocuments(e.newValue);if([DOCUMENT_STORE,EVENT_STORE,PLACE_STORE,'oitava_locais_personalizados_v1'].includes(e.key))schedule();});
 new MutationObserver(records=>{if(records.some(r=>r.type==='childList'))schedule();}).observe(document.getElementById('monitorPublications'),{childList:true,subtree:true});
 const tablist=section.querySelector('[role="tablist"]');
 function select(kind,focus=false){active=kind;query='';expanded=false;document.getElementById('opSavedSearch').value='';tablist.querySelectorAll('[role="tab"]').forEach(b=>{const chosen=b.dataset.savedTab===kind;b.setAttribute('aria-selected',String(chosen));b.tabIndex=chosen?0:-1;if(chosen&&focus)b.focus();});document.getElementById('opSavedPanel').setAttribute('aria-labelledby','opSavedTab-'+kind);render();}
 tablist.addEventListener('click',e=>{const b=e.target.closest('[data-saved-tab]');if(b)select(b.dataset.savedTab);});
 tablist.addEventListener('keydown',e=>{const keys=['documents','events','places'],i=keys.indexOf(active);if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();select(keys[e.key==='Home'?0:e.key==='End'?2:e.key==='ArrowRight'?(i+1)%3:(i+2)%3],true);});
 document.getElementById('opSavedSearch').addEventListener('input',e=>{query=e.target.value;expanded=false;render();});
 document.getElementById('opSavedMore').addEventListener('click',()=>{expanded=!expanded;render();});
 function saveDocuments(next){try{localStorage.setItem(DOCUMENT_STORE,JSON.stringify(next));documents=next;render();return true;}catch{say('Não foi possível salvar neste navegador. Verifique o espaço e as permissões.');return false;}}
 document.addEventListener('click',e=>{
  const save=e.target.closest('[data-doc-save]');
  if(save){const url=safeURL(save.dataset.docSave,true);if(!url)return;const exists=documents.some(d=>d.url===url);if(exists){if(saveDocuments(documents.filter(d=>d.url!==url)))say('Documento removido dos seus salvos.');}else{const doc=radar?.publicacoes?.find(d=>safeURL(d.url,true)===url);if(!doc?.titulo){say('Aguarde o carregamento do radar para salvar.');return;}if(documents.length>=200){say('Você chegou a 200 documentos salvos. Remova algum para guardar outro.');return;}if(saveDocuments([{url,title:String(doc.titulo).slice(0,300),source:sourceLabels[doc.fonte]||'Fonte oficial'},...documents]))say('Documento salvo no Meu painel.');}return;}
  const remove=e.target.closest('[data-remove-saved]');if(remove){const {savedKind:kind,removeSaved:id}=remove.dataset;if(kind==='documents'){if(!saveDocuments(documents.filter(d=>d.url!==id)))return;say('Documento removido dos seus salvos.');}else window.dispatchEvent(new CustomEvent('op:saved-remove',{detail:{kind,id}}));requestAnimationFrame(()=>{if(!remove.isConnected)document.getElementById('opSavedTab-'+active).focus({preventScroll:true});});return;}
  const open=e.target.closest('[data-open-saved-event]');if(open){window.dispatchEvent(new CustomEvent('op:open-event',{detail:{id:open.dataset.openSavedEvent,trigger:open}}));return;}
  const place=e.target.closest('[data-find-place]');if(place){const row=(places||agenda?.places||[]).find(p=>p.id===place.dataset.findPlace);if(row){document.getElementById('opMeetReset').click();const input=document.getElementById('opMeetSearch');input.value=row.name;input.dispatchEvent(new Event('input',{bubbles:true}));}return;}
  const event=e.target.closest('[data-find-event]');if(event){const row=agenda?.events?.find(p=>p.id===event.dataset.findEvent);if(row){document.getElementById('opEventReset').click();const input=document.getElementById('opEventSearch');input.value=row.title;input.dispatchEvent(new Event('input',{bubbles:true}));}return;}
 });
 renderHealth();render();
 compactBrand('marcas','Fontes e programas','Conheça os programas e confira os portais de origem.');
 compactBrand('acervo','Acervo da Oitava Parede','Fotografias, bastidores e histórias do coletivo.');
 settleInitialAnchor();
}
function compactBrand(id,title,description){
 const section=document.getElementById(id),wrap=section?.querySelector('.wrap');if(!wrap||section.dataset.compactReady)return;
 if(wrap.textContent.trim().length<=1000&&wrap.querySelectorAll('.ed-program').length<=3){section.dataset.compactReady='true';section.classList.add('op-brand-inline');return;}
 section.dataset.compactReady='true';section.classList.add('op-brand-compact');
 const details=document.createElement('details');details.className='op-brand-disclosure';details.open=location.hash==='#'+id;
 const body=document.createElement('div');body.className='op-brand-body';while(wrap.firstChild)body.appendChild(wrap.firstChild);
 const summary=document.createElement('summary');summary.innerHTML='<span><strong>'+title+'</strong><small>'+description+'</small></span><span class="op-brand-toggle" aria-hidden="true">+</span>';details.append(summary,body);wrap.append(details);
 const open=()=>{if(location.hash==='#'+id)details.open=true;};window.addEventListener('hashchange',open);
 document.addEventListener('click',e=>{if(e.target.closest('a')?.getAttribute('href')==='#'+id)details.open=true;});
}
function settleInitialAnchor(){
 const id=location.hash.slice(1),target=id&&document.getElementById(id);if(!target||typeof ResizeObserver==='undefined')return;
 let stopped=false,frame=0;const align=()=>{if(stopped||frame)return;frame=requestAnimationFrame(()=>{frame=0;if(!stopped&&location.hash.slice(1)===id)target.scrollIntoView({behavior:'instant',block:'start'});});};
 const observer=new ResizeObserver(align),stop=()=>{stopped=true;observer.disconnect();if(frame)cancelAnimationFrame(frame);['pointerdown','touchstart','wheel','keydown','click'].forEach(name=>document.removeEventListener(name,stop,true));window.removeEventListener('hashchange',stop);};
 observer.observe(document.querySelector('main'));observer.observe(document.querySelector('.op-header-v2'));
 ['pointerdown','touchstart','wheel','keydown','click'].forEach(name=>document.addEventListener(name,stop,{capture:true,passive:true}));window.addEventListener('hashchange',stop,{once:true});document.fonts?.ready.then(align);align();
}
const api={readDocuments,safeURL,radarHealth,nextEvent};
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
})();
