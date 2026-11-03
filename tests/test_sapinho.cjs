const test=require('node:test'),assert=require('node:assert/strict');
const {CHANCE,COOLDOWN,shouldVisit,chooseMessage}=require('../docs/assets/sapinho.js');
const now=Date.UTC(2026,10,3);
test('visita é rara e respeita o limite de probabilidade',()=>{
 assert.equal(CHANCE,.03);
 assert.equal(shouldVisit(now,null,0,false),true);
 assert.equal(shouldVisit(now,null,.029,false),true);
 assert.equal(shouldVisit(now,null,.03,false),false);
 assert.equal(shouldVisit(now,null,.99,false),false);
});
test('não reaparece na mesma sessão nem antes de 14 dias',()=>{
 assert.equal(COOLDOWN,14*86400000);
 assert.equal(shouldVisit(now,null,0,true),false);
 assert.equal(shouldVisit(now,now-COOLDOWN+1,0,false),false);
 assert.equal(shouldVisit(now,now-COOLDOWN,0,false),true);
});
test('datas futuras ou corrompidas não provocam repetição',()=>{
 assert.equal(shouldVisit(now,now+1000,0,false),false);
 assert.equal(shouldVisit(now,NaN,0,false),false);
 assert.equal(shouldVisit(NaN,null,0,false),false);
 assert.equal(shouldVisit(now,null,NaN,false),false);
 assert.equal(shouldVisit(now,null,-1,false),false);
});
test('mensagens variam e permanecem válidas nos extremos',()=>{
 assert.notEqual(chooseMessage(0),chooseMessage(.99));
 for(const x of [0,.25,.5,.99,1,NaN,-1])assert.match(chooseMessage(x),/Croac!/);
});
