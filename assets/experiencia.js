/* Oitava Parede · direção visual e navegação por cenas. Sem dependências externas. */
(function(){
'use strict';
const SCENES=[
 {id:'radar',label:'Radar',tag:'01 / PESQUISAR',title:'Fomento em<br>perspectiva.',description:'Consulte editais, resultados e mudanças nas fontes públicas. Cada decisão começa com a leitura do documento original.',href:'#monitor',action:'Abrir radar de editais',metric:'monitorDocs',unit:'publicações localizadas',summary:'Documentos no radar'},
 {id:'projetos',label:'Projetos',tag:'02 / ACOMPANHAR',title:'Seu projeto,<br>em cada etapa.',description:'Títulos inscritos, documentos de referência e o histórico por ano. Um lugar para acompanhar cada próxima etapa.',href:'#catalogo-projetos',action:'Ver projetos e inscrições',metric:'opCatalogCount',unit:'registros na seleção',summary:'Projetos & inscrições'},
 {id:'agenda',label:'Agenda',tag:'03 / CIRCULAR',title:'A cidade como<br>repertório.',description:'Cinema, música, arte e encontros com a cultura. Encontre seu próximo programa e crie um convite para a equipe.',href:'#agenda',action:'Explorar a agenda',metric:'opEventCount',unit:'eventos na seleção',summary:'Agenda cultural'},
 {id:'encontros',label:'Encontros',tag:'04 / CONECTAR',title:'Ideias pedem<br>um encontro.',description:'Um café, uma conversa, um novo projeto. Descubra lugares, salve seus favoritos ou cadastre um ponto do seu jeito.',href:'#reunioes',action:'Escolher um lugar',metric:'opPlaceCount',unit:'lugares na seleção',summary:'Pontos de encontro'}
];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function metricNumber(text){const match=String(text??'').match(/^\s*((?:\d{1,3}(?:\.\d{3})+|\d+))(?=\s|$)/);return match?Number(match[1].replaceAll('.','')):null;}
function nextScene(index,key,total=SCENES.length){if(!Number.isInteger(total)||total<1)return 0;if(key==='Home')return 0;if(key==='End')return total-1;if(key==='ArrowRight')return (index+1)%total;if(key==='ArrowLeft')return (index+total-1)%total;return index;}
const formatMetric=value=>value===null?'—':value.toLocaleString('pt-BR');
function mountHome(){
 const home=document.getElementById('inicio-editorial');if(!home||document.getElementById('opSceneStage'))return false;
 const hero=home.querySelector('.ed-hero');if(!hero)return false;
 hero.className='op-cinema-hero';
 hero.innerHTML='<div class="op-cinema-copy"><div class="op-cinema-kicker"><span aria-hidden="true"></span>OITAVA PAREDE / CENTRAL DO COLETIVO</div><h1>A próxima<br><em>cena</em> começa<br>por aqui.</h1><p>Editais para tirar ideias do papel. Cultura para ampliar o olhar. Encontros para fazer acontecer.</p><div class="op-cinema-actions"><a href="#monitor" class="op-main-cta">Encontrar possibilidades <span aria-hidden="true">↗</span></a><button type="button" id="opHomeSearch" class="op-search-cta">Buscar na central <span aria-hidden="true">⌕</span></button></div><span class="op-cinema-signature">FILMES · IMAGENS · CULTURA · CONEXÕES</span></div>'+
 '<div class="op-scene-stage" id="opSceneStage"><div class="op-scene-top"><span>ESCOLHA O SEU PRÓXIMO PASSO</span><span class="op-scene-live"><i aria-hidden="true"></i> NO COLETIVO</span></div><div class="op-scene-tabs" role="tablist" aria-label="Explore a central por tarefa">'+SCENES.map((scene,i)=>'<button type="button" role="tab" id="opSceneTab'+i+'" aria-controls="opScenePanel" aria-selected="'+(i===0)+'" tabindex="'+(i===0?'0':'-1')+'" data-scene="'+i+'"><small aria-hidden="true">0'+(i+1)+'</small>'+esc(scene.label)+'</button>').join('')+'</div><div class="op-scene-panel" id="opScenePanel" role="tabpanel" tabindex="0" aria-labelledby="opSceneTab0"><span class="op-scene-watermark" id="opSceneNumber" aria-hidden="true">01</span><div class="op-scene-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="op-scene-content"><span id="opSceneTag" class="op-scene-tag"></span><h2 id="opSceneTitle"></h2><p id="opSceneDescription"></p><div class="op-scene-bottom"><a id="opSceneAction" class="op-scene-action"></a><div class="op-scene-metric"><strong id="opSceneMetric">—</strong><span id="opSceneUnit"></span></div></div></div></div><div class="op-scene-foot"><span>DA IDEIA AO ENCONTRO.</span><span id="opScenePosition">01 / 04</span></div></div>';
 const modules=home.querySelector('.ed-modules');
 if(modules){modules.className='op-home-index';modules.setAttribute('aria-label','A central em números e ações');modules.innerHTML=SCENES.map((scene,i)=>'<a class="op-index-item" href="'+scene.href+'"><span class="op-index-number">0'+(i+1)+'</span><div><span class="op-index-label">'+esc(scene.summary)+'</span><p><strong data-scene-count="'+i+'">—</strong><span>'+esc(scene.unit)+'</span></p></div><span class="op-index-arrow" aria-hidden="true">↗</span></a>').join('');}
 return true;
}
function init(){
 if(!mountHome())return;
 document.documentElement.classList.add('op-experience');
 const stage=document.getElementById('opSceneStage'),tabs=Array.from(stage.querySelectorAll('[data-scene]')),panel=document.getElementById('opScenePanel');
 let active=0,scheduled=false;
 const setText=(id,value)=>{const el=document.getElementById(id);if(el&&el.textContent!==value)el.textContent=value;};
 function updateMetrics(){
  SCENES.forEach((scene,i)=>{const source=document.getElementById(scene.metric),value=formatMetric(metricNumber(source?.textContent));document.querySelectorAll('[data-scene-count="'+i+'"]').forEach(node=>{if(node.textContent!==value)node.textContent=value;});if(i===active)setText('opSceneMetric',value);});
 }
 function activate(index,focus=false){
  if(!SCENES[index])return;
  active=index;const scene=SCENES[index];
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
  panel.setAttribute('aria-labelledby','opSceneTab'+index);
  setText('opSceneTag',scene.tag);document.getElementById('opSceneTitle').innerHTML=scene.title;
  setText('opSceneDescription',scene.description);setText('opSceneUnit',scene.unit);
  const action=document.getElementById('opSceneAction');action.href=scene.href;action.innerHTML=esc(scene.action)+' <span aria-hidden="true">↗</span>';
  setText('opSceneNumber',String(index+1).padStart(2,'0'));setText('opScenePosition',String(index+1).padStart(2,'0')+' / 04');
  stage.dataset.scene=scene.id;updateMetrics();if(focus)tabs[index].focus();
 }
 stage.querySelector('[role="tablist"]').addEventListener('click',e=>{const tab=e.target.closest('[data-scene]');if(tab)activate(Number(tab.dataset.scene));});
 stage.querySelector('[role="tablist"]').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();activate(nextScene(active,e.key),true);});
 document.getElementById('opHomeSearch').addEventListener('click',()=>document.getElementById('opQuickSearchTrigger')?.click());
 activate(0);
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const seen=new WeakSet();
 const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){if(!reduced.matches)entry.target.classList.add('op-arrived');observer.unobserve(entry.target);}},{threshold:.06}):null;
 function decorate(){
  scheduled=false;updateMetrics();
  if(observer)document.querySelectorAll('.ed-pulse-main,.ed-pulse-card,.ed-program,.op-event-card,.op-place-card,.op-catalog-card,.op-festival-card').forEach(node=>{if(!seen.has(node)){seen.add(node);observer.observe(node);}});
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(decorate);}
 const watch=new MutationObserver(schedule);watch.observe(document.querySelector('main'),{subtree:true,childList:true});decorate();
 const fine=window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
 let pointerFrame=0,point=null,rect=null;
 stage.addEventListener('pointerenter',()=>{if(fine.matches)rect=stage.getBoundingClientRect();});
 stage.addEventListener('pointermove',e=>{if(!fine.matches||!rect)return;point={x:e.clientX,y:e.clientY};if(pointerFrame)return;pointerFrame=requestAnimationFrame(()=>{pointerFrame=0;if(!point)return;stage.style.setProperty('--spot-x',Math.round((point.x-rect.left)/rect.width*100)+'%');stage.style.setProperty('--spot-y',Math.round((point.y-rect.top)/rect.height*100)+'%');});});
 stage.addEventListener('pointerleave',()=>{point=null;stage.style.removeProperty('--spot-x');stage.style.removeProperty('--spot-y');});
 const share=document.getElementById('opCopyCentral');
 share?.addEventListener('click',async()=>{
  const url=new URL(location.href);url.hash='';url.search='';const text=url.href;
  const status=document.getElementById('opCentralShareStatus');
  try{await navigator.clipboard.writeText(text);status.textContent='Link copiado. Compartilhe com a equipe.';}
  catch{status.textContent='Copie este endereço: '+text;}
 });
}
const api={SCENES,metricNumber,nextScene};
if(typeof module==='object'&&module.exports)module.exports=api;
// O script defer pode rodar em interactive, antes dos componentes que aguardam DOMContentLoaded.
if(typeof document!=='undefined'){if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
})();
