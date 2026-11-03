const test=require('node:test'),assert=require('node:assert/strict');
const {SOUNDS,chooseSound,playSound}=require('../docs/assets/sapinho.js');
test('sorteio inclui sapo e quatro sons alternativos',()=>{
 const samples=new Set(Array.from({length:100},(_,i)=>chooseSound(i/100).id));
 assert.deepEqual(samples,new Set(['sapo','gota','passaro','sino','madeira']));
});
test('cliques consecutivos não repetem o mesmo som e extremos são seguros',()=>{
 for(const last of SOUNDS)for(const roll of [0,.25,.5,.99,1,-1,NaN,Infinity]){
  const next=chooseSound(roll,last.id);assert.ok(next);assert.notEqual(next.id,last.id);
 }
});
test('síntese termina, usa volume suave e desconecta naturalmente ao parar',()=>{
 for(const sound of SOUNDS){
  let started=0,stopped=0;const peaks=[];
  const ctx={currentTime:1,destination:{},
   createOscillator:()=>({frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){started++},stop(){stopped++}}),
   createBiquadFilter:()=>({frequency:{},Q:{},connect(){}}),
   createGain:()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(v){peaks.push(v)}},connect(){}})
  };
  const duration=playSound(ctx,sound);
  assert.equal(started,sound.notes.length);assert.equal(stopped,started);
  assert.ok(duration>0&&duration<1200);
  assert.ok(peaks.every(v=>v>0&&v<=.06));
 }
});
