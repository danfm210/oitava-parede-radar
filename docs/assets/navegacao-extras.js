/* Oitava Parede · atalhos e leitura assistida
   Busca local de SEÇÕES e AÇÕES, não uma pesquisa full-text de arquivos oficiais.
   Sem rastreamento, APIs ou dados enviados a servidores.
*/
(function(root){
'use strict';
const DESTINATIONS=[
 {id:'inicio-editorial',label:'Início da Central',group:'Navegação',description:'Visão editorial da Oitava Parede',keywords:'home página inicial voltar'},
 {id:'monitor',label:'Radar de editais',group:'Editais',description:'Documentos e atualizações oficiais',keywords:'pnab lei paulo gustavo resultado edital diário'},
 {id:'monitorMentions',label:'Menções a conferir',group:'Editais',description:'Giovanna Barbosa, OitavaFest e termos de projetos',keywords:'check marcar conferida menções proponente Oscar Stefanno Fornari Matheus de Castro Santos Soares Daniel Fernandes Melquiades dos Santos'},
 {id:'projetos',label:'Projetos cadastrados',group:'Projetos',description:'Acompanhar inscrições e protocolos',keywords:'cadastrar projeto status contemplado'},
 {id:'agenda',label:'Agenda cultural',group:'Cultura',description:'Shows, festivais, cinema e gastronomia',keywords:'evento eventos audiovisual música festival festivais passeios'},
 {id:'reunioes',label:'Pontos de encontro',group:'Encontros',description:'Cafés, bares e espaços para brainstorm',keywords:'reuniões café cerveja salas coworking'},
 {id:'fontes',label:'Fontes oficiais',group:'Editais',description:'Portais dos órgãos e documentos originais',keywords:'site oficial prefeitura governo'},
 {id:'oportunidades',label:'Oportunidades de fomento',group:'Editais',description:'Programas, editais e linhas de apoio',keywords:'proac rouanet pnab cultura'},
 {id:'visao',label:'Visão geral',group:'Navegação',description:'Indicadores e acompanhamento da equipe',keywords:'dashboard resumo números'},
 {id:'acervo',label:'Acervo da Oitava Parede',group:'Projetos',description:'Fotos, bastidores e Instagram do coletivo',keywords:'imagem logo filmes produtora'},
 {id:'notificacoes',label:'Avisos e notificações',group:'Ajuda',description:'Como receber alertas e acompanhar mudanças',keywords:'email push notificações alertas'}
];
const ACTIONS=[
 {id:'radarDocQuery',target:'monitor',label:'Pesquisar um edital pelo nome',group:'Ações rápidas',description:'Abrir o campo de busca de publicações',keywords:'buscar edital nome número documento'},
 {id:'projectSearch',target:'projetos',label:'Localizar um projeto cadastrado',group:'Ações rápidas',description:'Buscar projetos ou protocolos locais',keywords:'buscar projeto protocolo inscrição'},
 {id:'opEventSearch',target:'agenda',label:'Encontrar evento cultural',group:'Ações rápidas',description:'Pesquisar programação por nome ou local',keywords:'buscar show festival evento'},
 {id:'opMeetSearch',target:'reunioes',label:'Buscar café ou local de reunião',group:'Ações rápidas',description:'Pesquisar espaços de encontro',keywords:'buscar bar coworking reunião café'}
];
const normalize=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function searchDestinations(q,limit=9){
 const query=normalize(q);
 const words=query.split(/\s+/).filter(Boolean);
 const docs=[...DESTINATIONS,...ACTIONS];
 if(!words.length)return docs.filter(x=>['monitor','monitorMentions','projetos','agenda','reunioes','radarDocQuery'].includes(x.id)).slice(0,limit);
 return docs.map((item,index)=>{
  const name=normalize(item.label),body=normalize([item.description,item.group,item.keywords,item.id].join(' '));
  const all=name+' '+body;
  if(!words.every(w=>all.includes(w)))return null;
  const score=words.reduce((n,w)=>n+(name.startsWith(w)?6:name.includes(w)?4:body.includes(w)?1:0),0);
  return {item,index,score};
 }).filter(Boolean).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,limit).map(x=>x.item);
}
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function init(){
 const header=document.querySelector('.op-header-v2');
 const toolarea=header?.querySelector('.op-masthead-tools');
 if(!header||!toolarea||document.getElementById('opQuickSearchTrigger'))return;
 const trigger=document.createElement('button');
 trigger.id='opQuickSearchTrigger';
 trigger.className='op-quick-search-trigger';
 trigger.type='button';
 trigger.setAttribute('aria-haspopup','dialog');
 trigger.setAttribute('aria-controls','opQuickSearchDialog');
 trigger.setAttribute('aria-label','Buscar seções e ações na Central, atalho Control K');
 trigger.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5.2 5.2"/></svg><span>Busca rápida</span><kbd>Ctrl K</kbd>';
 toolarea.insertBefore(trigger,toolarea.querySelector('#menuButton'));
 const modal=document.createElement('div');
 modal.id='opQuickSearchDialog';
 modal.className='op-search-overlay';
 modal.hidden=true;
 modal.innerHTML=
 '<div class="op-search-backdrop" data-search-close></div>'+
 '<section class="op-search-panel" role="dialog" aria-modal="true" aria-labelledby="opSearchTitle" aria-describedby="opSearchDesc">'+
 '<div class="op-search-heading"><span>OITAVA PAREDE · ACESSO RÁPIDO</span><button class="op-search-close" type="button" data-search-close aria-label="Fechar busca rápida">×</button></div>'+
 '<h2 id="opSearchTitle">O que você procura?</h2><p id="opSearchDesc">Encontre uma seção ou abra diretamente um campo de busca do site.</p>'+
 '<div class="op-search-field"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5.2 5.2"/></svg>'+
 '<input type="search" id="opQuickSearchInput" aria-label="Buscar seções e ações" role="combobox" aria-autocomplete="list" aria-controls="opQuickSearchResults" aria-expanded="true" autocomplete="off" placeholder="Editais, OitavaFest, reuniões, projetos..."/><kbd>Esc</kbd></div>'+
 '<div id="opQuickSearchResults" class="op-search-results" role="listbox" aria-label="Resultados da busca"></div>'+
 '<div class="op-search-footer"><span>↑↓ Navegar &nbsp; ↵ Abrir</span><span>Busca local, sem envio de dados</span></div>'+
 '</section>';
 document.body.appendChild(modal);
 const field=document.getElementById('opQuickSearchInput');
 const results=document.getElementById('opQuickSearchResults');
 const top=document.createElement('button');
 top.id='opBackToTop';top.className='op-back-top';top.type='button';
 top.setAttribute('aria-label','Voltar ao início da Central');
 top.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6M12 8v12"/></svg><span>Topo</span>';
 top.hidden=true;
 document.body.appendChild(top);
 const progress=document.createElement('div');
 progress.className='op-reading-progress';
 progress.setAttribute('role','presentation');
 progress.innerHTML='<span id="opReadingProgressBar"></span>';
 document.body.appendChild(progress);
 const bar=progress.firstChild;
 let active=0;
 let current=[];
 let restoreFocus=null;
 let previousOverflow='';
 let ticking=false;
 function render(query=''){
   current=searchDestinations(query);
   active=0;
   results.innerHTML=current.length?current.map((item,i)=>
     '<button class="op-search-result'+(i===0?' is-selected':'')+'" type="button" role="option" aria-selected="'+(i===0)+'" data-result-index="'+i+'" id="op-search-option-'+i+'">'+
     '<span class="op-search-result-mark">'+(item.target?'↳':'↗')+'</span>'+
     '<span class="op-search-result-copy"><small>'+esc(item.group)+'</small><strong>'+esc(item.label)+'</strong><em>'+esc(item.description)+'</em></span>'+
     '<span class="op-search-result-arrow" aria-hidden="true">↗</span></button>'
     ).join(''):'<div class="op-search-empty"><strong>Nenhum atalho encontrado.</strong><span>Tente “edital”, “café”, “Giovanna” ou “projetos”.</span></div>';
   field.setAttribute('aria-activedescendant',current.length?'op-search-option-0':'');
 }
 function setSelected(index){
   if(!current.length)return;
   active=(index+current.length)%current.length;
   results.querySelectorAll('[data-result-index]').forEach((button,i)=>{
     const selected=i===active;
     button.classList.toggle('is-selected',selected);
     button.setAttribute('aria-selected',String(selected));
     if(selected)button.scrollIntoView({block:'nearest'});
   });
   field.setAttribute('aria-activedescendant','op-search-option-'+active);
 }
 function close(){
   if(modal.hidden)return;
   modal.hidden=true;
   trigger.setAttribute('aria-expanded','false');
   document.body.style.overflow=previousOverflow;
   field.value='';
   const focus=restoreFocus;
   restoreFocus=null;
   if(focus && typeof focus.focus==='function' && focus.isConnected)focus.focus();
 }
 function open(){
   if(!modal.hidden)return;
   restoreFocus=document.activeElement;
   previousOverflow=document.body.style.overflow;
   modal.hidden=false;
   trigger.setAttribute('aria-expanded','true');
   document.body.style.overflow='hidden';
   field.value='';
   render();
   header.querySelectorAll('[data-nav-trigger]').forEach(button=>{
     button.setAttribute('aria-expanded','false');
     const panel=header.querySelector('[data-nav-panel="'+button.dataset.navTrigger+'"]');
     if(panel)panel.hidden=true;
   });
   navClose();
   field.focus();
 }
 function navClose(){
   document.getElementById('nav')?.classList.remove('open');
   const mobile=document.getElementById('menuButton');
   mobile?.setAttribute('aria-expanded','false');
   mobile?.setAttribute('aria-label','Abrir menu de navegação');
   const label=mobile?.querySelector('.op-mobile-toggle-label');
   if(label)label.textContent='Menu';
 }
 function go(item){
   if(!item)return;
   close();
   const dest=document.getElementById(item.target||item.id);
   if(!dest)return;
   if(!dest.hasAttribute('tabindex'))dest.setAttribute('tabindex','-1');
   dest.focus({preventScroll:true});
   if(window.location.hash!=='#'+dest.id)history.replaceState(null,'','#'+dest.id);
   dest.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
   if(item.target){
     // O alvo pode estar numa seção mais abaixo, porém o campo já está presente.
     window.setTimeout(()=>{const input=document.getElementById(item.id);if(input){input.focus({preventScroll:true});input.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});}},200);
   }
 }
 trigger.addEventListener('click',()=>modal.hidden?open():close());
 modal.addEventListener('click',e=>{
   if(e.target.closest('[data-search-close]')){close();return;}
   const button=e.target.closest('[data-result-index]');
   if(button)go(current[Number(button.dataset.resultIndex)]);
 });
 field.addEventListener('input',()=>render(field.value));
 field.addEventListener('keydown',e=>{
   if(e.key==='ArrowDown'){e.preventDefault();setSelected(active+1);}
   if(e.key==='ArrowUp'){e.preventDefault();setSelected(active-1);}
   if(e.key==='Enter'){e.preventDefault();go(current[active]);}
 });
 document.addEventListener('keydown',e=>{
   const key=e.key.toLowerCase();
   if((e.ctrlKey||e.metaKey)&&key==='k'){
     e.preventDefault();if(modal.hidden)open();else close();return;
   }
   if(e.key==='Escape'&&!modal.hidden){e.preventDefault();close();return;}
   if(e.key==='Tab'&&!modal.hidden){
     const controls=[modal.querySelector('[data-search-close]'),field,...Array.from(results.querySelectorAll('button'))];
     const available=controls.filter(Boolean);
     const index=available.indexOf(document.activeElement);
     if(e.shiftKey&&index===0){e.preventDefault();available[available.length-1].focus();}
     else if(!e.shiftKey&&index===available.length-1){e.preventDefault();available[0].focus();}
   }
 });
 function scrollTick(){
   ticking=false;
   const scroll=window.scrollY||document.documentElement.scrollTop||0;
   const total=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
   const fraction=total?Math.min(100,Math.max(0,scroll/total*100)):0;
   bar.style.width=fraction.toFixed(2)+'%';
   top.hidden=scroll<650;
   header.classList.toggle('op-is-compact',scroll>180);
 }
 function scrollUpdate(){
   if(ticking)return;
   ticking=true;
   requestAnimationFrame(scrollTick);
 }
 top.addEventListener('click',()=>{
   const dest=document.getElementById('inicio-editorial');
   if(dest)dest.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
   else window.scrollTo({top:0,behavior:'smooth'});
 });
 window.addEventListener('scroll',scrollUpdate,{passive:true});
 window.addEventListener('resize',scrollUpdate,{passive:true});
 scrollUpdate();
}
const api={DESTINATIONS,ACTIONS,searchDestinations,normalize};
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
}
})(typeof window!=='undefined'?window:null);
