/* Uma visita rara: 3% das sessões, com intervalo mínimo de 14 dias por navegador. */
(function(){
'use strict';
const CHANCE=.03,COOLDOWN=14*24*60*60*1000;
const LAST='oitava_sapinho_ultima_visita_v1',SESSION='oitava_sapinho_sessao_v1';
const MESSAGES=[
 'Passei só para desejar boas ideias. Croac!',
 'Uma pausa pequena para uma ideia grande. Croac!',
 'Tem história boa nascendo por aqui. Croac!',
 'O roteiro ainda não tem sapo? Agora tem. Croac!'
];
function shouldVisit(now,last,roll,seen){
 if(seen||!Number.isFinite(now)||!Number.isFinite(roll)||roll<0||roll>=CHANCE)return false;
 if(last!==null&&(!Number.isFinite(last)||now-last<COOLDOWN))return false;
 return true;
}
function chooseMessage(roll){return MESSAGES[Math.max(0,Math.min(MESSAGES.length-1,Math.floor((Number.isFinite(roll)?roll:0)*MESSAGES.length)))];}
function init(){
 let last;
 try{
  const seen=sessionStorage.getItem(SESSION)==='1';
  const raw=localStorage.getItem(LAST);last=raw===null?null:Number(raw);
  sessionStorage.setItem(SESSION,'1');
  if(!shouldVisit(Date.now(),last,Math.random(),seen))return;
 }catch{return;} // Sem armazenamento, evite repetir a visita em cada carregamento.
 window.setTimeout(()=>{
  if(document.hidden||Array.from(document.querySelectorAll('[aria-modal="true"]:not([hidden])')).some(el=>el.getClientRects().length)||document.activeElement?.matches('input,textarea,select'))return;
  // Só inicia o intervalo quando a visita realmente aparece.
  try{localStorage.setItem(LAST,String(Date.now()));}catch{return;}
  const card=document.createElement('aside');
  card.className='op-frog-visit';card.setAttribute('aria-label','Uma visita do sapinho');
  card.innerHTML='<button type="button" class="op-frog-close" aria-label="Fechar visita do sapinho">×</button>'+
   '<img src="./assets/sapinho-japones.webp" width="120" height="120" alt="Sapo viajante japonês com chapéu de palha kasa, faixa na cintura e traço de nanquim"/>'+
   '<div class="op-frog-copy"><small>UMA VISITA RARA</small><h2>Olha quem apareceu.</h2><p class="op-frog-message"></p>'+
   '<button type="button" class="op-frog-sound">Ouvir croac</button><span class="op-frog-feedback" role="status" aria-live="polite"></span></div>';
  card.querySelector('.op-frog-message').textContent=chooseMessage(Math.random());
  document.body.appendChild(card);
  const close=card.querySelector('.op-frog-close'),sound=card.querySelector('.op-frog-sound'),feedback=card.querySelector('.op-frog-feedback');
  let context=null,finished=false;
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
   if(!Audio){feedback.textContent='Croac, croac! O áudio não está disponível neste navegador.';return;}
   sound.disabled=true;feedback.textContent='';
   try{
    context=new Audio();await context.resume();
    if(finished)return;
    // Coaxar curto e suave, sintetizado localmente, sem arquivos ou serviços externos.
    const start=context.currentTime+.03;
    for(let i=0;i<3;i++){
     const t=start+i*.24,osc=context.createOscillator(),filter=context.createBiquadFilter(),gain=context.createGain();
     osc.type='sawtooth';osc.frequency.setValueAtTime(160,t);osc.frequency.exponentialRampToValueAtTime(65,t+.18);
     filter.type='lowpass';filter.frequency.value=850;filter.Q.value=4;
     gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.065,t+.035);gain.gain.exponentialRampToValueAtTime(.001,t+.2);
     osc.connect(filter);filter.connect(gain);gain.connect(context.destination);osc.start(t);osc.stop(t+.21);
    }
    card.classList.add('op-frog-is-playing');sound.textContent='Croac, croac…';
    window.setTimeout(()=>{
     context?.close().catch(()=>{});context=null;
     if(finished)return;
     card.classList.remove('op-frog-is-playing');sound.disabled=false;sound.textContent='Ouvir de novo';feedback.textContent='Croac!';
    },950);
   }catch{
    context?.close().catch(()=>{});context=null;
    if(!finished){sound.disabled=false;sound.textContent='Tentar ouvir';feedback.textContent='Não foi possível tocar. Você pode tentar novamente.';}
   }
  });
 },5000);
}
if(typeof module==='object'&&module.exports)module.exports={CHANCE,COOLDOWN,shouldVisit,chooseMessage};
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
}
})();
