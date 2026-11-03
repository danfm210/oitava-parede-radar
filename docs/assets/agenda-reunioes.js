/* Oitava Parede · agenda cultural e pontos de encontro. Dados editoriais de fontes públicas. */
(function(root){
'use strict';
const STORAGE_EVENTS='oitava_favoritos_eventos_v1', STORAGE_PLACES='oitava_favoritos_encontros_v1';
const labelCity={'Santos':'Santos','São Vicente':'São Vicente','Praia Grande':'Praia Grande','São Paulo':'São Paulo'};
const catInfo={
 audiovisual:{label:'Audiovisual',glyph:'▶',color:'violet'},
 musica:{label:'Música',glyph:'♫',color:'indigo'},
 gastronomia:{label:'Gastronomia',glyph:'✦',color:'orange'},
 cultura:{label:'Arte & cultura',glyph:'✳',color:'teal'}
};
const kindInfo={
 trabalho:{label:'Reunião & foco',glyph:'▤',color:'indigo'},
 cafe:{label:'Café & ideias',glyph:'◉',color:'mustard'},
 social:{label:'Bar & conversa',glyph:'✺',color:'coral'}
};
const clean=(x)=>String(x==null?'':x);
const esc=(v)=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=(s)=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const dateAtNoon=(s)=>new Date(s+'T12:00:00');
const fmtDate=(s,short=false)=>dateAtNoon(s).toLocaleDateString('pt-BR',{day:'2-digit',month:short?'short':'long'});
const storage={
 get(key){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return new Set(Array.isArray(x)?x:[])}catch{return new Set()}},
 set(key,vals){try{localStorage.setItem(key,JSON.stringify([...vals]))}catch{}}
};
let data={events:[],places:[],sources:[],curated_at:null};
let eventCity='Todas',eventCat='todos',eventSearch='',eventSavedOnly=false;
let meetCity='Todas',meetKind='todos',meetSearch='',meetSavedOnly=false;
let savedEvents=new Set(),savedPlaces=new Set();
function upcomingEvents(events,today){const day=today||new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});return events.filter(e=>e&&e.end>=day).sort((a,b)=>a.start.localeCompare(b.start)||a.title.localeCompare(b.title));}
function filterEvents(events,city,cat,query,savedOnly,saved){
 return events.filter(e=>(city==='Todas'||e.city===city)&&(cat==='todos'||e.category===cat)
 &&(!query||norm(e.title+' '+e.venue+' '+e.description+' '+e.city).includes(norm(query)))
 &&(!savedOnly||saved.has(e.id)));
}
function filterPlaces(places,city,kind,query,savedOnly,saved){
 return places.filter(p=>(city==='Todas'||p.city===city)&&(kind==='todos'||p.type===kind)
 &&(!query||norm(p.name+' '+p.address+' '+p.best+' '+p.why).includes(norm(query)))
 &&(!savedOnly||saved.has(p.id)));
}
function calendarLabel(e){
 const a=fmtDate(e.start,true),b=fmtDate(e.end,true);
 return e.start===e.end?a:a+' — '+b;
}
function sourceFooter(e){
 return '<span class="op-source"><span class="op-source-dot"></span>'+esc(e.source)+'</span>';
}
function eventCard(e){
 const t=catInfo[e.category]||catInfo.cultura;
 const saved=savedEvents.has(e.id);
 const label=esc(calendarLabel(e));
 const item='<article class="op-event-card" data-category="'+esc(t.color)+'">'+
  '<div class="op-event-cover op-tone-'+esc(t.color)+'">'+
   '<div class="op-cover-shape" aria-hidden="true"><i></i><i></i><i></i></div>'+
   '<span class="op-event-tag">'+esc(t.glyph)+' &nbsp;'+esc(t.label)+'</span>'+
   (e.featured?'<span class="op-feature-label">Em destaque</span>':'')+
   '<div class="op-cover-bottom"><span>'+esc(e.city)+'</span><strong>'+label+'</strong></div>'+
  '</div>'+
  '<div class="op-card-body">'+
   '<div class="op-event-venue">'+esc(e.venue)+'</div>'+
   '<h3>'+esc(e.title)+'</h3>'+
   '<p>'+esc(e.description)+'</p>'+
   '<div class="op-event-meta"><span>◷ '+esc(e.time||'Consultar horários')+'</span><span>◈ '+esc(e.price||'Consultar')+'</span></div>'+
   '<div class="op-card-actions">'+
    '<a class="op-primary-link" target="_blank" rel="noopener noreferrer" href="'+esc(e.url)+'">Programação <span aria-hidden="true">↗</span></a>'+
    '<button type="button" class="op-icon-button '+(saved?'is-saved':'')+'" data-favevent="'+esc(e.id)+'" aria-pressed="'+saved+'" title="'+(saved?'Remover dos salvos':'Salvar evento')+'" aria-label="'+(saved?'Remover evento salvo':'Salvar evento')+'">'+(saved?'♥':'♡')+'</button>'+
   '</div>'+sourceFooter(e)+'</div></article>';
 return item;
}
function mapUrl(p){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.name+', '+p.address);}
function photoBlock(p){
 const fallback='<div class="op-photo-fallback" aria-hidden="true"><span>'+esc(kindInfo[p.type]?.glyph||'✦')+'</span><small>OITAVA • ENCONTROS</small></div>';
 if(!p.photo)return fallback;
 return '<img loading="lazy" decoding="async" class="op-place-img" src="'+esc(p.photo)+'" alt="Fotografia do ambiente: '+esc(p.name)+'" referrerpolicy="no-referrer" onerror="this.hidden=true;this.nextElementSibling.hidden=false"/>'+
  '<div hidden>'+fallback+'</div>';
}
function placeCard(p){
 const kind=kindInfo[p.type]||kindInfo.cafe;
 const saved=savedPlaces.has(p.id);
 return '<article class="op-place-card" data-kind="'+esc(kind.color)+'">'+
   '<div class="op-photo-holder">'+photoBlock(p)+
    '<div class="op-place-overlay"><span>'+esc(kind.glyph)+' '+esc(kind.label)+'</span><span>'+esc(p.city)+'</span></div></div>'+
   '<div class="op-place-body">'+
    '<div class="op-place-kicker">'+esc(p.style)+'</div>'+
    '<h3>'+esc(p.name)+'</h3><p class="op-place-desc">'+esc(p.why)+'</p>'+
    '<div class="op-place-label">Bom para</div><p class="op-place-best">'+esc(p.best)+'</p>'+
    '<div class="op-place-address"><span aria-hidden="true">⌖</span> '+esc(p.address)+'</div>'+
    '<div class="op-place-tags">'+(p.tags||[]).slice(0,3).map(v=>'<span>'+esc(v)+'</span>').join('')+'</div>'+
    '<div class="op-place-watch">'+esc(p.watch)+'</div>'+
    '<div class="op-place-actions">'+
     '<a class="op-map-button" href="'+esc(mapUrl(p))+'" target="_blank" rel="noopener noreferrer">Ver no mapa ↗</a>'+
     '<button type="button" class="op-copy-button" data-invite="'+esc(p.id)+'">Copiar convite</button>'+
     '<button type="button" class="op-icon-button '+(saved?'is-saved':'')+'" data-favplace="'+esc(p.id)+'" aria-pressed="'+saved+'" aria-label="'+(saved?'Remover local salvo':'Salvar local')+'">'+(saved?'♥':'♡')+'</button>'+
    '</div>'+
    (p.credit&&p.credit_url?'<div class="op-photo-credit"><a href="'+esc(p.credit_url)+'" target="_blank" rel="noopener noreferrer">'+esc(p.credit)+' ↗</a></div>':'')+
   '</div></article>';
}
function toast(msg){const el=document.getElementById('opToast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200)}
function syncToggles(container,selector,value){container?.querySelectorAll(selector).forEach(el=>{const selected=el.dataset.value===value;el.classList.toggle('active',selected);el.setAttribute('aria-pressed',String(selected))})}
function renderEvents(){
 const all=upcomingEvents(data.events);
 const filtered=filterEvents(all,eventCity,eventCat,eventSearch,eventSavedOnly,savedEvents);
 const count=document.getElementById('opEventCount');if(count)count.textContent=filtered.length+' evento'+(filtered.length===1?'':'s')+' na seleção';
 const target=document.getElementById('opEventGrid');if(!target)return;
 target.innerHTML=filtered.length?filtered.map(eventCard).join(''):
 '<div class="op-noresults"><strong>Nenhum evento encontrado</strong><p>Altere a região ou categoria, ou explore as agendas de referência abaixo.</p></div>';
 const tabs=document.getElementById('opEventCities');syncToggles(tabs,'[data-value]',eventCity);
 const categories=document.getElementById('opEventCategories');syncToggles(categories,'[data-value]',eventCat);
 const savedButton=document.getElementById('opEventSaved');if(savedButton){savedButton.classList.toggle('active',eventSavedOnly);savedButton.setAttribute('aria-pressed',String(eventSavedOnly));savedButton.textContent='♡ Salvos ('+savedEvents.size+')'}
}
function renderPlaces(){
 const filtered=filterPlaces(data.places,meetCity,meetKind,meetSearch,meetSavedOnly,savedPlaces);
 const target=document.getElementById('opPlaceGrid');if(!target)return;
 target.innerHTML=filtered.length?filtered.map(placeCard).join(''):
 '<div class="op-noresults"><strong>Sem locais para estes filtros</strong><p>Experimente outro estilo de encontro ou cidade.</p></div>';
 const count=document.getElementById('opPlaceCount');if(count)count.textContent=filtered.length+' sugestão'+(filtered.length===1?'':'ões');
 syncToggles(document.getElementById('opMeetCities'),'[data-value]',meetCity);
 syncToggles(document.getElementById('opMeetKinds'),'[data-value]',meetKind);
 const savedButton=document.getElementById('opMeetSaved');if(savedButton){savedButton.classList.toggle('active',meetSavedOnly);savedButton.setAttribute('aria-pressed',String(meetSavedOnly));savedButton.textContent='♡ Salvos ('+savedPlaces.size+')'}
}
function renderSources(){
 const root=document.getElementById('opEventSources');if(!root)return;
 root.innerHTML=(data.sources||[]).map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer" class="op-portal-link">'+
 '<span class="op-portal-icon">↗</span><span><strong>'+esc(s.title)+'</strong><small>'+esc(s.city)+' · '+esc(s.kind)+'</small></span></a>').join('');
 const stamp=document.getElementById('opAgendaCurated');
 if(stamp&&data.curated_at){const [y,m,d]=data.curated_at.split('-');stamp.textContent='Curadoria inicial: '+d+'/'+m+'/'+y+' · datas conferidas nas fontes indicadas'}
}
function copyText(txt){
 if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function')return navigator.clipboard.writeText(txt);
 const textarea=document.createElement('textarea');textarea.value=txt;document.body.appendChild(textarea);textarea.select();document.execCommand('copy');textarea.remove();return Promise.resolve();
}
function hook(){
 document.getElementById('opEventCities')?.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(!b)return;eventCity=b.dataset.value;renderEvents();});
 document.getElementById('opEventCategories')?.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(!b)return;eventCat=b.dataset.value;renderEvents();});
 document.getElementById('opEventSearch')?.addEventListener('input',e=>{eventSearch=e.target.value;renderEvents();});
 document.getElementById('opEventSaved')?.addEventListener('click',()=>{eventSavedOnly=!eventSavedOnly;renderEvents();});
 document.getElementById('opEventGrid')?.addEventListener('click',e=>{const b=e.target.closest('[data-favevent]');if(!b)return;const id=b.dataset.favevent;savedEvents.has(id)?savedEvents.delete(id):savedEvents.add(id);storage.set(STORAGE_EVENTS,savedEvents);renderEvents();});
 document.getElementById('opMeetCities')?.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(!b)return;meetCity=b.dataset.value;renderPlaces();});
 document.getElementById('opMeetKinds')?.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(!b)return;meetKind=b.dataset.value;renderPlaces();});
 document.getElementById('opMeetSearch')?.addEventListener('input',e=>{meetSearch=e.target.value;renderPlaces();});
 document.getElementById('opMeetSaved')?.addEventListener('click',()=>{meetSavedOnly=!meetSavedOnly;renderPlaces();});
 document.getElementById('opPlaceGrid')?.addEventListener('click',e=>{
  const f=e.target.closest('[data-favplace]');if(f){const id=f.dataset.favplace;savedPlaces.has(id)?savedPlaces.delete(id):savedPlaces.add(id);storage.set(STORAGE_PLACES,savedPlaces);renderPlaces();return;}
  const invite=e.target.closest('[data-invite]');if(!invite)return;
  const p=data.places.find(p=>p.id===invite.dataset.invite);if(!p)return;
  const txt='Oitava Parede · Ideia de encontro\\n📍 '+p.name+' ('+p.city+')\\n'+p.address+'\\nMapa: '+mapUrl(p)+'\\nVamos combinar dia e horário?';
  copyText(txt.replaceAll('\\n','\n')).then(()=>toast('Convite copiado. Agora é só enviar no grupo!')).catch(()=>toast('Não foi possível copiar. Use o mapa para compartilhar o local.'));
 });
}

function buildUI(){
 if(document.getElementById('agenda'))return;
 const css=document.createElement('link');css.rel='stylesheet';css.href='./assets/agenda-reunioes.css';document.head.appendChild(css);
 const nav=document.getElementById('nav');
 if(nav&&!nav.querySelector('[href="#agenda"]')){
  const before=nav.querySelector('[href="#notificacoes"]');
  if(before)before.insertAdjacentHTML('beforebegin','<a href="#agenda">Agenda cultural</a><a href="#reunioes">Reuniões</a>');
  if(before)before.textContent='Avisos';
  nav.querySelectorAll('a[href="#agenda"],a[href="#reunioes"]').forEach(a=>a.addEventListener('click',()=>{
   nav.classList.remove('open');
   const menu=document.getElementById('menuButton');
   if(menu)menu.setAttribute('aria-expanded','false');
  }));
  const edit=nav.querySelector('[href="#oportunidades"]');if(edit)edit.textContent='Editais';
 }
 const place=document.getElementById('notificacoes');if(!place)return;
 const buttons=(items,cls)=>items.map(([v,label],i)=>'<button type="button" class="op-chip '+(cls||'')+(i===0?' active':'')+'" data-value="'+esc(v)+'" aria-pressed="'+(i===0)+'">'+label+'</button>').join('');
 const cityEvents=buttons([['Todas','Todas as cidades'],['Santos','Santos'],['São Vicente','São Vicente'],['Praia Grande','Praia Grande'],['São Paulo','São Paulo']],'');
 const catEvents=buttons([['todos','Todas as experiências'],['audiovisual','▶ Audiovisual & cinema'],['musica','♫ Música & shows'],['gastronomia','✦ Gastronomia'],['cultura','✳ Arte & cultura']],'category-active');
 const cityPlaces=buttons([['Todas','Toda a Baixada'],['Santos','Santos'],['São Vicente','São Vicente'],['Praia Grande','Praia Grande']],'');
 const kindPlaces=buttons([['todos','Todos os encontros'],['trabalho','▤ Reunião & foco'],['cafe','◉ Café & brainstorm'],['social','✺ Bar & confraternização']],'category-active');
 const markup=[
 '<section class="op-section op-agenda" id="agenda" aria-label="Agenda cultural da Baixada e São Paulo"><div class="wrap">',
 '<div class="op-eyebrow">Para criar, circular e sair juntos</div>',
 '<div class="op-header"><div><h2>Agenda <span style="color:#c29329">cultural</span> da equipe</h2>',
 '<p>Festivais de cinema, shows, arte, oficinas e gastronomia na Baixada Santista e na capital. Um espaço para ampliar repertório, encontrar referências, fazer networking e combinar um rolê em grupo.</p></div>',
 '<div class="op-header-badge"><strong>04</strong><span>temas para explorar</span></div></div>',
 '<div class="op-event-controls" aria-label="Filtros da agenda"><div class="op-controls-row">',
 '<div class="op-chipset" id="opEventCities" aria-label="Cidades">'+cityEvents+'</div>',
 '<div class="op-control-right"><input id="opEventSearch" type="search" class="op-text-search" placeholder="Buscar evento ou local" aria-label="Pesquisar evento">',
 '<button id="opEventSaved" class="op-saved" type="button" aria-pressed="false">♡ Salvos</button></div></div>',
 '<div class="op-chipset" id="opEventCategories" aria-label="Categorias">'+catEvents+'</div>',
 '<div class="op-control-foot"><strong id="opEventCount" aria-live="polite">Carregando programação...</strong><span id="opAgendaCurated">Confirme ingressos e horários na fonte.</span></div></div>',
 '<div class="op-event-grid" id="opEventGrid" aria-live="polite"><div class="op-noresults">Carregando eventos...</div></div>',
 '<div class="op-agenda-bottom"><div class="op-agenda-bottom-head"><h3>Onde descobrir outras programações</h3>',
 '<span>Portais e instituições para consultar a agenda mais recente</span></div>',
 '<div class="op-portals" id="opEventSources">Carregando fontes...</div></div>',
 '<p class="op-meeting-footnote">Esta é uma seleção editorial. Eventos encerrados são ocultados por data, mas novos anúncios não entram automaticamente: consulte as fontes acima para a programação mais recente. Horários, preços e sessões podem mudar.</p>',
 '</div></section>',
 '<section class="op-section op-meetings" id="reunioes" aria-label="Reuniões e pontos de encontro"><div class="wrap">',
 '<div class="op-eyebrow">Pontos de encontro · Santos, São Vicente e Praia Grande</div>',
 '<div class="op-header"><div><h2>Reuniões, café <span style="color:#c29329">& boas ideias.</span></h2>',
 '<p>Onde desenvolver um projeto, trocar referências ou tomar uma cerveja depois da entrega. Cafés, coworkings e bares, com fotos, perfis de ambiente e links diretos para chegar.</p></div>',
 '<div class="op-header-badge"><strong>03</strong><span>cidades da Baixada</span></div></div>',
 '<div class="op-meet-controls" aria-label="Filtros dos locais"><div class="op-controls-row">',
 '<div class="op-chipset" id="opMeetCities" aria-label="Cidades">'+cityPlaces+'</div>',
 '<div class="op-control-right"><input id="opMeetSearch" class="op-text-search" type="search" placeholder="Café, bar ou bairro" aria-label="Pesquisar local">',
 '<button id="opMeetSaved" type="button" class="op-saved" aria-pressed="false">♡ Salvos</button></div></div>',
 '<div class="op-chipset" id="opMeetKinds" aria-label="Tipo de encontro">'+kindPlaces+'</div>',
 '<div class="op-control-foot"><strong id="opPlaceCount" aria-live="polite">Carregando locais...</strong><span>Salve os favoritos e copie um convite para o grupo.</span></div></div>',
 '<div class="op-place-grid" id="opPlaceGrid" aria-live="polite"><div class="op-noresults">Carregando sugestões...</div></div>',
 '<p class="op-meeting-footnote">Locais independentes, sem parceria com a Oitava Parede. Antes de reunir a equipe, confirme horário, lotação, consumo mínimo, Wi-Fi, reserva e se há espaço para conversas longas.</p>',
 '</div></section><div id="opToast" class="op-toast" role="status" aria-live="polite"></div>'
 ].join('');
 place.insertAdjacentHTML('beforebegin',markup);
 try{
  const tentacle=getComputedStyle(document.getElementById('notificacoes'),'::before').backgroundImage;
  if(tentacle&&tentacle!=='none')document.documentElement.style.setProperty('--tentacle-pattern',tentacle);
 }catch(err){}
 if(location.hash==='#agenda'||location.hash==='#reunioes'){
  document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'auto',block:'start'});
 }
}

async function init(){
 buildUI();
 const src=document.getElementById('opEventGrid');if(!src)return;
 savedEvents=storage.get(STORAGE_EVENTS);savedPlaces=storage.get(STORAGE_PLACES);
 hook();
 try{
  const resp=await fetch('./dados/agenda.json?t='+Date.now(),{cache:'no-store'});
  if(!resp.ok)throw new Error('Agenda indisponível');
  const json=await resp.json();
  if(json.schema!==1||!Array.isArray(json.events)||!Array.isArray(json.places))throw new Error('Formato inválido');
  data=json;
  renderEvents();renderPlaces();renderSources();
 }catch(e){
  src.innerHTML='<div class="op-noresults"><strong>Não foi possível carregar a agenda.</strong><p>Utilize os portais de programação indicados na seção.</p></div>';
  const pl=document.getElementById('opPlaceGrid');
  if(pl)pl.innerHTML='<div class="op-noresults"><strong>Não foi possível carregar os locais.</strong><p>Recarregue a página.</p></div>';
  console.warn('[agenda]',e);
 }
}
const api={upcomingEvents,filterEvents,filterPlaces,catInfo,kindInfo};
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined')if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:null);
