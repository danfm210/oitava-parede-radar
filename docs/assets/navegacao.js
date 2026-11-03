/* Oitava Parede · navegação unificada
   Camadas: atalhos de primeira linha, menus de fontes e cultura, indicação de seção ativa.
   O botão #menuButton já recebe alternância no código principal do website.
*/
(function(root){
'use strict';
const SECTIONS=[
  'inicio-editorial','monitor','monitorMentions','catalogo-projetos','projetos','agenda',
  'reunioes','visao','fontes','oportunidades','acervo','notificacoes'
];
const MENUS={
  editais:['monitor','monitorMentions','fontes','oportunidades'],
  explorar:['visao','acervo','notificacoes']
};
const normalizeTarget=hash=>String(hash||'').replace(/^#/,'').trim();
function menuForTarget(id){
  return Object.keys(MENUS).find(key=>MENUS[key].includes(id))||null;
}
function chooseActive(positions,threshold){
 const valid=(Array.isArray(positions)?positions:[]).filter(p=>p&&typeof p.top==='number'&&Number.isFinite(p.top));
 const before=valid.filter(p=>p.top<=threshold).sort((a,b)=>b.top-a.top);
 if(before.length)return before[0].id;
 const after=valid.sort((a,b)=>a.top-b.top);
 return after.length?after[0].id:'inicio-editorial';
}
function init(){
 const header=document.querySelector('.op-header-v2');
 const nav=document.getElementById('nav');
 const mobile=document.getElementById('menuButton');
 if(!header||!nav||!mobile||nav.dataset.navigationReady)return;
 nav.dataset.navigationReady='true';
 const buttons=Array.from(nav.querySelectorAll('[data-nav-trigger]'));
 const allLinks=Array.from(nav.querySelectorAll('a[data-section]'));
 const helper=nav.querySelector('[data-nav-help]');
 const panelFor=key=>nav.querySelector('[data-nav-panel="'+key+'"]');
 const triggerFor=key=>nav.querySelector('[data-nav-trigger="'+key+'"]');
 let pending=false;
 function setDrop(key,expanded){
   const trigger=triggerFor(key),panel=panelFor(key);
   if(!trigger||!panel)return;
   trigger.setAttribute('aria-expanded',String(expanded));
   panel.hidden=!expanded;
   trigger.parentElement.classList.toggle('is-expanded',expanded);
 }
 function closeDrops(except){
   buttons.forEach(button=>{
     if(button.dataset.navTrigger!==except)setDrop(button.dataset.navTrigger,false);
   });
 }
 function mobileOpen(){return nav.classList.contains('open')}
 function setMobileLabel(){
   const open=mobileOpen();
   mobile.setAttribute('aria-expanded',String(open));
   mobile.setAttribute('aria-label',open?'Fechar menu de navegação':'Abrir menu de navegação');
   const label=mobile.querySelector('.op-mobile-toggle-label');
   if(label)label.textContent=open?'Fechar':'Menu';
 }
 function closeMobile(){
   if(!mobileOpen())return;
   nav.classList.remove('open');
   setMobileLabel();
 }
 function setActive(id){
   if(!id)return;
   allLinks.forEach(a=>{
     const match=a.dataset.section===id;
     a.classList.toggle('is-active',match);
     if(match)a.setAttribute('aria-current','location');
     else a.removeAttribute('aria-current');
   });
   buttons.forEach(button=>{
     const match=MENUS[button.dataset.navTrigger]?.includes(id);
     button.classList.toggle('is-active',Boolean(match));
   });
 }
 function scrollActive(){
   pending=false;
   const offset=header.getBoundingClientRect().height+75;
   const positions=SECTIONS.map(id=>{
     const element=document.getElementById(id);
     return element?{id,top:element.getBoundingClientRect().top}:null;
   }).filter(Boolean);
   setActive(chooseActive(positions,offset));
 }
 function requestActive(){
   if(pending)return;
   pending=true;
   requestAnimationFrame(scrollActive);
 }
 function updateOffset(){
   document.documentElement.style.setProperty('--op-nav-offset',Math.ceil(header.getBoundingClientRect().height+14)+'px');
   if(window.matchMedia('(min-width: 1041px)').matches){
     closeMobile();
     setMobileLabel();
   }
   requestActive();
 }
 buttons.forEach(button=>{
   const key=button.dataset.navTrigger;
   const panel=panelFor(key);
   if(!panel)return;
   panel.hidden=true;
   button.addEventListener('click',event=>{
     event.stopPropagation();
     const willOpen=button.getAttribute('aria-expanded')!=='true';
     closeDrops(key);
     setDrop(key,willOpen);
   });
   button.addEventListener('keydown',event=>{
     if(event.key==='ArrowDown'){
       event.preventDefault();
       closeDrops(key);
       setDrop(key,true);
       panel.querySelector('a')?.focus();
     }
   });
 });
 nav.addEventListener('click',event=>{
   const link=event.target.closest('a[data-section]');
   if(!link)return;
   closeDrops();
   closeMobile();
   setActive(link.dataset.section);
   const destination=document.getElementById(link.dataset.section);
   if(destination){
     if(!destination.hasAttribute('tabindex'))destination.setAttribute('tabindex','-1');
     destination.focus({preventScroll:true});
   }
 });
 mobile.addEventListener('click',event=>{
   // O controle original já alterna .open. Este listener sincroniza rótulos e foco.
   setMobileLabel();
   if(!mobileOpen())closeDrops();
   else if(event.detail===0)nav.querySelector('a,button')?.focus();
 });
 document.addEventListener('click',event=>{
   if(!header.contains(event.target)){
     closeDrops();
     closeMobile();
   }
 });
 document.addEventListener('keydown',event=>{
   if(event.key!=='Escape')return;
   const open=buttons.find(button=>button.getAttribute('aria-expanded')==='true');
   if(open){event.preventDefault();closeDrops();open.focus();return;}
   if(mobileOpen()){event.preventDefault();closeMobile();mobile.focus();}
 });
 helper?.addEventListener('click',()=>{
   closeDrops();
   closeMobile();
   const launch=document.getElementById('opHelpLauncher');
   if(launch)launch.click();
   else document.getElementById('notificacoes')?.scrollIntoView({behavior:'smooth',block:'start'});
 });
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(updateOffset).observe(header);
 window.addEventListener('scroll',requestActive,{passive:true});
 window.addEventListener('resize',updateOffset,{passive:true});
 window.addEventListener('hashchange',()=>{
   setActive(normalizeTarget(window.location.hash));
   requestActive();
 });
 updateOffset();
 setMobileLabel();
 const initial=normalizeTarget(window.location.hash);
 if(initial&&SECTIONS.includes(initial))setActive(initial);
 else requestActive();
}
const api={SECTIONS,MENUS,menuForTarget,chooseActive,normalizeTarget};
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
 else init();
}
})(typeof window!=='undefined'?window:null);
