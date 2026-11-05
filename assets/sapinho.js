/* Uma visita surpresa: 20% de chance em cada entrada, sem intervalo entre visitas. */
(function(){
'use strict';
const CHANCE=.2;
const MESSAGES=[
 'Passei só para desejar boas ideias. Croac!',
 'Uma pausa pequena para uma ideia grande. Croac!',
 'Tem história boa nascendo por aqui. Croac!',
 'O roteiro ainda não tem sapo? Agora tem. Croac!'
];
const SOUNDS=[
 {id:'sapo',name:'Coaxar de sapo',caption:'Croac, croac!',notes:[
  [160,65,0,.21,'sawtooth',.06,850,4],
  [160,65,.24,.21,'sawtooth',.06,850,4],
  [160,65,.48,.21,'sawtooth',.06,850,4]
 ]},
 {id:'gota',name:'Gota de água',caption:'Ploc!',notes:[
  [950,260,0,.16,'sine',.055,2400,.5],
  [1200,400,.22,.14,'sine',.045,2400,.5]
 ]},
 {id:'passaro',name:'Passarinho',caption:'Piu-piu!',notes:[
  [1700,2500,0,.13,'sine',.04,4000,.5],
  [1900,3100,.18,.13,'sine',.04,4000,.5]
 ]},
 {id:'sino',name:'Sininho',caption:'Plim!',notes:[
  [1047,1037,0,.28,'sine',.04,5000,.5],
  [1319,1306,.13,.28,'sine',.035,5000,.5],
  [1568,1552,.26,.28,'sine',.03,5000,.5]
 ]},
 {id:'madeira',name:'Batida de madeira',caption:'Toc-toc!',notes:[
  [190,90,0,.07,'triangle',.06,1000,.8],
  [230,100,.16,.07,'triangle',.05,1000,.8]
 ]}
];
function chooseSound(roll,lastId){
 const pool=SOUNDS.filter(sound=>sound.id!==lastId);
 const value=Number.isFinite(roll)?Math.max(0,Math.min(.999999,roll)):0;
 return pool[Math.floor(value*pool.length)];
}
function playSound(context,sound){
 const start=context.currentTime+.03;
 for(const [from,to,delay,duration,type,volume,cutoff,q] of sound.notes){
  const t=start+delay,osc=context.createOscillator(),filter=context.createBiquadFilter(),gain=context.createGain();
  osc.type=type;osc.frequency.setValueAtTime(from,t);osc.frequency.exponentialRampToValueAtTime(to,t+duration);
  filter.type='lowpass';filter.frequency.value=cutoff;filter.Q.value=q;
  gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(volume,t+Math.min(.025,duration/3));gain.gain.exponentialRampToValueAtTime(.001,t+duration);
  osc.connect(filter);filter.connect(gain);gain.connect(context.destination);osc.start(t);osc.stop(t+duration+.01);
 }
 return Math.ceil((Math.max(...sound.notes.map(n=>n[2]+n[3]))+.15)*1000);
}
function shouldVisit(roll){return Number.isFinite(roll)&&roll>=0&&roll<CHANCE;}
function chooseMessage(roll){return MESSAGES[Math.max(0,Math.min(MESSAGES.length-1,Math.floor((Number.isFinite(roll)?roll:0)*MESSAGES.length)))];}
function init(){
 if(!shouldVisit(Math.random()))return;
 window.setTimeout(()=>{
  if(document.hidden||Array.from(document.querySelectorAll('[aria-modal="true"]:not([hidden])')).some(el=>el.getClientRects().length)||document.activeElement?.matches('input,textarea,select'))return;
  const card=document.createElement('aside');
  card.className='op-frog-visit';card.setAttribute('aria-label','Uma visita do sapinho');
  card.innerHTML='<button type="button" class="op-frog-close" aria-label="Fechar visita do sapinho">×</button>'+
   '<img src="./assets/sapinho-japones.webp" width="120" height="120" alt="Sapo viajante japonês com chapéu de palha kasa, faixa na cintura e traço de nanquim"/>'+
   '<div class="op-frog-copy"><small>UMA VISITA RARA</small><h2>Olha quem apareceu.</h2><p class="op-frog-message"></p>'+
   '<button type="button" class="op-frog-sound" title="Tocar um som surpresa, incluindo o coaxar de sapo">Ouvir croac</button><span class="op-frog-feedback" role="status" aria-live="polite"></span></div>';
  card.querySelector('.op-frog-message').textContent=chooseMessage(Math.random());
  document.body.appendChild(card);
  const close=card.querySelector('.op-frog-close'),sound=card.querySelector('.op-frog-sound'),feedback=card.querySelector('.op-frog-feedback');
  let context=null,finished=false,lastSound=null;
  function dismiss(){
   finished=true;
   if(context)context.close().catch(()=>{});
   const hadFocus=card.contains(document.activeElement);
   card.remove();
   document.removeEventListener('keydown',escape);
   if(hadFocus)document.getElementById('opQuickSearchTrigger')?.focus({preventScroll:true});
  }
  function escape(e){if(e.key==='Escape'&&card.contains(document.activeElement))dismiss();}
  close.addEventListener('click',dismiss);document.addEventListener('keydown',escape);
  sound.addEventListener('click',async()=>{
   if(sound.disabled||finished)return;
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(!Audio){feedback.textContent='O áudio não está disponível neste navegador.';return;}
   const selected=chooseSound(Math.random(),lastSound);
   sound.disabled=true;feedback.textContent='';
   try{
    context=new Audio();await context.resume();
    if(finished)return;
    // Sons curtos e suaves sintetizados localmente, somente após o clique.
    const duration=playSound(context,selected);lastSound=selected.id;
    card.classList.add('op-frog-is-playing');sound.textContent='Tocando…';feedback.textContent=selected.name+' · '+selected.caption;
    window.setTimeout(()=>{
     context?.close().catch(()=>{});context=null;
     if(finished)return;
     card.classList.remove('op-frog-is-playing');sound.disabled=false;sound.textContent='Ouvir outro som';feedback.textContent=selected.name+' · '+selected.caption;
    },duration);
   }catch{
    context?.close().catch(()=>{});context=null;
    if(!finished){sound.disabled=false;sound.textContent='Tentar ouvir';feedback.textContent='Não foi possível tocar. Você pode tentar novamente.';}
   }
  });
 },5000);
}
if(typeof module==='object'&&module.exports)module.exports={CHANCE,shouldVisit,chooseMessage,SOUNDS,chooseSound,playSound};
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
}
})();
