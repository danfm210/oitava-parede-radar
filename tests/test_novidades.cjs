const test=require('node:test'),assert=require('node:assert/strict');
const news=require('../docs/assets/novidades.js'),radarAPI=require('../docs/assets/radar-organizado.js'),approvalAPI=require('../docs/assets/aprovacoes.js');
const now=Date.parse('2026-11-04T15:00:00Z');
const doc=(id,extra={})=>({id,titulo:'Resultado Inscrições Edital 18 - 2026',url:'https://santos.sp.gov.br/'+id,fonte:'pnab_pg',base_inicial:false,primeira_detecao:'2026-11-04T14:00:00Z',...extra});
const mention=(id,extra={})=>({id,titulo:'Resultado de inscrições',url:'https://santos.sp.gov.br/'+id,base_inicial:false,primeira_detecao:'2026-11-04T14:00:00Z',mensagem:'Nome localizado. Conferir a fonte.',prioridade:'maxima',...extra});
const approval={id:'fixture',revisao:1,confirmado:true,conferencia:'documental',projeto:'Projeto fictício para testes',proponente:'Oscar Stefanno Fornari',programa:'Edital fictício',resultado:'contemplado',etapa:'resultado_final',publicado_em:'2026-11-01',conferido_em:'2026-11-02',explicacao:'Conferência fictícia de teste.',trecho_fonte:'Evidência fictícia para teste.',fonte_url:'https://santos.sp.gov.br/approved'};
const feed=(publicacoes=[],mencoes=[],extra={})=>news.buildFeed({radar:{schema:2,publicacoes,mencoes},radarAPI,approvalAPI,now,...extra});
test('só a detecção recente, fora da carga inicial, gera novo aviso de arquivo',()=>{
 const rows=feed([doc('novo'),doc('carga',{base_inicial:true}),doc('semflag',{base_inicial:undefined}),doc('antigo',{primeira_detecao:'2026-11-02T14:59:59Z'}),doc('futuro',{primeira_detecao:'2026-11-04T15:00:01Z'}),doc('semdata',{primeira_detecao:''})]);
 assert.deepEqual(rows.map(r=>r.target),['novo']);
 assert.equal(news.isRecent(doc('limite',{primeira_detecao:'2026-11-02T15:00:00Z'}),now),true);
});
test('menção tem prioridade sem virar aprovação e não duplica o arquivo correspondente',()=>{
 const rows=feed([doc('a')],[mention('m',{url:doc('a').url,publicacao_id:'a'})]);
 assert.equal(rows.length,1);assert.equal(rows[0].kind,'mention');assert.equal(rows[0].label,'Menção a conferir');assert.equal(rows[0].documentKey,'a');assert.deepEqual(rows[0].sections,['monitorMentions']);
});
test('conferir uma menção elimina o aviso e não faz reaparecer uma duplicata de arquivo',()=>{
 assert.deepEqual(feed([doc('a')],[mention('m',{url:doc('a').url})],{checked:{m:{at:'2026-11-04'}}}),[]);
});
test('aprovação exige validação documental e uma revisão revogada retira o aviso',()=>{
 assert.equal(feed([],[],{approvals:[approval]})[0].kind,'approval');
 for(const row of [{...approval,conferencia:'automatica'},{...approval,etapa:'resultado_preliminar'},{...approval,resultado:'habilitado'}])assert.deepEqual(feed([],[],{approvals:[row]}),[]);
 assert.deepEqual(feed([],[],{approvals:[approval,{...approval,revisao:2,confirmado:false}]}),[]);
});
test('aprovação confirmada tem prioridade e não duplica menção ou arquivo da mesma fonte',()=>{
 const rows=feed([doc('approved')],[mention('approved')],{approvals:[approval]});
 assert.equal(rows.length,1);assert.equal(rows[0].kind,'approval');assert.deepEqual(rows[0].menu,['editais','projetos']);
});
test('o total é único mesmo quando um resultado sinaliza duas áreas de navegação',()=>{
 const rows=feed([doc('a')],[],{approvals:[approval]});
 assert.deepEqual(news.unreadCounts(rows,new Set()),{total:2,sections:{monitor:2,'catalogo-projetos':1},menus:{editais:2,projetos:1}});
 const seen=new Set([rows.find(r=>r.kind==='approval').id]);
 assert.deepEqual(news.unreadCounts(rows,seen),{total:1,sections:{monitor:1},menus:{editais:1}});
});
test('recarga preserva leitura; nova revisão de aprovação ou detecção recebe uma chave nova',()=>{
 const rows=feed([doc('a')],[],{approvals:[approval]}),seen=new Set(rows.map(r=>r.id));
 const restored=news.readSeen(JSON.stringify([...seen]));assert.equal(news.unreadCounts(rows,restored).total,0);
 assert.equal(news.unreadCounts(feed([doc('a')],[],{approvals:[{...approval,revisao:2}]}),restored).total,1);
 assert.equal(news.unreadCounts(feed([doc('a',{primeira_detecao:'2026-11-04T14:30:00Z'})]),restored).total,1);
});
test('leitura não é baseada em última varredura, leitura automática ou título de resultado',()=>{
 const original=feed([doc('a')])[0],again=feed([doc('a',{ultima_leitura:'2026-11-04T14:55:00Z',ultima_localizacao:'2026-11-04T14:59:00Z'})])[0];
 assert.equal(original.id,again.id);assert.equal(original.kind,'document');
});
test('documentos e menções repetidos contam uma vez, sem ocultar arquivos distintos',()=>{
 const rows=feed([doc('a'),doc('a'),doc('b')],[mention('m'),mention('m2',{url:mention('m').url})]);
 assert.equal(rows.length,3);assert.equal(rows.filter(r=>r.kind==='mention').length,1);
});
test('URLs não oficiais e dados ausentes nunca criam avisos',()=>{
 for(const url of ['javascript:alert(1)','https://santos.sp.gov.br.exemplo.com/a','http://santos.sp.gov.br/a','https://usuario@santos.sp.gov.br/a'])assert.deepEqual(feed([doc('a',{url})],[mention('m',{url})]),[]);
 assert.deepEqual(news.buildFeed(),[]);assert.deepEqual(feed([null,{}],[null,{}]),[]);
});
test('armazenamento inválido é ignorado e indicadores grandes ficam compactos',()=>{
 for(const raw of ['{','{}','null','42'])assert.equal(news.readSeen(raw).size,0);
 assert.deepEqual([...news.readSeen('["a",null,42,"a"]')],['a']);
 assert.equal(news.badgeText(100),'99+');assert.equal(news.badgeText(8),'8');
});
test('painel e faixa do radar sincronizam leituras no mesmo navegador',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const panel=fs.readFileSync(path.join(__dirname,'../docs/assets/novidades.js'),'utf8');
 const radar=fs.readFileSync(path.join(__dirname,'../docs/assets/radar-organizado.js'),'utf8');
 assert.match(panel,/op:news-seen/);
 assert.match(radar,/op:news-seen/);
 assert.match(radar,/data-radar-document-key/);
});
