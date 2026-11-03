const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const api=require('../docs/assets/aprovacoes.js');
// Dados fictícios apenas para testar a validação; não são publicados no cadastro.
const row={id:'fixture',revisao:1,confirmado:true,conferencia:'documental',projeto:'Projeto fictício de teste',proponente:'Oscar Stefanno Fornari',programa:'Edital fictício de teste',resultado:'contemplado',etapa:'resultado_final',publicado_em:'2026-11-01',conferido_em:'2026-11-02',explicacao:'Explicação fictícia para o teste.',trecho_fonte:'Trecho fictício para o teste.',fonte_url:'https://www2.praiagrande.sp.gov.br/documento-de-teste.pdf'};
const today='2026-11-03';
const results=records=>api.confirmedResults({schema:1,aprovacoes:records},today);
test('menções, habilitação e fases preliminares não disparam aprovação',()=>{
 assert.equal(api.eligible({...row,confirmado:false},today),false);
 assert.equal(api.eligible({...row,conferencia:'automatica'},today),false);
 for(const resultado of ['habilitado','inscrito','classificado','indeferido','em_recurso'])assert.equal(api.eligible({...row,resultado},today),false);
 for(const etapa of ['resultado_preliminar','inscricao','habilitacao'])assert.equal(api.eligible({...row,etapa},today),false);
});
test('apenas resultados finais conferidos com fonte oficial são aceitos',()=>{
 assert.equal(api.eligible(row,today),true);
 assert.equal(api.eligible({...row,etapa:'homologacao'},today),true);
 for(const fonte_url of ['javascript:alert(1)','https://gov.br.exemplo.com/a','https://praiagrande.sp.gov.br.exemplo.com/a','http://www.gov.br/a','https://usuario@www.gov.br/a'])assert.equal(api.eligible({...row,fonte_url},today),false);
 for(const fonte_url of ['https://santos.sp.gov.br/a','https://www.gov.br/cultura/a','https://plenussistemas.dioenet.com.br/a'])assert.equal(api.officialURL(fonte_url),true);
});
test('identidade, explicação, evidência e datas são obrigatórias',()=>{
 for(const key of ['projeto','programa','explicacao','trecho_fonte'])assert.equal(api.eligible({...row,[key]:''},today),false);
 assert.equal(api.eligible({...row,proponente:'Pessoa não monitorada'},today),false);
 assert.equal(api.eligible({...row,publicado_em:'2026-02-30'},today),false);
 assert.equal(api.eligible({...row,publicado_em:'2027-01-01'},today),false);
 assert.equal(api.eligible({...row,conferido_em:'2027-01-01'},today),false);
 assert.equal(api.eligible({...row,conferido_em:'2026-10-30'},today),false);
});
test('uma revogação ou retificação mais recente impede exibir aprovação antiga',()=>{
 assert.equal(results([row,{...row,revisao:2,confirmado:false}]).length,0);
 assert.equal(results([row,{...row,revisao:2,resultado:'indeferido'}]).length,0);
 assert.equal(results([row,{...row,revisao:2,explicacao:'Retificação confirmada.'}])[0].revisao,2);
 assert.equal(results([row,{...row,confirmado:false}]).length,0);
});
test('cadastro inválido ou vazio não abre aviso; revisão nova gera chave nova',()=>{
 assert.deepEqual(api.confirmedResults(null,today),[]);
 assert.deepEqual(api.confirmedResults({schema:1,aprovacoes:[]},today),[]);
 assert.equal(results([row,row]).length,1);
 assert.notEqual(api.revisionKey(row),api.revisionKey({...row,revisao:2}));
});
test('cadastro publicado tem somente registros válidos, sem simulações',()=>{
 const data=require('../docs/dados/aprovacoes.json');
 const day=new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
 assert.equal(data.schema,1);assert.ok(Array.isArray(data.aprovacoes));
 assert.equal(new Set(data.aprovacoes.map(r=>r.id)).size,data.aprovacoes.length);
 for(const r of data.aprovacoes)if(r.confirmado===true)assert.equal(api.eligible(r,day),true,r.id);
 assert.equal(fs.readFileSync('dados/aprovacoes.json','utf8'),fs.readFileSync('docs/dados/aprovacoes.json','utf8'));
});

test('nomes atualizados continuam exigindo conferência documental para aprovação',()=>{
 for(const proponente of ['Julia Xavier de Freitas','Enzo Santana Borges','Julia Xavier','Enzo Borges']){
  assert.equal(api.eligible({...row,proponente},today),true);
  assert.equal(api.eligible({...row,proponente,conferencia:'automatica'},today),false);
 }
 assert.equal(api.eligible({...row,proponente:'Enzo Santana Borges Junior'},today),false);
});
