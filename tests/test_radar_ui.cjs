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
