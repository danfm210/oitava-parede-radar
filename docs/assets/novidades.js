/* Avisos do próprio site. Leitura local não equivale à conferência de um resultado. */
(function(root){
'use strict';
const STORE='oitava_novidades_lidas_v1',REVIEW_STORE='oitava_mencoes_conferidas_v1';
const WINDOW_MS=48*60*60*1000;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function officialURL(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(u.hostname==='gov.br'||u.hostname.endsWith('.gov.br')||u.hostname==='plenussistemas.dioenet.com.br');}catch{return false;}
}
function readSeen(raw){
 try{const values=JSON.parse(raw||'[]');return new Set(Array.isArray(values)?values.filter(x=>typeof x==='string'&&x.length<1200).slice(-1000):[]);}catch{return new Set();}
}
function isRecent(row,now){
 const stamp=String(row?.primeira_detecao||''),time=/^\d{4}-\d{2}-\d{2}T/.test(stamp)?Date.parse(stamp):NaN;
 return row?.base_inicial===false&&Number.isFinite(now)&&Number.isFinite(time)&&time<=now&&time>=now-WINDOW_MS;
}
function buildFeed({radar,approvals,checked={},now=Date.now(),radarAPI,approvalAPI}={}){
 const rows=[],covered=new Set(),ids=new Set();
 const add=row=>{if(!ids.has(row.id)){ids.add(row.id);rows.push(row);covered.add(row.url);}};
 const today=new Date(now).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
 // Revalida o cadastro completo: revisões revogadas e fases preliminares nunca geram aprovação.
 const confirmed=approvalAPI?.confirmedResults({schema:1,aprovacoes:Array.isArray(approvals)?approvals:[]},today)||[];
 for(const r of confirmed)add({id:'approval:'+r.id+':'+r.revisao,kind:'approval',target:r.id,title:r.projeto,label:'Aprovação confirmada',description:r.proponente+' · '+r.programa+' · '+(approvalAPI.STAGES[r.etapa]||r.etapa),stamp:r.conferido_em+'T12:00:00Z',url:r.fonte_url,priority:0,sections:['monitor','catalogo-projetos'],menu:['editais','projetos']});
 if(radar?.schema!==2)return rows;
 const publications=radarAPI?.groupPublications(radar.publicacoes||[]).flatMap(g=>g.items)||[];
 const docsById=new Map(publications.map(d=>[String(d.id),d]));
 for(const m of Array.isArray(radar.mencoes)?radar.mencoes:[])if(m&&officialURL(m.url)&&isRecent(m,now)&&checked[String(m.id).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90)])covered.add(m.url);
 const mentions=(Array.isArray(radar.mencoes)?radar.mencoes:[]).filter(m=>m&&m.id&&m.titulo&&officialURL(m.url)&&isRecent(m,now)&&!checked[String(m.id).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90)]).sort((a,b)=>(a.prioridade==='maxima'?0:1)-(b.prioridade==='maxima'?0:1));
 for(const m of mentions){
  if(covered.has(m.url))continue;
  const doc=docsById.get(String(m.publicacao_id));
  add({id:'mention:'+m.id+':'+m.primeira_detecao,kind:'mention',target:String(m.id),documentKey:doc?String(doc.id||doc.url):'',title:m.titulo,label:'Menção a conferir',description:m.mensagem||'Termo localizado. Confira o documento; a menção não confirma aprovação.',stamp:m.primeira_detecao,url:m.url,priority:m.prioridade==='maxima'?1:2,sections:['monitorMentions'],menu:['editais']});
 }
 for(const d of publications){
  if(!officialURL(d.url)||!isRecent(d,now)||covered.has(d.url))continue;
  const kind=radarAPI.classifyDocument(d),program=radarAPI.PROGRAMS[kind.program]?.name||'Fonte oficial',type=radarAPI.TYPES[kind.type]?.name||'Documento';
  add({id:'document:'+String(d.id||d.url)+':'+d.primeira_detecao,kind:'document',target:String(d.id||d.url),title:d.titulo,label:'Novo arquivo no radar',description:program+' · '+type,stamp:d.primeira_detecao,url:d.url,priority:kind.type==='retificacao'||kind.type==='resultado'?3:4,sections:['monitor'],menu:['editais']});
 }
 return rows.sort((a,b)=>a.priority-b.priority||Date.parse(b.stamp)-Date.parse(a.stamp));
}
function unreadCounts(rows,seen){
 const result={total:0,sections:{},menus:{}};
 for(const row of rows){if(seen.has(row.id))continue;result.total++;
  for(const key of new Set(row.sections))result.sections[key]=(result.sections[key]||0)+1;
  for(const key of new Set(row.menu))result.menus[key]=(result.menus[key]||0)+1;
 }return result;
}
const badgeText=count=>count>99?'99+':String(count);
function init(){
 const tools=document.querySelector('.op-masthead-tools');if(!tools||document.getElementById('opNewsBell'))return;
 const get=key=>{try{return localStorage.getItem(key);}catch{return null;}};
 let seen=readSeen(get(STORE)),feed=[],filter='all',lastMarkup='',persisted=true,loading=true;
 const cache=root.OitavaCentralData||{};
 let radar=cache.radar||null,approvals=cache.approvals||[],radarError=Boolean(cache.radarError),approvalsError=Boolean(cache.approvalsError);
 const bell=document.createElement('button');bell.id='opNewsBell';bell.type='button';bell.className='op-news-bell';bell.setAttribute('aria-label','Abrir novidades');bell.setAttribute('aria-expanded','false');bell.setAttribute('aria-controls','opNewsPanel');
 bell.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg><span class="op-news-bell-label">Novidades</span><span class="op-news-bell-count" aria-hidden="true" hidden></span>';
 tools.insertBefore(bell,document.getElementById('menuButton'));
 const panel=document.createElement('section');panel.id='opNewsPanel';panel.className='op-news-panel';panel.hidden=true;panel.setAttribute('aria-labelledby','opNewsTitle');
 panel.innerHTML='<div class="op-news-heading"><div><span class="op-news-eyebrow">ACOMPANHE A CENTRAL</span><h2 id="opNewsTitle">Novidades</h2><p id="opNewsSummary"></p></div><button type="button" class="op-news-close" aria-label="Fechar novidades">×</button></div><div class="op-news-toolbar"><div class="op-news-filters" role="group" aria-label="Filtrar novidades"><button type="button" data-news-filter="all" aria-pressed="true">Todas</button><button type="button" data-news-filter="unread" aria-pressed="false">Não lidas</button></div><button type="button" id="opNewsReadAll">Marcar todas como lidas</button></div><div id="opNewsList" class="op-news-list"></div><div class="op-news-footer"><p id="opNewsNote"></p><p>Novos arquivos e menções: últimas 48 horas de detecção. Uma menção exige conferência na fonte.</p></div>';
 document.body.appendChild(panel);
 const live=document.createElement('p');live.className='op-news-sr';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');document.body.appendChild(live);
 const message=text=>{live.textContent=text;};
 function readChecked(){try{const x=JSON.parse(get(REVIEW_STORE)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};}catch{return {};}}
 function persist(){try{localStorage.setItem(STORE,JSON.stringify([...seen].slice(-1000)));persisted=true;}catch{persisted=false;}}
 let badgeId=0;
 function badge(node,count){
  if(!node)return;
  let bubble=node.querySelector(':scope > .op-nav-bubble');
  if(!count){if(bubble){node.setAttribute('aria-describedby',(node.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==bubble.id).join(' '));if(!node.getAttribute('aria-describedby'))node.removeAttribute('aria-describedby');bubble.remove();}return;}
  if(!bubble){bubble=document.createElement('span');bubble.className='op-nav-bubble';bubble.id='opNewsBadge-'+(++badgeId);bubble.innerHTML='<span aria-hidden="true"></span><span class="op-news-sr"></span>';node.appendChild(bubble);node.setAttribute('aria-describedby',((node.getAttribute('aria-describedby')||'')+' '+bubble.id).trim());}
  const value=badgeText(count),description=count+' novidade'+(count===1?' não lida':'s não lidas');
  if(bubble.firstElementChild.textContent!==value)bubble.firstElementChild.textContent=value;
  if(bubble.lastElementChild.textContent!==description)bubble.lastElementChild.textContent=description;
  bubble.title=description;
 }
 function render(){
  const counts=unreadCounts(feed,seen),total=counts.total;
  const number=bell.querySelector('.op-news-bell-count');number.hidden=!total;number.textContent=badgeText(total);
  bell.setAttribute('aria-label','Abrir novidades'+(total?' · '+total+' não lida'+(total===1?'':'s'):''));
  document.querySelectorAll('#nav [data-nav-trigger]').forEach(n=>badge(n,counts.menus[n.dataset.navTrigger]||0));
  document.querySelectorAll('#nav a[data-section]').forEach(n=>badge(n,counts.sections[n.dataset.section]||0));
  document.querySelectorAll('[data-dock-target]').forEach(n=>badge(n,n.dataset.dockTarget==='monitor'?counts.menus.editais||0:n.dataset.dockTarget==='catalogo-projetos'?counts.menus.projetos||0:counts.sections[n.dataset.dockTarget]||0));
  badge(document.getElementById('menuButton'),total);
  panel.querySelector('#opNewsSummary').textContent=loading?'Consultando os avisos do site…':total?total+' novidade'+(total===1?' não lida':'s não lidas'):'Você está em dia com os avisos disponíveis.';
  panel.querySelector('#opNewsReadAll').disabled=!total;
  panel.querySelectorAll('[data-news-filter]').forEach(n=>{n.setAttribute('aria-pressed',String(n.dataset.newsFilter===filter));n.textContent=n.dataset.newsFilter==='all'?'Todas ('+feed.length+')':'Não lidas ('+total+')';});
  const visible=feed.filter(r=>filter==='all'||!seen.has(r.id)).sort((a,b)=>Number(seen.has(a.id))-Number(seen.has(b.id))||a.priority-b.priority||Date.parse(b.stamp)-Date.parse(a.stamp));
  const fmt=stamp=>new Date(stamp).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const markup=visible.length?'<ul>'+visible.map(row=>'<li><button type="button" class="op-news-item'+(seen.has(row.id)?' is-read':'')+'" data-news-id="'+esc(row.id)+'"><span class="op-news-item-top"><span class="op-news-kind is-'+row.kind+'">'+esc(row.label)+'</span><span class="op-news-read">'+(seen.has(row.id)?'Lida':'Não lida')+'</span></span><strong>'+esc(row.title)+'</strong><span class="op-news-description">'+esc(row.description)+'</span><span class="op-news-item-bottom"><time datetime="'+esc(row.stamp)+'">'+(row.kind==='approval'?'Conferência: ':'Detectado: ')+esc(fmt(row.stamp))+'</time><span>Localizar no site <span aria-hidden="true">↗</span></span></span></button></li>').join('')+'</ul>':'<div class="op-news-empty"><span aria-hidden="true">'+(loading?'…':'✓')+'</span><strong>'+(loading?'Carregando novidades':radarError?'Não foi possível carregar o radar':filter==='unread'?'Nenhuma novidade não lida':'Nenhum aviso recente')+'</strong><p>'+(loading?'Os avisos aparecem assim que o radar carregar.':radarError?'Tente recarregar a página para consultar os avisos.':'As próximas novidades aparecerão aqui. Você pode consultar todo o histórico no Radar.')+'</p><a href="#monitor" data-news-radar>Consultar o Radar ↗</a></div>';
  if(markup!==lastMarkup){panel.querySelector('#opNewsList').innerHTML=markup;lastMarkup=markup;}
  panel.querySelector('#opNewsNote').textContent=(radarError||approvalsError?'Parte dos avisos está indisponível nesta consulta. ':'')+(persisted?'Leituras salvas neste navegador.':'Não foi possível salvar a leitura; a marcação vale nesta página.');
 }
 function refresh(){
  loading=!radar&&!radarError;
  feed=buildFeed({radar,approvals,checked:readChecked(),radarAPI:root.OitavaRadar,approvalAPI:root.OitavaApprovals});render();
 }
 function placePanel(){const head=document.querySelector('.op-header-v2'),top=Math.max(8,Math.ceil(head?.getBoundingClientRect().bottom||86)+8);panel.style.setProperty('--op-news-top',top+'px');}
 function close(restore=false){panel.hidden=true;bell.setAttribute('aria-expanded','false');if(restore)bell.focus({preventScroll:true});}
 function open(){
  const nav=document.getElementById('nav');nav?.classList.remove('open');
  const menu=document.getElementById('menuButton');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Abrir menu de navegação');
  const label=menu?.querySelector('.op-mobile-toggle-label');if(label)label.textContent='Menu';
  document.querySelectorAll('#nav [data-nav-trigger]').forEach(n=>{n.setAttribute('aria-expanded','false');n.parentElement.classList.remove('is-expanded');});
  document.querySelectorAll('#nav [data-nav-panel]').forEach(n=>n.hidden=true);
  refresh();placePanel();panel.hidden=false;bell.setAttribute('aria-expanded','true');panel.querySelector('.op-news-close').focus();
 }
 function reveal(target){
  if(!target)return false;
  for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
  target.classList.add('op-news-target');target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
  target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  window.setTimeout(()=>target.classList.remove('op-news-target'),3500);return true;
 }
 function locate(row){
  if(row.kind==='approval')return Boolean(root.OitavaApprovals?.openResult?.(row.target));
  if(row.kind==='mention')return reveal(root.OitavaReviews?.locateMention(row.target));
  return Boolean(root.OitavaRadar?.locateDocument(row.target));
 }
 bell.addEventListener('click',()=>panel.hidden?open():close(true));
 panel.querySelector('.op-news-close').addEventListener('click',()=>close(true));
 panel.addEventListener('click',event=>{
  const tab=event.target.closest('[data-news-filter]');if(tab){filter=tab.dataset.newsFilter;render();return;}
  if(event.target.closest('[data-news-radar]')){close();reveal(document.getElementById('monitor'));return;}
  const button=event.target.closest('[data-news-id]');if(!button)return;
  const row=feed.find(r=>r.id===button.dataset.newsId);if(!row)return;
  // Registra a leitura só depois que o destino foi encontrado com sucesso.
  close();if(locate(row)){seen.add(row.id);persist();render();message('Aviso localizado: '+row.title+'.');}
  else{open();message('Não foi possível localizar este item. Tente recarregar a página.');}
 });
 panel.querySelector('#opNewsReadAll').addEventListener('click',()=>{feed.forEach(row=>seen.add(row.id));persist();render();message('Todos os avisos disponíveis foram marcados como lidos.');});
 document.addEventListener('pointerdown',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!bell.contains(event.target))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();event.stopImmediatePropagation();close(true);}},{capture:true});
 document.addEventListener('focusin',event=>{if(!panel.hidden&&!panel.contains(event.target)&&!bell.contains(event.target))close();});
 window.addEventListener('resize',()=>{if(!panel.hidden)placePanel();},{passive:true});
 window.addEventListener('scroll',()=>{if(!panel.hidden)placePanel();},{passive:true});
 window.addEventListener('op:radar-ready',event=>{radar=event.detail;radarError=false;refresh();});
 window.addEventListener('op:radar-error',()=>{radarError=true;refresh();});
 window.addEventListener('op:approvals-ready',event=>{approvals=event.detail;approvalsError=false;refresh();});
 window.addEventListener('op:approvals-error',()=>{approvalsError=true;refresh();});
 window.addEventListener('op:reviews-updated',refresh);
 window.addEventListener('storage',event=>{if(event.key===STORE||event.key===null){seen=readSeen(get(STORE));refresh();}else if(event.key===REVIEW_STORE)refresh();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 window.setInterval(()=>{if(!document.hidden)refresh();},60000);
 refresh();
}
const api={STORE,WINDOW_MS,officialURL,readSeen,isRecent,buildFeed,unreadCounts,badgeText};
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
})(typeof window!=='undefined'?window:null);
