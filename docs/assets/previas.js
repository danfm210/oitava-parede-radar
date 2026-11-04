/* Prévias do conteúdo real, sem abrir os menus nem duplicar suas ações. */
(function(){
'use strict';
const tidy=value=>String(value||'').replace(/\s+/g,' ').trim();
function text(node){
 if(!node)return '';
 const copy=node.cloneNode(true);
 copy.querySelectorAll('br').forEach(br=>br.replaceWith(' '));
 return tidy(copy.textContent);
}
function titles(root,selector){return [...root.querySelectorAll(selector)].map(text).filter(Boolean);}
function unique(items){return [...new Set(items.filter(Boolean))];}
function inlineShortContent(details,summary){
 const evidence=details.matches('.op-catalog-card > details'),event=details.matches('.op-event-details'),faq=Boolean(details.closest('.faq'));
 if(!evidence&&!event&&!faq)return false;
 const nodes=[...details.childNodes].filter(node=>node!==summary);
 const length=nodes.reduce((count,node)=>count+tidy(node.textContent).length,0);
 if(length>900||(evidence&&details.querySelectorAll('.op-catalog-evidence').length!==1)||(event&&details.querySelectorAll('li').length>3))return false;
 const container=document.createElement('div');container.className=details.className+' op-inline-info';if(details.id)container.id=details.id;
 const title=document.createElement(evidence?'h5':'h4');title.className='op-inline-info-title';
 const label=summary.cloneNode(true);label.querySelectorAll('.op-fold-preview').forEach(node=>node.remove());
 title.textContent=text(label).replace(/^Ver inscrição e fonte$/,'Inscrição e fonte');container.append(title,...nodes);details.replaceWith(container);return true;
}
function specification(details,summary){
 const result=(label,items,slot=summary,prose=false)=>({label,items:unique(items).slice(0,prose?1:2),slot,prose});
 if(details.matches('.op-section-menu')){
  const slot=summary.querySelector('.op-fold-label');
  if(details.id==='opMentionDisclosure')return result(titles(details,'.op-review-stats > *').join(' · ')||'Para conferir',titles(details,'.op-mention-main > strong'),slot);
  if(details.closest('#visao')){const items=titles(details,'.activity h4');return result(items.length+' referências editoriais',items,slot);}
  if(details.closest('#fontes')){const items=titles(details,'#sourcesGrid .source-card h3');return result(items.length+(items.length===1?' fonte nesta seleção':' fontes nesta seleção'),items,slot);}
  if(details.closest('#oportunidades')){const items=titles(details,'.benefit h3');return result(items.length+' caminhos de fomento',items,slot);}
  if(details.closest('#notificacoes'))return result('Configuração e próximos passos',[text(details.querySelector('#emailAlertStatus')),...titles(details,'.step-card h3')],slot);
  if(details.closest('#opCinemaCircuit')){const items=titles(details,'.op-festival-card h4');return result(items.length+' festivais e mostras',items,slot);}
  if(details.closest('.op-agenda-bottom')){const items=titles(details,'#opEventSources strong');return result(items.length+' portais de programação',items,slot);}
 }
 if(details.matches('.op-brand-disclosure')){
  const slot=summary.querySelector(':scope > span:first-child');
  if(details.closest('#marcas'))return result('Programas e políticas culturais',titles(details,'.ed-program h3'),slot);
  if(details.closest('#acervo'))return result('Acervo oficial',titles(details,'.ed-ig-copy p'),slot,true);
 }
 if(details.matches('.radar-source-section,.radar-category-section,.radar-topic-card')){
  const items=titles(details,'.is-new-file .radar-entry-title'),hasNew=items.length>0;
  if(details.matches('.radar-source-section'))return result(hasNew?'Novos nesta fonte':'Documentos nesta fonte',hasNew?items:titles(details,'.radar-entry-title'),summary.querySelector('.radar-source-name'));
  if(details.matches('.radar-category-section'))return result(hasNew?'Novos nesta modalidade':'Documentos nesta modalidade',hasNew?items:titles(details,'.radar-entry-title'),summary.querySelector('.radar-category-label'));
  return result(hasNew?'Novos neste tipo':'Prévia dos documentos',hasNew?items:titles(details,'.radar-entry-title'),summary.querySelector(':scope > div:first-child'));
 }
 if(details.matches('.radar-more'))return result('A seguir',titles(details,'.radar-entry-title'),summary.querySelector(':scope > span:first-child'));
 if(details.matches('.op-collection-more'))return result('A seguir',titles(details,'.op-event-card h3,.op-place-card h3,.op-catalog-card h4'),summary.querySelector(':scope > span:first-child'));
 if(details.matches('.op-catalog-card > details')){
  const items=titles(details,'.op-catalog-evidence p').filter(item=>/· página \d+/.test(item));
  return result(items.length>1?'Fontes da inscrição':'Fonte da inscrição',items);
 }
 if(details.matches('.op-event-details'))return result('Destaques da programação',titles(details,'li strong'));
 if(details.matches('.op-mobile-filter')){
  const controls=details.querySelector('.op-mobile-filter-content');
  if(!controls)return null;
  const active=[...controls.querySelectorAll('button[aria-pressed="true"]')];
  const selects=[...controls.querySelectorAll('select')];
  const generic=value=>!value||/^(todas?|todos?|all)$/i.test(value);
  let items=active.filter(button=>!generic(button.dataset.value)||!button.hasAttribute('data-value')).map(text);
  items.push(...selects.filter(select=>!generic(select.value)).map(select=>text(select.selectedOptions[0])));
  if(!items.length)items=[...active.map(text),...selects.map(select=>text(select.selectedOptions[0]))];
  return result('Seleção atual',items,summary.querySelector('.op-mobile-filter-label'));
 }
 if(details.matches('.op-workspace-guide'))return result('Passo a passo',titles(details,'li strong'));
 if(details.closest('.faq'))return result('Resumo',titles(details,':scope > p'),summary,true);
 return null;
}
function decorate(details){
 const summary=details.querySelector(':scope > summary');if(!summary)return;
 if(inlineShortContent(details,summary))return;
 const spec=specification(details,summary);
 let preview=summary.querySelector('.op-fold-preview');
 if(!spec?.slot||!spec.items.length){if(preview)preview.remove();return;}
 const key=JSON.stringify([spec.label,spec.items,spec.prose]);
 if(preview?.dataset.previewKey===key)return;
 if(!preview){preview=document.createElement('span');preview.className='op-fold-preview';spec.slot.appendChild(preview);}
 preview.dataset.previewKey=key;
 preview.classList.toggle('is-prose',spec.prose);
 const label=document.createElement('span');label.className='op-preview-label';label.textContent=spec.label;
 const items=document.createElement('span');items.className='op-preview-items';
 spec.items.forEach(value=>{const item=document.createElement('span');item.className='op-preview-item';item.textContent=value;items.appendChild(item);});
 preview.replaceChildren(label,items);
}
function init(){
 const main=document.querySelector('main');if(!main)return;
 let queued=false;
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;main.querySelectorAll('details').forEach(decorate);});};
 const own=node=>node.nodeType===1&&node.matches('.op-fold-preview');
 new MutationObserver(records=>{
  const changed=records.some(record=>{
   if(record.target.nodeType===1&&record.target.closest('.op-fold-preview'))return false;
   if(record.target.parentElement?.closest('.op-fold-preview'))return false;
   if(record.type==='childList'&&[...record.addedNodes,...record.removedNodes].every(own))return false;
   return true;
  });
  if(changed)schedule();
 }).observe(main,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-pressed']});
 main.addEventListener('input',schedule,true);main.addEventListener('change',schedule,true);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
