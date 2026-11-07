/* Oitava Parede · agenda cultural e pontos de encontro. Dados editoriais de fontes públicas. */
(function(root){
'use strict';
const STORAGE_EVENTS='oitava_favoritos_eventos_v1', STORAGE_PLACES='oitava_favoritos_encontros_v1', STORAGE_CUSTOM='oitava_locais_personalizados_v1';
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
 social:{label:'Bar & conversa',glyph:'✺',color:'coral'},
 cultural:{label:'Cultura & ar livre',glyph:'✳',color:'teal'}
};
const clean=(x)=>String(x==null?'':x);
const esc=(v)=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=(s)=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const dateAtNoon=(s)=>new Date(s+'T12:00:00');
const fmtDate=(s,short=false)=>dateAtNoon(s).toLocaleDateString('pt-BR',{day:'2-digit',month:short?'short':'long'});
const storage={
 get(key){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return new Set(Array.isArray(x)?x.filter(v=>typeof v==='string'&&v.length<180).slice(0,500):[])}catch{return new Set()}},
 set(key,vals){try{localStorage.setItem(key,JSON.stringify([...vals]));return true;}catch{return false;}}
};
let data={events:[],places:[],sources:[],festivals:[],curated_at:null};
let customPlaces=[],editingPlaceId=null,placeTrigger=null;
let eventCity='Todas',eventCat='todos',eventSearch='',eventSavedOnly=false,eventPeriod='all';
let currentInviteEvent=null,inviteTrigger=null;
let meetCity='Todas',meetKind='todos',meetSearch='',meetSavedOnly=false;
let savedEvents=new Set(),savedPlaces=new Set();
function safeURL(value){try{const u=new URL(clean(value).trim());return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
function customPlace(value,id){
 if(!value||typeof value!=='object')return null;
 const text=(key,max)=>typeof value[key]==='string'?value[key].trim().slice(0,max):'';
 const name=text('name',100),city=text('city',80),address=text('address',220),type=text('type',30);
 if(!name||!city||!address||!Object.hasOwn(kindInfo,type)||!/^custom-[a-z0-9-]+$/.test(id||''))return null;
 return {id,name,city,address,type,why:text('why',500),best:text('best',160)||'Encontro personalizado',watch:text('watch',350)||'Confirme disponibilidade e condições com o local.',url:safeURL(text('url',1000)),style:'Personalizado · neste navegador',tags:['Seu cadastro'],custom:true};
}
function readCustomPlaces(raw){
 try{const rows=JSON.parse(raw||'[]');if(!Array.isArray(rows))return [];
 const unique=new Map();for(const row of rows){const p=customPlace(row,row?.id);if(p&&!unique.has(p.id))unique.set(p.id,p);}return [...unique.values()];
 }catch{return [];}
}
function allPlaces(){return [...customPlaces,...data.places];}
function notifySaved(){window.dispatchEvent(new CustomEvent('op:savedchange',{detail:{events:[...savedEvents],places:[...savedPlaces]}}));}
function updateSaved(kind,id,removeOnly=false){
 if(!['events','places'].includes(kind)||typeof id!=='string'||id.length>=180)return false;
 const current=kind==='events'?savedEvents:savedPlaces,next=new Set(current);
 if(removeOnly)next.delete(id);else next.has(id)?next.delete(id):next.add(id);
 if(!storage.set(kind==='events'?STORAGE_EVENTS:STORAGE_PLACES,next)){toast('Não foi possível salvar neste navegador. Verifique as permissões e o espaço disponível.');return false;}
 if(kind==='events')savedEvents=next;else savedPlaces=next;
 notifySaved();if(kind==='events')renderEvents();else renderPlaces();return true;
}

function persistCustom(rows){try{localStorage.setItem(STORAGE_CUSTOM,JSON.stringify(rows));customPlaces=rows;return true;}catch{toast('Não foi possível salvar neste navegador. Verifique o espaço e as permissões de armazenamento.');return false;}}
function festivalState(f,today){
 const day=today||new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
 if(!f.start||!f.end)return 'Datas a confirmar';
 return f.end<day?'Edição encerrada':f.start>day?'Em breve':'Em andamento';
}
const todayBR=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
function validDay(day){return typeof day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T12:00:00Z'))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;}
function addDays(day,n){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function periodBounds(period,today=todayBR()){
 if(!validDay(today)||period==='all')return null;
 if(period==='today')return [today,today];
 if(period==='week')return [today,addDays(today,6)];
 if(period==='weekend'){const day=new Date(today+'T12:00:00Z').getUTCDay(),start=addDays(today,day===0?-1:6-day);return [start,addDays(start,1)];}
 return null;
}
function eventRunsOn(event,day){return !Array.isArray(event.weekdays)||!event.weekdays.length||event.weekdays.includes(new Date(day+'T12:00:00Z').getUTCDay());}
function eventInPeriod(event,period,today){
 const bounds=periodBounds(period,today);if(!bounds)return true;
 const start=event.start>bounds[0]?event.start:bounds[0],end=event.end<bounds[1]?event.end:bounds[1];
 for(let day=start;day<=end;day=addDays(day,1))if(eventRunsOn(event,day))return true;
 return false;
}
function defaultInviteDate(event,today=todayBR()){
 for(let day=today>=event.start&&today<=event.end?today:event.start;day<=event.end;day=addDays(day,1))if(eventRunsOn(event,day))return day;
 return '';
}
function eventInvitation(event,{date,time='',meeting='',note=''}={}){
 if(!event||!validDay(date)||date<event.start||date>event.end||!eventRunsOn(event,date)||!safeURL(event.url)||time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return '';
 const day=date.split('-').reverse().join('/'),lines=['Oitava Parede · convite cultural','','Vamos juntos ao '+clean(event.title)+'?','','📅 Nosso encontro: '+day+(time?' às '+time:' · horário a combinar'),'📍 '+(clean(meeting).trim().slice(0,220)||clean(event.venue))+' · '+clean(event.city)];
 if(event.start!==event.end)lines.push('Período do evento: '+event.start.split('-').reverse().join('/')+' a '+event.end.split('-').reverse().join('/'));
 if(event.price)lines.push('Entrada anunciada: '+clean(event.price));
 if(clean(note).trim())lines.push('',clean(note).trim().slice(0,300));
 lines.push('','Programação e fonte: '+safeURL(event.url),'Confira a sessão e a disponibilidade antes de ir.');
 return lines.join('\n');
}
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
function eventDetails(e){
 if(!Array.isArray(e.highlights)||!e.highlights.length)return '';
 return '<details class="op-event-details"><summary>Informações e destaques</summary><ul>'+e.highlights.map(h=>'<li><strong>'+esc(h.title)+'</strong><span>'+esc(h.when)+' · '+esc(h.venue)+'</span></li>').join('')+'</ul>'+(Array.isArray(e.references)?e.references.filter(r=>safeURL(r.url)).map(r=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(safeURL(r.url))+'">'+esc(r.title)+' →</a>').join(''):safeURL(e.details_url)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(safeURL(e.details_url))+'">Consultar programação detalhada →</a>':'')+'</details>';
}
function eventCard(e){
 const t=catInfo[e.category]||catInfo.cultura;
 const saved=savedEvents.has(e.id);
 const label=esc(calendarLabel(e));
 const item='<article class="op-event-card" data-category="'+esc(t.color)+'">'+
  '<div class="op-event-cover op-tone-'+esc(t.color)+(e.image?' has-photo':'')+'">'+
   (e.image?'<img class="op-event-photo" loading="lazy" decoding="async" src="'+esc(e.image)+'" alt="'+esc(e.imageType==='local'?'Foto do local do evento: '+e.venue:'Divulgação do evento '+e.title)+'" referrerpolicy="no-referrer" onerror="this.hidden=true;this.parentElement.classList.remove(\'has-photo\')"/>':'')+
   (e.image?'<span class="op-photo-kind">'+(e.imageType==='local'?'Foto do local':'Divulgação')+'</span>':'')+
   '<div class="op-cover-shape" aria-hidden="true"><i></i><i></i><i></i></div>'+
   '<span class="op-event-tag">'+esc(t.glyph)+' &nbsp;'+esc(t.label)+'</span>'+
   (e.featured?'<span class="op-feature-label">Em destaque</span>':'')+
   '<div class="op-cover-bottom"><span>'+esc(e.city)+'</span><strong>'+label+'</strong></div>'+
  '</div>'+
  '<div class="op-card-body">'+
   '<div class="op-event-venue">'+esc(e.venue)+'</div>'+
   '<h3>'+esc(e.title)+'</h3>'+
   '<p>'+esc(e.description)+'</p>'+
   '<div class="op-event-meta"><span>◷ '+esc(e.time||'Consultar horários')+'</span><span>◈ '+esc(e.price||'Consultar')+'</span></div>'+eventDetails(e)+
   '<div class="op-card-actions">'+
    '<a class="op-primary-link" target="_blank" rel="noopener noreferrer" href="'+esc(e.url)+'">Ver programação <span aria-hidden="true">→</span></a>'+
    '<button type="button" class="op-icon-button '+(saved?'is-saved':'')+'" data-favevent="'+esc(e.id)+'" aria-pressed="'+saved+'" title="'+(saved?'Remover dos salvos':'Salvar evento')+'" aria-label="'+(saved?'Remover evento salvo: ':'Salvar evento: ')+esc(e.title)+'">'+(saved?'♥':'♡')+'</button>'+
    '<button type="button" class="op-event-invite" data-invite-event="'+esc(e.id)+'" aria-label="Criar convite para '+esc(e.title)+'">Criar convite <span aria-hidden="true">→</span></button>'+
   '</div>'+sourceFooter(e)+
   (e.image&&e.imageSource?'<a class="op-image-credit" target="_blank" rel="noopener noreferrer" href="'+esc(e.imageSource)+'">'+esc(e.imageCredit||'Imagem da fonte')+' →</a>':'')+'</div></article>';
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
     '<a class="op-map-button" href="'+esc(mapUrl(p))+'" target="_blank" rel="noopener noreferrer">Ver no mapa →</a>'+
     '<button type="button" class="op-copy-button" data-invite="'+esc(p.id)+'">Copiar convite</button>'+
     '<button type="button" class="op-icon-button '+(saved?'is-saved':'')+'" data-favplace="'+esc(p.id)+'" aria-pressed="'+saved+'" aria-label="'+(saved?'Remover local salvo':'Salvar local')+'">'+(saved?'♥':'♡')+'</button>'+
    '</div>'+
    (safeURL(p.url)?'<a class="op-place-source" href="'+esc(safeURL(p.url))+'" target="_blank" rel="noopener noreferrer">Site / informações do local →</a>':'')+
    (p.custom?'<div class="op-custom-actions"><button type="button" data-edit-place="'+esc(p.id)+'">Editar ponto</button><button type="button" data-delete-place="'+esc(p.id)+'">Excluir ponto</button></div>':'')+
    (p.credit&&p.credit_url?'<div class="op-photo-credit"><a href="'+esc(p.credit_url)+'" target="_blank" rel="noopener noreferrer">'+esc(p.credit)+' →</a></div>':'')+
   '</div></article>';
}
function toast(msg){const el=document.getElementById('opToast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200)}
function syncToggles(container,selector,value){container?.querySelectorAll(selector).forEach(el=>{const selected=el.dataset.value===value;el.classList.toggle('active',selected);el.setAttribute('aria-pressed',String(selected))})}
function renderEvents(){
 const all=upcomingEvents(data.events);
 const filtered=filterEvents(all,eventCity,eventCat,eventSearch,eventSavedOnly,savedEvents).filter(e=>eventInPeriod(e,eventPeriod));
 const count=document.getElementById('opEventCount');if(count)count.textContent=filtered.length+' evento'+(filtered.length===1?'':'s')+' na seleção';
 const target=document.getElementById('opEventGrid');if(!target)return;
 if(filtered.length){
  if(root.OitavaCompacto)root.OitavaCompacto.renderCollection(target,filtered,eventCard,{kind:'events',unit:'eventos',key:JSON.stringify([eventCity,eventCat,eventSearch,eventSavedOnly,eventPeriod]),expanded:Boolean(eventSearch)});
  else target.innerHTML=filtered.map(eventCard).join('');
 }else target.innerHTML='<div class="op-noresults"><strong>Nenhum evento nesta seleção</strong><p>Experimente outro período, cidade ou categoria.</p><button type="button" class="op-saved" data-reset-events>Limpar filtros da agenda</button></div>';
 const tabs=document.getElementById('opEventCities');syncToggles(tabs,'[data-value]',eventCity);
 const categories=document.getElementById('opEventCategories');syncToggles(categories,'[data-value]',eventCat);
 const savedButton=document.getElementById('opEventSaved');if(savedButton){savedButton.classList.toggle('active',eventSavedOnly);savedButton.setAttribute('aria-pressed',String(eventSavedOnly));savedButton.textContent='♡ Salvos ('+savedEvents.size+')'}
 const summary=document.getElementById('opEventSelection');if(summary)summary.textContent=[eventCity==='Todas'?'Todas as cidades':eventCity,catInfo[eventCat]?.label||'Todas as categorias',{'all':'Toda a agenda','today':'Hoje','week':'Próximos 7 dias','weekend':'Fim de semana'}[eventPeriod],eventSavedOnly?'Apenas salvos':'',eventSearch?'Busca: “'+eventSearch+'”':''].filter(Boolean).join(' · ');
}
function renderPlaces(){
 window.OitavaCentralData=window.OitavaCentralData||{};window.OitavaCentralData.places=allPlaces();
 window.dispatchEvent(new CustomEvent('op:places-ready',{detail:{places:allPlaces()}}));
 const places=allPlaces(),cities=[...new Set(['Santos','São Vicente','Praia Grande',...places.map(p=>p.city)])];
 const cityRoot=document.getElementById('opMeetCities');
 if(cityRoot&&cityRoot.dataset.cities!==JSON.stringify(cities)){
  cityRoot.innerHTML=[['Todas','Todas as cidades'],...cities.map(c=>[c,c])].map(([v,label])=>'<button type="button" class="op-chip" data-value="'+esc(v)+'" aria-pressed="false">'+esc(label)+'</button>').join('');cityRoot.dataset.cities=JSON.stringify(cities);
 }
 if(meetCity!=='Todas'&&!cities.includes(meetCity))meetCity='Todas';
 const badge=document.getElementById('opMeetCityCount');if(badge)badge.textContent=String(cities.length).padStart(2,'0');
 const filtered=filterPlaces(places,meetCity,meetKind,meetSearch,meetSavedOnly,savedPlaces);
 const target=document.getElementById('opPlaceGrid');if(!target)return;
 if(filtered.length){
  if(root.OitavaCompacto)root.OitavaCompacto.renderCollection(target,filtered,placeCard,{kind:'places',unit:'lugares',key:JSON.stringify([meetCity,meetKind,meetSearch,meetSavedOnly]),expanded:Boolean(meetSearch)});
  else target.innerHTML=filtered.map(placeCard).join('');
 }else target.innerHTML='<div class="op-noresults"><strong>Sem locais para estes filtros</strong><p>Experimente outro estilo de encontro ou cidade.</p></div>';
 const count=document.getElementById('opPlaceCount');if(count)count.textContent=filtered.length+' '+(filtered.length===1?'sugestão':'sugestões')+' · '+customPlaces.length+' '+(customPlaces.length===1?'ponto personalizado':'pontos personalizados');
 syncToggles(document.getElementById('opMeetCities'),'[data-value]',meetCity);
 syncToggles(document.getElementById('opMeetKinds'),'[data-value]',meetKind);
 const savedButton=document.getElementById('opMeetSaved');if(savedButton){savedButton.classList.toggle('active',meetSavedOnly);savedButton.setAttribute('aria-pressed',String(meetSavedOnly));savedButton.textContent='♡ Salvos ('+savedPlaces.size+')'}
}
function renderFestivals(){
 const node=document.getElementById('opFestivalGrid');if(!node)return;
 node.innerHTML=(data.festivals||[]).map(f=>'<article class="op-festival-card"><div class="op-festival-kicker">'+esc(f.city)+' · '+esc(f.focus)+'</div><h4>'+esc(f.title)+'</h4><p>'+esc(f.description)+'</p><p class="op-festival-state">'+esc(festivalState(f))+' · '+esc(f.edition)+'</p><p class="op-festival-dates">'+esc(calendarLabel(f))+'</p><p class="op-festival-participate">'+esc(f.participate)+'</p><a href="'+esc(f.url)+'" target="_blank" rel="noopener noreferrer">Programação e fonte →</a></article>').join('');
}
function openPlace(p,trigger){
 const dialog=document.getElementById('opPlaceDialog'),form=document.getElementById('opPlaceForm');
 form.reset();editingPlaceId=p?.id||null;placeTrigger=trigger||document.activeElement;
 document.getElementById('opPlaceDialogTitle').textContent=p?'Editar ponto personalizado':'Cadastrar ponto de encontro';
 document.getElementById('opPlaceFormError').textContent='';
 for(const key of ['name','city','address','type','why','best','watch','url'])if(p&&form.elements.namedItem(key))form.elements.namedItem(key).value=p[key]||'';
 dialog.showModal();form.elements.namedItem('name').focus();
}
function hookCustomPlaces(){
 const dialog=document.getElementById('opPlaceDialog'),form=document.getElementById('opPlaceForm');if(!dialog||!form)return;
 document.getElementById('opAddPlace').addEventListener('click',e=>openPlace(null,e.currentTarget));
 dialog.querySelectorAll('[data-close-place]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('close',()=>{const target=editingPlaceId?document.querySelector('[data-edit-place=\"'+editingPlaceId+'\"]'):placeTrigger;(target?.isConnected?target:document.getElementById('opAddPlace')).focus();editingPlaceId=null;});
 form.addEventListener('submit',e=>{
  e.preventDefault();const values=Object.fromEntries(new FormData(form)),error=document.getElementById('opPlaceFormError');
  const id=editingPlaceId||'custom-'+(root.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  const p=customPlace(values,id);
  if(!p){error.textContent='Preencha nome, cidade, endereço e tipo do encontro.';return;}
  if(values.url.trim()&&!p.url){error.textContent='Use um link http ou https válido, sem usuário ou senha.';form.elements.namedItem('url').focus();return;}
  const rows=editingPlaceId?customPlaces.map(old=>old.id===editingPlaceId?p:old):[...customPlaces,p];
  if(!persistCustom(rows)){error.textContent='O ponto não foi salvo. Verifique as permissões de armazenamento do navegador.';return;}
  meetCity='Todas';meetKind='todos';meetSearch='';meetSavedOnly=false;document.getElementById('opMeetSearch').value='';
  dialog.close();renderPlaces();toast('Ponto salvo neste navegador.');
 });
 window.addEventListener('storage',e=>{if(e.key===STORAGE_CUSTOM){customPlaces=readCustomPlaces(e.newValue);renderPlaces();}});
}
function renderSources(){
 const root=document.getElementById('opEventSources');if(!root)return;
 root.innerHTML=(data.sources||[]).map(s=>'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer" class="op-portal-link">'+
 '<span class="op-portal-icon">→</span><span><strong>'+esc(s.title)+'</strong><small>'+esc(s.city)+' · '+esc(s.kind)+'</small></span></a>').join('');
 const stamp=document.getElementById('opAgendaCurated');
 if(stamp&&data.curated_at){const [y,m,d]=data.curated_at.split('-');stamp.textContent='Curadoria inicial: '+d+'/'+m+'/'+y+' · datas conferidas nas fontes indicadas'}
}
async function copyText(txt){
 if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){try{await navigator.clipboard.writeText(txt);return;}catch{}}
 const active=document.activeElement,textarea=document.createElement('textarea');textarea.value=txt;textarea.readOnly=true;textarea.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
 (document.querySelector('dialog[open]')||document.body).appendChild(textarea);textarea.select();
 let copied=false;try{copied=typeof document.execCommand==='function'&&document.execCommand('copy');}finally{textarea.remove();active?.focus({preventScroll:true});}
 if(!copied)throw new Error('Cópia indisponível');
}
function resetEventFilters(){
 eventCity='Todas';eventCat='todos';eventSearch='';eventSavedOnly=false;eventPeriod='all';document.getElementById('opEventSearch').value='';document.getElementById('opEventPeriod').value='all';renderEvents();
}
function refreshEventInvite(){
 if(!currentInviteEvent)return '';
 const text=eventInvitation(currentInviteEvent,{date:document.getElementById('opInviteDay').value,time:document.getElementById('opInviteTime').value,meeting:document.getElementById('opInviteMeeting').value,note:document.getElementById('opInviteNote').value});
 document.getElementById('opInvitePreview').value=text;
 document.getElementById('opInviteCopy').disabled=!text;document.getElementById('opInviteShare').disabled=!text;document.getElementById('opInviteCalendar').disabled=!text;
 document.getElementById('opInviteStatus').textContent=text?'':'Escolha uma data com atividade no evento e um horário válido.';
 return text;
}
function openEventInvite(event,trigger){
 currentInviteEvent=event;inviteTrigger=trigger;
 document.getElementById('opInviteForm').reset();
 document.getElementById('opInviteEventTitle').textContent=event.title;
 document.getElementById('opInviteEventMeta').textContent=calendarLabel(event)+' · '+event.city+' · '+(event.time||'Horários na programação');
 const day=document.getElementById('opInviteDay');day.min=event.start;day.max=event.end;day.value=defaultInviteDate(event);
 document.getElementById('opInviteMeeting').value=event.venue||'';
 document.getElementById('opInviteSource').href=safeURL(event.url);
 document.getElementById('opInviteShare').hidden=typeof navigator.share!=='function';
 refreshEventInvite();document.getElementById('opEventInviteDialog').showModal();day.focus();
}
function hookEventInvites(){
 const dialog=document.getElementById('opEventInviteDialog'),form=document.getElementById('opInviteForm');if(!dialog||!form)return;
 dialog.querySelectorAll('[data-close-invite]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('close',()=>{const target=inviteTrigger?.isConnected?inviteTrigger:document.getElementById('opEventSearch');target?.focus({preventScroll:true});currentInviteEvent=null;});
 form.addEventListener('input',refreshEventInvite);
 form.addEventListener('submit',async e=>{
  e.preventDefault();const text=refreshEventInvite();if(!text||!form.reportValidity())return;
  try{await copyText(text);document.getElementById('opInviteStatus').textContent='Convite copiado. Agora é só colar no grupo!';}
  catch{const preview=document.getElementById('opInvitePreview');preview.focus();preview.select();document.getElementById('opInviteStatus').textContent='A cópia automática não funcionou. O texto está selecionado para copiar manualmente.';}
 });
 document.getElementById('opInviteCalendar').addEventListener('click',()=>{
  const text=refreshEventInvite();if(!text||!form.reportValidity())return;
  const date=document.getElementById('opInviteDay').value,time=document.getElementById('opInviteTime').value;
  const content=window.OitavaCalendar?.buildCalendar({id:currentInviteEvent.id,title:currentInviteEvent.title,date,time,location:document.getElementById('opInviteMeeting').value+' · '+currentInviteEvent.city,description:text+'\n\n'+(time?'Horário combinado pelo grupo em Brasília. Não é confirmação da sessão.':'Lembrete de dia inteiro; horário a combinar.'),url:currentInviteEvent.url});
  if(!content){document.getElementById('opInviteStatus').textContent='Não foi possível criar o arquivo. Confira data e horário.';return;}
  const objectURL=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'})),a=document.createElement('a');
  a.href=objectURL;a.download='oitava-encontro-'+date+'.ics';dialog.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectURL),30000);
  document.getElementById('opInviteStatus').textContent='Arquivo preparado para abrir no seu calendário.';
 });
 document.getElementById('opInviteShare').addEventListener('click',async()=>{
  const text=refreshEventInvite();if(!text||!form.reportValidity()||typeof navigator.share!=='function')return;
  try{await navigator.share({title:'Convite · '+currentInviteEvent.title,text});document.getElementById('opInviteStatus').textContent='Compartilhamento concluído pelo aparelho.';}
  catch(error){document.getElementById('opInviteStatus').textContent=error.name==='AbortError'?'Compartilhamento cancelado.':'Não foi possível compartilhar. Use Copiar convite.';}
 });
}
function hook(){
 document.getElementById('opEventCities')?.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(!b)return;eventCity=b.dataset.value;renderEvents();});
 document.getElementById('opEventCategories')?.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(!b)return;eventCat=b.dataset.value;renderEvents();});
 document.getElementById('opEventReset')?.addEventListener('click',resetEventFilters);
 document.getElementById('opEventPeriod')?.addEventListener('change',e=>{eventPeriod=e.target.value;renderEvents();});
 document.getElementById('opEventSearch')?.addEventListener('input',e=>{eventSearch=e.target.value;renderEvents();});
 document.getElementById('opEventSaved')?.addEventListener('click',()=>{eventSavedOnly=!eventSavedOnly;renderEvents();});
 document.getElementById('opEventGrid')?.addEventListener('click',e=>{
  const invite=e.target.closest('[data-invite-event]');if(invite){const event=data.events.find(row=>row.id===invite.dataset.inviteEvent);if(event)openEventInvite(event,invite);return;}
  if(e.target.closest('[data-reset-events]')){resetEventFilters();document.getElementById('opEventSearch').focus();return;}
  const b=e.target.closest('[data-favevent]');if(b)updateSaved('events',b.dataset.favevent);
 });
 document.getElementById('opMeetCities')?.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(!b)return;meetCity=b.dataset.value;renderPlaces();});
 document.getElementById('opMeetKinds')?.addEventListener('click',e=>{const b=e.target.closest('[data-value]');if(!b)return;meetKind=b.dataset.value;renderPlaces();});
 document.getElementById('opMeetReset')?.addEventListener('click',()=>{meetCity='Todas';meetKind='todos';meetSearch='';meetSavedOnly=false;document.getElementById('opMeetSearch').value='';renderPlaces();});
 document.getElementById('opMeetSearch')?.addEventListener('input',e=>{meetSearch=e.target.value;renderPlaces();});
 document.getElementById('opMeetSaved')?.addEventListener('click',()=>{meetSavedOnly=!meetSavedOnly;renderPlaces();});
 document.getElementById('opPlaceGrid')?.addEventListener('click',e=>{
  const edit=e.target.closest('[data-edit-place]');if(edit){const p=customPlaces.find(p=>p.id===edit.dataset.editPlace);if(p)openPlace(p,edit);return;}
  const del=e.target.closest('[data-delete-place]');if(del){const p=customPlaces.find(p=>p.id===del.dataset.deletePlace);if(!p||!confirm('Excluir o ponto personalizado “'+p.name+'” deste navegador?'))return;if(persistCustom(customPlaces.filter(row=>row.id!==p.id))){savedPlaces.delete(p.id);storage.set(STORAGE_PLACES,savedPlaces);renderPlaces();document.getElementById('opAddPlace').focus();toast('Ponto personalizado excluído.');}return;}
  const f=e.target.closest('[data-favplace]');if(f){updateSaved('places',f.dataset.favplace);return;}
  const invite=e.target.closest('[data-invite]');if(!invite)return;
  const p=allPlaces().find(p=>p.id===invite.dataset.invite);if(!p)return;
  const txt='Oitava Parede · Ideia de encontro\\n📍 '+p.name+' ('+p.city+')\\n'+p.address+'\\nMapa: '+mapUrl(p)+'\\nVamos combinar dia e horário?';
  copyText(txt.replaceAll('\\n','\n')).then(()=>toast('Convite copiado. Agora é só enviar no grupo!')).catch(()=>toast('Não foi possível copiar. Use o mapa para compartilhar o local.'));
 });
}

function eventInviteMarkup(){return `<dialog id="opEventInviteDialog" class="op-place-dialog op-invite-dialog" aria-labelledby="opEventInviteTitle">
<div class="op-place-dialog-head"><h2 id="opEventInviteTitle">Criar convite cultural</h2><button type="button" data-close-invite aria-label="Fechar convite">×</button></div>
<div class="op-invite-context"><strong id="opInviteEventTitle"></strong><p id="opInviteEventMeta"></p><a id="opInviteSource" target="_blank" rel="noopener noreferrer">Programação do evento →</a></div>
<p class="op-place-dialog-note">Escolha como reunir a equipe e confira o texto antes de compartilhar.</p>
<form id="opInviteForm"><div class="op-place-form-grid">
<label>Dia do encontro<input id="opInviteDay" type="date" required></label>
<label>Hora do encontro (opcional)<input id="opInviteTime" type="time"></label>
<label class="op-form-wide">Ponto de encontro<input id="opInviteMeeting" maxlength="220" placeholder="Ex.: entrada principal do cinema"></label>
<label class="op-form-wide">Mensagem para o grupo (opcional)<textarea id="opInviteNote" maxlength="300" rows="2" placeholder="Ex.: vamos chegar 15 minutos antes?"></textarea></label>
<label class="op-form-wide op-invite-preview-label">Prévia do convite<textarea id="opInvitePreview" readonly rows="7" spellcheck="false"></textarea></label>
</div><p id="opInviteStatus" class="op-invite-status" role="status" aria-live="polite"></p>
<div class="op-calendar-export"><button type="button" id="opInviteCalendar">Adicionar ao meu calendário <span aria-hidden="true">→</span></button><small>Usa o dia e o horário combinados acima, no horário de Brasília. Sem horário, cria um lembrete de dia inteiro.</small></div><div class="op-place-form-actions op-invite-actions"><button type="button" data-close-invite>Fechar</button><button type="button" id="opInviteShare" hidden>Compartilhar</button><button type="submit" id="opInviteCopy" class="op-add-place">Copiar convite</button></div></form></dialog>`;}

function placeDialogMarkup(){return `<dialog id="opPlaceDialog" class="op-place-dialog" aria-labelledby="opPlaceDialogTitle">
<div class="op-place-dialog-head"><h2 id="opPlaceDialogTitle">Cadastrar ponto de encontro</h2><button type="button" data-close-place aria-label="Fechar cadastro">×</button></div>
<p class="op-place-dialog-note">Seu cadastro fica neste navegador. Informe um local público ou um endereço que você queira guardar para seus encontros.</p>
<form id="opPlaceForm"><div class="op-place-form-grid">
<label>Nome do local *<input name="name" required maxlength="100" autocomplete="organization" placeholder="Ex.: Café da esquina"></label>
<label>Cidade *<input name="city" required maxlength="80" list="opCustomCityList" autocomplete="address-level2" placeholder="Ex.: Santos"><datalist id="opCustomCityList"><option value="Santos"><option value="São Vicente"><option value="Praia Grande"><option value="São Paulo"></datalist></label>
<label>Tipo de encontro *<select name="type" required>${Object.entries(kindInfo).map(([key,info])=>'<option value="'+key+'">'+info.label+'</option>').join('')}</select></label>
<label>Bom para<input name="best" maxlength="160" placeholder="Ex.: roteiro, referências e conversa"></label>
<label class="op-form-wide">Endereço ou ponto de referência *<input name="address" required maxlength="220" autocomplete="street-address" placeholder="Rua, número e bairro"></label>
<label class="op-form-wide">Por que se encontrar aqui?<textarea name="why" rows="2" maxlength="500" placeholder="Conte um pouco sobre o ambiente"></textarea></label>
<label class="op-form-wide">Link do local (opcional)<input name="url" type="url" maxlength="1000" placeholder="https://…"></label>
<label class="op-form-wide">Observações<textarea name="watch" rows="2" maxlength="350" placeholder="Reserva, horário, barulho, acesso ou outros cuidados"></textarea></label>
</div><p id="opPlaceFormError" class="op-place-form-error" role="alert"></p><div class="op-place-form-actions"><button type="button" data-close-place>Cancelar</button><button type="submit" class="op-add-place">Salvar ponto</button></div></form></dialog>`;}

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
 const kindPlaces=buttons([['todos','Todos os encontros'],['trabalho','▤ Reunião & foco'],['cafe','◉ Café & brainstorm'],['social','✺ Bar & confraternização'],['cultural','✳ Cultura & ar livre']],'category-active');
 const markup=[
 '<section class="op-section op-agenda" id="agenda" aria-label="Agenda cultural da Baixada e São Paulo"><div class="wrap">',
 '<div class="op-eyebrow">Para criar, circular e sair juntos</div>',
 '<div class="op-header"><div><h2>Agenda <span style="color:#c29329">cultural</span> da equipe</h2>',
 '<p>Festivais de cinema, shows, arte, oficinas e gastronomia na Baixada Santista e na capital. Um espaço para ampliar repertório, encontrar referências, fazer networking e combinar um rolê em grupo.</p></div>',
 '<div class="op-header-badge"><strong>04</strong><span>temas para explorar</span></div></div>',
 '<a class="op-circuit-shortcut" href="#opCinemaCircuit">Explorar festivais e mostras de cinema ↓</a>',
 '<div class="op-event-controls" aria-label="Filtros da agenda"><div class="op-controls-row">',
 '<div class="op-chipset" id="opEventCities" aria-label="Cidades">'+cityEvents+'</div>',
 '<div class="op-control-right"><label class="op-period-label" for="opEventPeriod">Quando<select id="opEventPeriod"><option value="all">Toda a agenda</option><option value="today">Hoje</option><option value="week">Próximos 7 dias</option><option value="weekend">Fim de semana</option></select></label><input id="opEventSearch" type="search" class="op-text-search" placeholder="Evento, cinema ou cidade" aria-label="Pesquisar evento">',
 '<button id="opEventReset" type="button" class="op-saved">Limpar filtros</button><button id="opEventSaved" class="op-saved" type="button" aria-pressed="false">♡ Salvos</button></div></div>',
 '<div class="op-chipset" id="opEventCategories" aria-label="Categorias">'+catEvents+'</div>',
 '<p id="opEventSelection" class="op-filter-selection"></p>',
 '<div class="op-control-foot"><strong id="opEventCount" aria-live="polite">Carregando programação...</strong><span id="opAgendaCurated">Confirme ingressos e horários na fonte.</span></div></div>',
 '<div class="op-event-grid" id="opEventGrid" aria-live="polite"><div class="op-noresults">Carregando eventos...</div></div>',
 '<section class="op-cinema-circuit" id="opCinemaCircuit" aria-labelledby="opCinemaTitle"><div class="op-circuit-heading"><div><span class="op-eyebrow">Circuito audiovisual</span><h3 id="opCinemaTitle">Festivais e mostras para acompanhar</h3></div><p>Referências para assistir, trocar ideias e circular seus filmes. Edições encerradas continuam aqui para pesquisa; novas datas e inscrições dependem do anúncio da organização.</p></div><div class="op-festival-grid" id="opFestivalGrid">Carregando festivais…</div></section>',
 '<div class="op-agenda-bottom"><div class="op-agenda-bottom-head"><h3>Onde descobrir outras programações</h3>',
 '<span>Portais e instituições para consultar a agenda mais recente</span></div>',
 '<div class="op-portals" id="opEventSources">Carregando fontes...</div></div>',
 '<p class="op-meeting-footnote">Esta é uma seleção editorial. Eventos encerrados são ocultados por data, mas novos anúncios não entram automaticamente: consulte as fontes acima para a programação mais recente. Horários, preços e sessões podem mudar.</p>',
 '</div></section>',
 '<section class="op-section op-meetings" id="reunioes" aria-label="Reuniões e pontos de encontro"><div class="wrap">',
 '<div class="op-eyebrow">Pontos de encontro · Baixada Santista e seus locais</div>',
 '<div class="op-header"><div><h2>Reuniões, café <span style="color:#c29329">& boas ideias.</span></h2>',
 '<p>Onde desenvolver um projeto, trocar referências ou tomar uma cerveja depois da entrega. Cafés, coworkings, espaços culturais e opções ao ar livre. Veja as fontes, salve favoritos ou cadastre um ponto do seu jeito.</p></div>',
 '<div class="op-header-badge"><strong id="opMeetCityCount">03</strong><span>cidades para se encontrar</span></div></div>',
 '<div class="op-custom-bar"><div><strong>Seu próximo encontro pode ser em outro lugar.</strong><p>Cadastre um endereço com suas observações. Os pontos personalizados ficam salvos apenas neste navegador.</p></div><button type="button" id="opAddPlace" class="op-add-place">＋ Cadastrar ponto</button></div>',
 '<div class="op-meet-controls" aria-label="Filtros dos locais"><div class="op-controls-row">',
 '<div class="op-chipset" id="opMeetCities" aria-label="Cidades">'+cityPlaces+'</div>',
 '<div class="op-control-right"><input id="opMeetSearch" class="op-text-search" type="search" placeholder="Café, bar ou bairro" aria-label="Pesquisar local">',
 '<button id="opMeetReset" type="button" class="op-saved">Limpar filtros</button><button id="opMeetSaved" type="button" class="op-saved" aria-pressed="false">♡ Salvos</button></div></div>',
 '<div class="op-chipset" id="opMeetKinds" aria-label="Tipo de encontro">'+kindPlaces+'</div>',
 '<div class="op-control-foot"><strong id="opPlaceCount" aria-live="polite">Carregando locais...</strong><span id="opPlaceSourceStatus">Salve os favoritos e copie um convite para o grupo.</span></div></div>',
 '<div class="op-place-grid" id="opPlaceGrid" aria-live="polite"><div class="op-noresults">Carregando sugestões...</div></div>',
 '<p class="op-meeting-footnote">Locais independentes, sem parceria com a Oitava Parede. Antes de reunir a equipe, confirme horário, lotação, consumo mínimo, Wi-Fi, reserva e se há espaço para conversas longas.</p>',
 '</div></section>'+placeDialogMarkup()+eventInviteMarkup()+'<div id="opToast" class="op-toast" role="status" aria-live="polite"></div>'
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
 try{customPlaces=readCustomPlaces(localStorage.getItem(STORAGE_CUSTOM));}catch{customPlaces=[];}
 hook();hookCustomPlaces();hookEventInvites();notifySaved();if(customPlaces.length)renderPlaces();
 window.addEventListener('op:saved-remove',e=>{const {kind,id}=e.detail||{};if(['events','places'].includes(kind)&&(kind==='events'?savedEvents:savedPlaces).has(id))updateSaved(kind,id,true);});
 window.addEventListener('op:open-event',e=>{const event=data.events.find(row=>row.id===e.detail?.id);if(event&&event.end>=todayBR())openEventInvite(event,e.detail.trigger||document.getElementById('opEventSearch'));});
 window.addEventListener('storage',e=>{if(e.key===STORAGE_EVENTS||e.key===STORAGE_PLACES){savedEvents=storage.get(STORAGE_EVENTS);savedPlaces=storage.get(STORAGE_PLACES);notifySaved();renderEvents();renderPlaces();}});
 try{
  const resp=await fetch('./dados/agenda.json?t='+Date.now(),{cache:'no-store'});
  if(!resp.ok)throw new Error('Agenda indisponível');
  const json=await resp.json();
  if(json.schema!==1||!Array.isArray(json.events)||!Array.isArray(json.places))throw new Error('Formato inválido');
  data=json;
  window.OitavaCentralData=window.OitavaCentralData||{};window.OitavaCentralData.agenda=data;
  window.dispatchEvent(new CustomEvent('op:agenda-ready',{detail:data}));
  renderEvents();renderPlaces();renderSources();renderFestivals();
 }catch(e){
  src.innerHTML='<div class="op-noresults"><strong>Não foi possível carregar a agenda.</strong><p>Utilize os portais de programação indicados na seção.</p></div>';
  renderPlaces();document.getElementById('opPlaceSourceStatus').textContent='As sugestões públicas não carregaram. Seus pontos personalizados continuam disponíveis.';
  document.getElementById('opFestivalGrid').textContent='Não foi possível carregar os festivais. Recarregue a página.';
  console.warn('[agenda]',e);
 }
}
const api={upcomingEvents,filterEvents,filterPlaces,catInfo,kindInfo,customPlace,readCustomPlaces,safeURL,festivalState,periodBounds,eventInPeriod,defaultInviteDate,eventInvitation,validDay};
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined')if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:null);
