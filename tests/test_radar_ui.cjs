const test = require('node:test');
const assert = require('node:assert/strict');
const ui = require('../docs/assets/radar-organizado.js');
test('colapsáveis ficam nas listas extensas e não criam uma etapa para subcategoria única',()=>{
 for(const count of [0,1,2,3])assert.equal(ui.shouldCollapse(count),false);
 assert.equal(ui.shouldCollapse(4),true);
 assert.equal(ui.shouldCollapse(40,1),false);
 assert.equal(ui.shouldCollapse(40,2),true);
 for(const count of [null,undefined,NaN,-1])assert.equal(ui.shouldCollapse(count),false);
});
test('novidades usam detecção nas últimas 48 horas e excluem a carga inicial',()=>{
 const now=Date.parse('2026-11-04T15:00:00Z');
 const doc=(id,seen,extra={})=>({id,titulo:'Edital '+id,url:'https://oficial.test/'+id,fonte:'pnab_pg',primeira_detecao:seen,base_inicial:false,...extra});
 const rows=[doc('antigo','2026-11-02T14:59:59Z'),doc('limite','2026-11-02T15:00:00Z'),doc('novo','2026-11-04T14:00:00Z'),doc('futuro','2026-11-04T15:00:01Z'),doc('carga','2026-11-04T14:00:00Z',{base_inicial:true}),doc('sem-indicador','2026-11-04T14:00:00Z',{base_inicial:undefined})];
 assert.deepEqual(ui.newlyDetected(rows,now).map(d=>d.id),['novo','limite']);
});
test('arquivo antigo recém-localizado é novo no radar, data de publicação não cria novidade',()=>{
 const now=Date.parse('2026-11-04T15:00:00Z');
 const base={fonte:'pnab_pg',base_inicial:false,titulo:'Resultado',url:'https://oficial.test/a',id:'a'};
 assert.equal(ui.newlyDetected([{...base,primeira_detecao:'2026-11-04T14:00:00Z',data_no_arquivo:'2024-01-01'}],now).length,1);
 for(const seen of ['',null,'inválida','2026-11-04','2026-10-01T14:00:00Z'])assert.equal(ui.newlyDetected([{...base,primeira_detecao:seen,data_no_arquivo:'2026-11-04'}],now).length,0);
 assert.deepEqual(ui.newlyDetected(null,now),[]);
 assert.deepEqual(ui.newlyDetected([null,{}],now),[]);
 assert.deepEqual(ui.newlyDetected([base],NaN),[]);
});
test('contagem das novidades preserva arquivos distintos e elimina repetição do mesmo documento',()=>{
 const now=Date.parse('2026-11-04T15:00:00Z');
 const a={id:'a',fonte:'diario_pg',titulo:'Edição A',url:'https://oficial.test/a',primeira_detecao:'2026-11-04T13:00:00Z',base_inicial:false};
 const b={...a,id:'b',titulo:'Edição B',url:'https://oficial.test/b',primeira_detecao:'2026-11-04T14:00:00Z'};
 assert.deepEqual(ui.newlyDetected([a,{...a},b],now).map(d=>d.id),['b','a']);
});
test('arquivos vistos saem das novidades sem desaparecer do radar',()=>{
 const now=Date.parse('2026-11-04T15:00:00Z');
 const a={id:'a',fonte:'pnab_pg',titulo:'Arquivo A',url:'https://oficial.test/a',primeira_detecao:'2026-11-04T13:00:00Z',base_inicial:false};
 const b={...a,id:'b',titulo:'Arquivo B',url:'https://oficial.test/b',primeira_detecao:'2026-11-04T14:00:00Z'};
 const seen=new Set([ui.documentNoticeId(a)]);
 assert.deepEqual(ui.unseenNewDocuments([a,b],seen,now).map(doc=>doc.id),['b']);
 assert.equal(ui.groupPublications([a,b]).flatMap(group=>group.items).length,2);
 assert.deepEqual(ui.unseenNewDocuments([a,b],JSON.stringify([...seen]),now).map(doc=>doc.id),['b']);
 assert.equal(ui.unseenNewDocuments([{...a,primeira_detecao:'2026-11-04T14:30:00Z'}],seen,now).length,1);
});
test('armazenamento inválido de arquivos vistos é ignorado com segurança',()=>{
 for(const raw of ['{','{}','null','42'])assert.equal(ui.readNoticeIds(raw).size,0);
 assert.deepEqual([...ui.readNoticeIds('["a",null,42,"a"]')],['a']);
 assert.equal(ui.NEWS_STORE,'oitava_novidades_lidas_v1');
});
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
