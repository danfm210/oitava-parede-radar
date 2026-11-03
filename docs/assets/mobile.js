/* Oitava Parede · atalhos por toque e filtros progressivos. Sem duplicar dados ou controles. */
(function(){
'use strict';
const DOCK_ITEMS=[
 {id:'monitor',label:'Radar',icon:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>'},
 {id:'catalogo-projetos',label:'Projetos',icon:'<path d="M3 7V5h7l2 3h9v12H3V7Z"/>'},
 {id:'agenda',label:'Agenda',icon:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>'},
 {id:'reunioes',label:'Encontros',icon:'<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 9h2a3 3 0 0 1 0 6h-2"/>'}
];
function dockForSection(id){
 if(['monitor','monitorMentions','visao'].includes(id))return 'monitor';
 if(['catalogo-projetos','projetos'].includes(id))return 'catalogo-projetos';
 return ['agenda','reunioes'].includes(id)?id:null;
}
function countFilters({cities=[],categories=[],period='all',saved=false,person='',year='',currentYear=''}={}){
 return cities.filter(x=>!['Todas','todos',''].includes(x)).length+categories.filter(x=>!['Todas','todos',''].includes(x)).length+(period&&period!=='all'?1:0)+(saved?1:0)+(person?1:0)+(year!==currentYear?1:0);
}
const svg=paths=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
function init(){
 if(document.getElementById('opMobileDock'))return;
 const mobile=window.matchMedia('(max-width: 760px)');
 const help=document.getElementById('opHelpLauncher');
 const dock=document.createElement('nav');dock.id='opMobileDock';dock.className='op-mobile-dock';dock.setAttribute('aria-label','Atalhos para uso no celular');
 dock.innerHTML=DOCK_ITEMS.map(x=>'<a href="#'+x.id+'" data-dock-target="'+x.id+'">'+svg(x.icon)+'<span>'+x.label+'</span></a>').join('');
 document.body.appendChild(dock);
 let helpMarker=null;
 if(help){
  helpMarker=document.createComment('Posição do botão de ajuda no desktop');help.before(helpMarker);
  help.insertAdjacentHTML('beforeend','<span class="op-dock-help-icon" aria-hidden="true">'+svg('<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.5 2.5 0 1 1 4.4 1.6c-1.1 1.1-2.2 1.2-2.2 3.1M12 17h.01"/>')+'</span><span class="op-dock-help-label" aria-hidden="true">Ajuda</span>');
 }
 function syncDock(id){
  const active=dockForSection(id);
  dock.querySelectorAll('[data-dock-target]').forEach(a=>{if(a.dataset.dockTarget===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 }
 window.addEventListener('op:sectionchange',e=>syncDock(e.detail?.id));
 syncDock(document.querySelector('#nav a[aria-current="location"]')?.dataset.section);
 dock.addEventListener('click',e=>{
  const link=e.target.closest('[data-dock-target]');if(!link)return;
  const nav=document.getElementById('nav');nav?.classList.remove('open');
  const menu=document.getElementById('menuButton');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Abrir menu de navegação');
  nav?.querySelectorAll('[data-nav-trigger]').forEach(b=>{b.setAttribute('aria-expanded','false');b.parentElement.classList.remove('is-expanded');});
  nav?.querySelectorAll('[data-nav-panel]').forEach(p=>p.hidden=true);
  const label=menu?.querySelector('.op-mobile-toggle-label');if(label)label.textContent='Menu';
  const target=document.getElementById(link.dataset.dockTarget);if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
 });
 const panels=[];
 function createPanel({id,root,items,title,before,count}){
  const container=document.querySelector(root);if(!container||document.getElementById(id))return;
  const entries=items.map(item=>{const node=container.querySelector(item.selector);return node?{...item,node}:null;}).filter(Boolean);
  if(entries.length!==items.length)return;
  const details=document.createElement('details');details.id=id;details.className='op-mobile-filter';
  const summary=document.createElement('summary');
  summary.innerHTML='<span class="op-mobile-filter-label">'+title+'</span><span class="op-mobile-filter-count" aria-live="polite"></span>';
  const body=document.createElement('div');body.className='op-mobile-filter-content';details.append(summary,body);
  entries.forEach(item=>{item.marker=document.createComment('Posição original de '+id);item.node.before(item.marker);item.block=document.createElement('div');item.block.className='op-mobile-filter-block';if(item.label){const label=document.createElement('span');label.className='op-mobile-filter-heading';label.textContent=item.label;item.block.appendChild(label);}body.appendChild(item.block);});
  const reference=before?container.querySelector(before):null;container.insertBefore(details,reference);
  const panel={details,entries,apply(){
   if(mobile.matches){entries.forEach(item=>item.block.appendChild(item.node));}
   else{if(details.contains(document.activeElement))details.open=false;entries.forEach(item=>item.marker.parentNode.insertBefore(item.node,item.marker.nextSibling));}
  }};
  panels.push(panel);
  let queued=false;
  function update(){queued=false;const value=count(container),text=value?value+' ativo'+(value===1?'':'s'):'';const badge=summary.querySelector('.op-mobile-filter-count');if(badge.textContent!==text)badge.textContent=text;}
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(update);};
  new MutationObserver(schedule).observe(container,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed']});
  container.addEventListener('change',schedule);container.addEventListener('input',schedule);container.addEventListener('click',schedule);
  panel.apply();update();
 }
 const selected=id=>Array.from(document.querySelectorAll('#'+id+' button[aria-pressed="true"]'),b=>b.dataset.value);
 const pressed=id=>document.getElementById(id)?.getAttribute('aria-pressed')==='true';
 const currentYear=new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric'}).format(new Date());
 createPanel({id:'opMobileEventFilters',root:'.op-event-controls',title:'Filtros da agenda',before:'#opEventSelection',items:[{selector:'#opEventCities',label:'Cidade'},{selector:'.op-period-label'},{selector:'#opEventCategories',label:'Experiência'},{selector:'#opEventSaved'},{selector:'#opEventReset'}],count:()=>countFilters({cities:selected('opEventCities'),categories:selected('opEventCategories'),period:document.getElementById('opEventPeriod')?.value,saved:pressed('opEventSaved')})});
 createPanel({id:'opMobilePlaceFilters',root:'.op-meet-controls',title:'Filtros dos locais',before:'.op-control-foot',items:[{selector:'#opMeetCities',label:'Cidade'},{selector:'#opMeetKinds',label:'Tipo de encontro'},{selector:'#opMeetSaved'},{selector:'#opMeetReset'}],count:()=>countFilters({cities:selected('opMeetCities'),categories:selected('opMeetKinds'),saved:pressed('opMeetSaved')})});
 createPanel({id:'opMobileCatalogFilters',root:'.op-catalog-toolbar',title:'Pessoa e ano do edital',items:[{selector:'label[for="opCatalogPerson"]'},{selector:'label[for="opCatalogYear"]'},{selector:'#opCatalogReset'}],count:()=>countFilters({person:document.getElementById('opCatalogPerson')?.value,year:document.getElementById('opCatalogYear')?.value,currentYear})});
 createPanel({id:'opMobileRadarFilters',root:'.radar-toolbar',title:'Tipo e modalidade',before:'.radar-search-row',items:[{selector:'.radar-toolbar-grid'}],count:container=>Array.from(container.querySelectorAll('#radarTypeFilter,#radarThemeFilter')).filter(s=>s.value!=='todos').length});
 panels.forEach(panel=>panel.entries.forEach(item=>{if(item.node.tagName==='LABEL')item.node.classList.add('op-catalog-fields-label');}));
 function applyLayout(){
  if(help&&helpMarker){if(mobile.matches)dock.appendChild(help);else helpMarker.parentNode.insertBefore(help,helpMarker.nextSibling);}
  panels.forEach(panel=>panel.apply());
 }
 mobile.addEventListener('change',applyLayout);applyLayout();
}
const api={DOCK_ITEMS,dockForSection,countFilters};
if(typeof module==='object'&&module.exports)module.exports=api;
// Aguarda os componentes que também montam a interface no DOMContentLoaded.
if(typeof document!=='undefined'){if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
})();
