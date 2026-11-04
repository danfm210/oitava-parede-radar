/* Oitava Parede: informações por escolha, grafismos fora das áreas de leitura. */
(function(root){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function partition(rows,limit=3){
 const items=Array.isArray(rows)?rows:[],size=Number.isInteger(limit)&&limit>0?limit:3;
 return {preview:items.slice(0,size),remaining:items.slice(size),total:items.length};
}
function collectionMarkup(rows,card,{kind='events',unit='eventos',expanded=false,limit=3}={}){
 const {preview,remaining,total}=partition(rows,limit);
 if(typeof card!=='function')return '';
 const first=preview.map(card).join('');
 if(!remaining.length)return first;
 const key=String(kind).replace(/[^a-z0-9_-]/gi,'');
 return first+'<details class="op-collection-more" id="opMore-'+key+'" data-collection="'+key+'"'+(expanded?' open':'')+'><summary><span><strong><span class="op-more-closed">Ver mais '+remaining.length+' '+esc(unit)+'</span><span class="op-more-open">Recolher lista de '+esc(unit)+'</span></strong><small>'+preview.length+' de '+total+' à vista na prévia</small></span><span class="op-fold-plus" aria-hidden="true">+</span></summary><div class="op-collection-grid">'+remaining.map(card).join('')+'</div><div class="op-collection-end"><button type="button" data-collection-close>Recolher '+esc(unit)+' adicionais <span aria-hidden="true">↑</span></button></div></details>';
}
function renderCollection(target,rows,card,options={}){
 const key=options.key||'',previous=target.querySelector('.op-collection-more');
 const expanded=target.dataset.collectionKey===key?Boolean(previous?.open):Boolean(options.expanded);
 const active=target.contains(document.activeElement)?document.activeElement:null;
 const focusKey=['data-favevent','data-favplace'].find(attr=>active?.hasAttribute(attr));
 const focusValue=focusKey?active.getAttribute(focusKey):'';
 target.dataset.collectionKey=key;
 target.innerHTML=collectionMarkup(rows,card,{...options,expanded});
 if(focusKey)Array.from(target.querySelectorAll('['+focusKey+']')).find(node=>node.getAttribute(focusKey)===focusValue)?.focus({preventScroll:true});
}
function revealTarget(target){
 if(!target)return false;
 let changed=false;
 const own=target.matches?.('.op-section-menu')?target:target.querySelector?.(':scope > .op-section-menu, :scope > .wrap > .op-section-menu');
 const open=details=>{if(details&&!details.open){details.open=true;changed=true;}};
 open(own);
 for(let node=target;node;node=node.parentElement)if(node.tagName==='DETAILS')open(node);
 return changed;
}
const ICONS={
 frame:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4"/>',
 reel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="7" r="1.8"/><circle cx="7.5" cy="14.5" r="1.8"/><circle cx="16.5" cy="14.5" r="1.8"/>',
 slate:'<path d="M3 10h18v10H3zM3 10l-1-5 18-3 1 5zM7 4l3 4M14 3l3 4M7 14h10"/>',
 sound:'<path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4"/>'
};
function fold(host,{description,icon='frame',id=''}={}){
 if(!host||host.dataset.foldReady)return null;
 const title=host.querySelector('h2,h3');if(!title)return null;
 host.dataset.foldReady='true';
 const body=document.createElement('div');body.className='op-fold-body';
 while(host.firstChild)body.appendChild(host.firstChild);
 const details=document.createElement('details');details.className='op-section-menu';if(id)details.id=id;
 const summary=document.createElement('summary');
 summary.innerHTML='<span class="op-fold-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" focusable="false">'+(ICONS[icon]||ICONS.frame)+'</svg></span><span class="op-fold-label"></span><span class="op-fold-plus" aria-hidden="true">+</span>';
 title.classList.add('op-fold-title');summary.querySelector('.op-fold-label').appendChild(title);
 const note=document.createElement('small');note.textContent=description||'Abra para consultar as informações.';summary.querySelector('.op-fold-label').appendChild(note);
 details.append(summary,body);host.appendChild(details);
 const close=document.createElement('button');close.type='button';close.className='op-fold-close';close.setAttribute('data-section-close','');close.textContent='Recolher esta seção ↑';body.appendChild(close);
 return details;
}
function ornament(parent,file,cls,{width=144,height=120,eager=false}={}){
 if(!parent)return;const image=document.createElement('img');image.className=cls;image.src='./assets/'+file;image.alt='';image.setAttribute('aria-hidden','true');image.setAttribute('draggable','false');image.loading=eager?'eager':'lazy';image.decoding='async';if(eager)image.fetchPriority='high';image.width=width;image.height=height;parent.appendChild(image);return image;
}
function mountIllustrations(){
 const hero=document.querySelector('.op-cinema-hero'),stage=document.getElementById('opSceneStage');
 if(hero&&stage){
  const artwork=document.createElement('figure');artwork.className='op-hero-illustration';artwork.setAttribute('aria-hidden','true');
  ornament(artwork,'tentaculos-cinema-editorial.webp','op-hero-art',{width:1312,height:1199,eager:true});
  hero.appendChild(artwork);hero.after(stage);stage.classList.add('op-stage-compact');
 }
 const signature=document.querySelector('.op-cinema-signature');
 if(signature){const label=document.createElement('span');label.textContent=signature.textContent;signature.textContent='';signature.appendChild(label);}
 const sceneFoot=document.querySelector('.op-scene-foot');
 if(sceneFoot){const position=sceneFoot.lastElementChild,film=document.createElement('span');film.className='op-scene-film';film.setAttribute('aria-hidden','true');film.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">'+ICONS.reel+'</svg>';sceneFoot.insertBefore(film,position);}
 for(const [id,file,width,height] of [['agenda','cinema-editorial.webp',1536,1024],['reunioes','tentaculos-cinema-editorial.webp',1312,1199]]){
  const badge=document.querySelector('#'+id+' .op-header-badge');if(!badge)continue;
  const visual=document.createElement('div');visual.className='op-header-visual';badge.before(visual);ornament(visual,file,'op-header-ornament',{width,height});visual.appendChild(badge);
 }
}
function init(){
 if(!document.querySelector('main')||document.documentElement.classList.contains('op-art-direction'))return;
 document.documentElement.classList.add('op-art-direction');
 for(const [id,description,icon] of [
  ['visao','Panorama, publicações de referência e atalhos para pesquisa.','reel'],
  ['fontes','Portais oficiais por região e buscas direcionadas.','frame'],
  ['oportunidades','Programas de fomento, pesquisa e perguntas frequentes.','slate'],
  ['notificacoes','Como acompanhar o radar e receber os avisos da equipe.','sound']
 ]){
  const section=document.getElementById(id);if(!section)continue;
  const host=Array.from(section.children).find(node=>node.classList.contains('wrap'))||section;
  fold(host,{description,icon});section.classList.add('op-fold-section');
 }
 const mentions=document.getElementById('monitorMentions')?.closest('.panel');
 if(mentions){fold(mentions,{description:'Possíveis menções, fontes e marcações individuais de conferência.',icon:'frame',id:'opMentionDisclosure'});mentions.classList.add('op-mentions-compact');}
 const circuit=document.getElementById('opCinemaCircuit'),portals=document.querySelector('.op-agenda-bottom');
 if(circuit)fold(circuit,{description:'Curta Santos e outros encontros do circuito audiovisual.',icon:'reel'});
 if(portals)fold(portals,{description:'Instituições e portais para ampliar a pesquisa da agenda.',icon:'frame'});
 if(circuit&&portals){
  const related=document.createElement('div');related.className='op-agenda-related';circuit.before(related);related.append(circuit,portals);
 }
 mountIllustrations();
 const compactTargets=()=>document.querySelectorAll('.op-fold-section > .op-section-menu, .op-fold-section > .wrap > .op-section-menu, .op-mentions-compact > .op-section-menu');
 const revealHash=()=>{let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=document.getElementById(id);if(revealTarget(target))requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}));};
 document.addEventListener('click',event=>{
  const anchor=event.target.closest('a[href^="#"]');
  if(anchor){let id;try{id=decodeURIComponent(anchor.getAttribute('href').slice(1));}catch{return;}revealTarget(document.getElementById(id));}
  const close=event.target.closest('[data-section-close],[data-collection-close]');
  if(close){const details=close.closest('details');if(!details)return;details.open=false;const summary=details.querySelector(':scope > summary');summary.focus({preventScroll:true});summary.scrollIntoView({behavior:'auto',block:'nearest'});}
 },true);
 window.addEventListener('hashchange',revealHash);
 window.addEventListener('op:reveal',event=>revealTarget(document.getElementById(event.detail?.id)));
 // Recalcular o destaque do cabeçalho após expandir ou recolher conteúdo.
 document.addEventListener('toggle',event=>{if(event.target.matches('.op-section-menu,.op-collection-more'))window.dispatchEvent(new Event('scroll'));},true);
 compactTargets().forEach(details=>details.open=false);
 revealHash();
}
const api={partition,collectionMarkup,renderCollection,revealTarget};
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.OitavaCompacto=api;
if(typeof document!=='undefined'){if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
})(typeof window!=='undefined'?window:null);
