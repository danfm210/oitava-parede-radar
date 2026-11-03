const test = require('node:test');
const assert = require('node:assert/strict');
const ui = require('../docs/assets/radar-organizado.js');
test('separar resultados, editais, anexos e retificações',()=>{
 assert.equal(ui.documentType({fonte:'pnab_pg',titulo:'Resultado Inscricoes Edital 16 - 2026'}),'resultado');
 assert.equal(ui.documentType({fonte:'pnab_pg',titulo:'ANEXO 08 - Formulário de recurso'}),'anexo');
 assert.equal(ui.documentType({fonte:'pnab_pg',titulo:'RETIFICAÇÃO Resultado Inscricoes Edital 16 - 2026'}),'retificacao');
 assert.equal(ui.documentType({fonte:'diario_pg',titulo:'Publicações edição 501'}),'diario');
});
test('separar tipos de edital por modalidade conhecida e assunto',()=>{
 assert.equal(ui.documentTheme({fonte:'pnab_pg',titulo:'Resultado Inscricoes Edital 18 - 2026'}),'audiovisual');
 assert.equal(ui.documentTheme({fonte:'pnab_pg',titulo:'Resultado Inscricoes Edital 19 - 2026'}),'festivais');
 assert.equal(ui.documentTheme({fonte:'pnab_pg',titulo:'Edital 25/2026'}),'cultura');
 assert.equal(ui.documentTheme({fonte:'pnab_pg',titulo:'Edital de Bolsa Cultural de Pesquisa'}),'pesquisa');
 assert.equal(ui.documentTheme({fonte:'lpg_pg',titulo:'Fomento à produção de cinema'}),'audiovisual');
});
test('agrupar séries repetitivas sem eliminar documentos diferentes',()=>{
 const sample=[
  {id:'r16',fonte:'pnab_pg',titulo:'Resultado Inscricoes Edital 16 - 2026',url:'https://a.test/16'},
  {id:'r17',fonte:'pnab_pg',titulo:'Resultado Inscricoes Edital 17 - 2026',url:'https://a.test/17'},
  {id:'r18',fonte:'pnab_pg',titulo:'Resultado Inscricoes Edital 18 - 2026',url:'https://a.test/18'},
  {id:'r16',fonte:'pnab_pg',titulo:'Resultado Inscricoes Edital 16 - 2026',url:'https://a.test/16'},
  {id:'l1',fonte:'lpg_pg',titulo:'Edital de Audiovisual',url:'https://a.test/lgp'}
 ];
 const groups=ui.groupPublications(sample);
 assert.equal(groups.reduce((n,g)=>n+g.items.length,0),4);
 assert.ok(groups.some(g=>g.program==='pnab_pg'&&g.type==='resultado'&&g.theme==='multilinguagens'&&g.items.length===2));
 assert.ok(groups.some(g=>g.program==='pnab_pg'&&g.type==='resultado'&&g.theme==='audiovisual'&&g.items.length===1));
 assert.ok(groups.some(g=>g.program==='lpg_pg'&&g.type==='edital'));
});
test('dados ausentes nao derrubam a interface de agrupamento',()=>{
 assert.deepEqual(ui.groupPublications(null),[]);
 assert.deepEqual(ui.groupPublications([null,{},{}]),[]);
});

test('montar três níveis: programa > categoria > tipo de publicação',()=>{
 const input=[
  {id:'1',fonte:'pnab_pg',titulo:'Resultado Inscricoes Edital 18 - 2026',url:'https://a.test/1'},
  {id:'2',fonte:'pnab_pg',titulo:'Retificação Edital 18 - 2026',url:'https://a.test/2'},
  {id:'3',fonte:'pnab_pg',titulo:'Edital 19 - 2026',url:'https://a.test/3'},
  {id:'4',fonte:'lpg_pg',titulo:'Resultado audiovisual',url:'https://a.test/4'},
  {id:'5',fonte:'pnab_pg',titulo:'Resultado Inscricoes Edital 18 - 2026',url:'https://a.test/1'}
 ];
 const hierarchy=ui.buildHierarchy(ui.groupPublications(input));
 assert.equal(hierarchy.length,2);
 const pnab=hierarchy.find(p=>p.program==='pnab_pg');
 assert.equal(pnab.categories.length,2);
 const audio=pnab.categories.find(c=>c.theme==='audiovisual');
 assert.equal(audio.count,2);
 assert.deepEqual(audio.types.map(t=>t.type),['resultado','retificacao']);
 assert.equal(audio.types.reduce((n,t)=>n+t.items.length,0),2);
 const festivals=pnab.categories.find(c=>c.theme==='festivais');
 assert.equal(festivals.count,1);
 assert.equal(hierarchy.reduce((n,p)=>n+p.categories.reduce((m,c)=>m+c.count,0),0),4);
});

test('hierarquia tolera dados vazios',()=>{
 assert.deepEqual(ui.buildHierarchy([]),[]);
 assert.deepEqual(ui.buildHierarchy(ui.groupPublications(null)),[]);
});

test('o código usa menus nativos acessíveis nos três níveis',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const js=fs.readFileSync(path.join(__dirname,'../docs/assets/radar-organizado.js'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../docs/assets/radar-organizado.css'),'utf8');
 for(const layer of ['radar-accordion-level-1','radar-accordion-level-2','radar-accordion-level-3']) {
  assert.ok(js.includes(layer),layer);
  assert.ok(css.includes(layer),layer);
 }
 assert.ok(js.includes('<details'));
 assert.ok(js.includes('<summary'));
 assert.ok(js.includes('radarExpandAll')&&js.includes('radarCollapseAll'));
 assert.ok(js.includes('data-accordion-key'));
 assert.ok(css.includes('focus-visible'));
});
