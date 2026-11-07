const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../docs/assets/catalogo-projetos.js');
const data=require('../docs/dados/projetos-oficiais.json');
const expected=['OITAVAFEST','LIVRO "OITAVO AMOR"','ZEBOLA DANCE - VIDEOCLIPE','CURSO PROFISSIONALIZANTE EM PÓS PRODUÇÃO','FASHION FILM'];
// Fixture auditada: a coleta pode acrescentar outros projetos sem invalidar estes cenários.
const audited=data.projetos.filter(row=>expected.includes(row.titulo));
test('cinco títulos auditados são idênticos ao campo PROJETO, sem usar nome de edital como projeto',()=>{
 assert.equal(data.schema,1);
 for(const title of expected)assert.ok(data.projetos.some(r=>r.titulo===title),title);
 assert.ok(data.projetos.every(r=>r.titulo!==r.fonte_titulo));
 assert.ok(data.projetos.every(r=>r.pagina>0&&api.officialURL(r.fonte_url)));
});
test('retificações acrescentam evidência sem duplicar um mesmo projeto no mesmo edital',()=>{
 const one=data.projetos[0];
 const rows=api.groupOfficial([one,{...one,fonte_url:one.fonte_url+'?retificacao=1'}]);
 assert.equal(rows.length,1);assert.equal(rows[0].evidencias.length,2);
 assert.equal(api.groupOfficial([one,{...one,edital:'999/2026'}]).length,2);
});
test('decisão recursal de Julia substitui o estado pendente sem apagar o histórico',()=>{
 const evidence=data.projetos.filter(row=>row.protocolo==='20261AFF24C9E82');
 const row=api.groupOfficial([...evidence].reverse())[0];
 assert.equal(evidence.length,3);assert.equal(row.evidencias.length,3);
 assert.equal(row.etapa,'Resultado da etapa recursal');assert.equal(row.situacao_na_fonte,'INSCRIÇÃO INVÁLIDA');
 assert.equal(row.motivo,'DOCUMENTAÇÃO NÃO APRESENTADA DENTRO DO PRAZO');
 assert.equal(row.evidencias[0].situacao_na_fonte,'INSCRIÇÃO INVÁLIDA');
});
test('nova leitura de documento antigo não supera uma decisão recursal',()=>{
 const base={titulo:'PROJETO TESTE',proponente:'JULIA XAVIER DE FREITAS',edital:'016/2026',programa:'PNAB · Edital 016/2026',pagina:1,conferencia:'campos_rotulados'};
 const initial={...base,fonte_titulo:'Resultado Inscricoes Edital 16 - 2026',fonte_url:'https://www.gov.br/inicial.pdf',situacao_na_fonte:'PENDENTE',data_documento:'2026-10-24',verificado_em:'2026-11-10'};
 const appeal={...base,fonte_titulo:'Resultado Recursos Edital-16 - 2026',fonte_url:'https://www.gov.br/recurso.pdf',situacao_na_fonte:'INSCRIÇÃO INVÁLIDA',data_documento:'2026-11-04',verificado_em:'2026-11-06'};
 const row=api.groupOfficial([initial,appeal])[0];
 assert.equal(row.situacao_na_fonte,'INSCRIÇÃO INVÁLIDA');
 assert.ok(api.evidenceRank(appeal)[0]>api.evidenceRank(initial)[0]);
 assert.equal(api.statusTone(row.situacao_na_fonte),'is-negative');
 assert.equal(api.statusTone('PENDENTE'),'is-pending');
 assert.equal(api.statusTone('ACEITO'),'is-positive');
});
test('busca ignora caixa e acento, preserva título exibido e filtra origem e pessoa',()=>{
 const rows=api.groupOfficial(audited);
 assert.equal(api.filterRows(rows,{query:'pos producao'})[0].titulo,expected[3]);
 assert.equal(api.filterRows(rows,{query:'oitavofest'}).length,0);
 assert.equal(api.filterRows(rows,{query:'oitavafest',person:'Giovanna Barbosa Arantes'}).length,1);
 assert.equal(api.filterRows(rows,{person:'Enzo Borges'}).length,0);
 assert.equal(api.filterRows(rows,{origin:'local'}).length,0);
});
test('cadastro local mantém nome original e não vira projeto oficial automaticamente',()=>{
 const rows=api.localRows([{id:'qa',title:'Meu título editado',proponent:'Julia Xavier',status:'contemplado'}]);
 assert.equal(rows[0].titulo,'Meu título editado');assert.equal(rows[0].origin,'local');
 assert.equal(api.groupOfficial(rows).length,0);
 assert.equal(api.filterRows(rows,{origin:'local',person:'Júlia Xavier'}).length,1);
});
test('registros sem fonte oficial e sem título comprovável são descartados',()=>{
 const row=data.projetos[0];
 assert.equal(api.groupOfficial([{...row,fonte_url:'javascript:alert(1)'},{...row,titulo:''},{...row,pagina:0},{...row,conferencia:'palpite'}]).length,0);
});
test('ano do edital separa o histórico da data de publicação e de conferência',()=>{
 assert.equal(api.yearFor({edital:'042/2024',data_documento:'2026-01-01',verificado_em:'2026-11-03'}),'2024');
 assert.equal(api.yearFor({ano_edital:2024,programa:'Edital publicado em 2026'}),'2024');
 assert.equal(api.yearFor({programa:'PNAB · Edital 019/2026'}),'2026');
 assert.equal(api.yearFor({titulo:'Projeto de 2024',verificado_em:'2026-11-03'}),'');
 const rows=api.groupOfficial(audited);
 assert.equal(api.filterRows(rows,{year:'2026'}).length,4);
 assert.deepEqual(api.filterRows(rows,{year:'2024'}).map(r=>r.titulo),['FASHION FILM']);
 assert.equal(api.filterRows(rows,{year:'2026',query:'fashion'}).length,0);
});
test('anos são agrupados do mais recente ao mais antigo, com registros sem ano por último',()=>{
 const rows=[{ano_edital:2024},{ano_edital:2026},{ano_edital:2024},{titulo:'Sem ano'}];
 const groups=api.groupYears(rows,'2026');
 assert.deepEqual(groups.map(g=>g.label),['2026 · Ano atual','2024 · Histórico','Ano não informado']);
 assert.deepEqual(groups.map(g=>g.items.length),[1,2,1]);
 assert.equal(api.groupYears([{ano_edital:2027}],'2026')[0].label,'2027 · Próximo ciclo');
});
test('Fashion Film é histórico concluído por informação do coletivo, preservando a situação da fonte',()=>{
 const fashion=data.projetos.find(r=>r.titulo==='FASHION FILM');
 assert.equal(fashion.ano_edital,2024);
 assert.equal(fashion.situacao_na_fonte,'INSCRIÇÃO OK');
 assert.equal(fashion.acompanhamento.aprovacao,'aprovado');
 assert.equal(fashion.acompanhamento.execucao,'concluido');
 assert.equal(fashion.acompanhamento.origem,'informado_pelo_coletivo');
});
test('ano informado no cadastro local é preservado e ausências não recebem o ano atual',()=>{
 const rows=api.localRows([{id:'qa-2024',title:'Histórico local',year:2024},{id:'qa-none',title:'Sem data'}]);
 assert.equal(api.filterRows(rows,{year:'2024'})[0].id,'qa-2024');
 assert.equal(api.filterRows(rows,{year:'sem-ano'})[0].id,'qa-none');
 assert.equal(api.filterRows(rows,{year:'2026'}).length,0);
});

test('nomes completos filtram cadastros antigos sem alterar a grafia informada',()=>{
 assert.equal(api.personKey('__proto__'),'__proto__');assert.equal(api.personKey('constructor'),'constructor');
 for(const [canonical,alias] of [['Julia Xavier de Freitas','Julia Xavier'],['Enzo Santana Borges','Enzo Borges']]){
  const rows=api.localRows([{id:'old',title:'Teste de nome',proponent:alias},{id:'new',title:'Outro teste',proponent:canonical}]);
  assert.equal(api.personKey(alias),api.personKey(canonical));
  assert.equal(api.filterRows(rows,{person:canonical}).length,2);
  assert.equal(api.filterRows(rows,{query:canonical}).length,2);
  assert.equal(rows[0].proponente,alias);
 }
});
