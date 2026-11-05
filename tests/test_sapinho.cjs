const test=require('node:test'),assert=require('node:assert/strict');
const {CHANCE,shouldVisit,chooseMessage}=require('../docs/assets/sapinho.js');
test('sapinho tem 20% de chance em cada entrada',()=>{
 assert.equal(CHANCE,.2);
 assert.equal(shouldVisit(0),true);
 assert.equal(shouldVisit(.199999),true);
 assert.equal(shouldVisit(.2),false);
 assert.equal(shouldVisit(.99),false);
});
test('uma em cinco possibilidades elegíveis em distribuição uniforme',()=>{
 const visits=Array.from({length:1000},(_,i)=>shouldVisit(i/1000)).filter(Boolean);
 assert.equal(visits.length,200);
});
test('sorteios inválidos não exibem a visita',()=>{
 for(const roll of [NaN,Infinity,-Infinity,-1,1,null,undefined,'0.1'])assert.equal(shouldVisit(roll),false);
});
test('mensagens variam e permanecem válidas nos extremos',()=>{
 assert.notEqual(chooseMessage(0),chooseMessage(.99));
 for(const x of [0,.25,.5,.99,1,NaN,-1])assert.match(chooseMessage(x),/Croac!/);
});
