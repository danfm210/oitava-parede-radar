const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const funding=require('../docs/assets/fomento.js');
const site=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');

test('lista ampliada cobre fomento municipal, estadual e federal',()=>{
 assert.equal(funding.PROGRAMS.length,8);
 assert.deepEqual(new Set(funding.PROGRAMS.map(item=>item.id)),new Set([
  'promac','proac-editais','proac-icms','pnab-sp','spcine-fsa','facult-santos','ancine-fsa','lei-rouanet'
 ]));
 assert.ok(funding.PROGRAMS.every(item=>funding.isOfficialURL(item.url)));
});

test('PROMAC aparece corretamente como municipal e não estadual',()=>{
 const item=funding.PROGRAMS.find(program=>program.id==='promac');
 assert.equal(item.scope,'São Paulo (capital)');
 assert.match(item.note,/Não é um programa estadual/);
 assert.match(item.requirement,/Município de São Paulo/);
});

test('prazos mudam automaticamente de aberto para encerrado',()=>{
 const spcine=funding.PROGRAMS.find(program=>program.id==='spcine-fsa');
 assert.equal(funding.statusFor(spcine,new Date('2026-11-07T15:00:00Z')).tone,'open');
 assert.equal(funding.statusFor(spcine,new Date('2026-12-17T15:00:00Z')).tone,'closed');
 const promac=funding.PROGRAMS.find(program=>program.id==='promac');
 assert.equal(funding.statusFor(promac,new Date('2026-11-07T15:00:00Z')).tone,'closed');
});

test('site carrega o roteiro e oferece filtros das novas abrangências',()=>{
 for(const value of ['./assets/fomento.css?v=20261107-ampliado','./assets/fomento.js?v=20261107-ampliado','id="fundingChecklist"','value="capital"','value="fsa"'])assert.ok(site.includes(value),value);
 assert.match(site,/<b>8<\/b><span>programas monitorados<\/span>/);
});
