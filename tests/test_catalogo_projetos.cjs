const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../docs/assets/catalogo-projetos.js');
const data=require('../docs/dados/projetos-oficiais.json');
const expected=['OITAVAFEST','LIVRO "OITAVO AMOR"','ZEBOLA DANCE - VIDEOCLIPE','CURSO PROFISSIONALIZANTE EM PÓS PRODUÇÃO','FASHION FILM'];
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
test('busca ignora caixa e acento, preserva título exibido e filtra origem e pessoa',()=>{
 const rows=api.groupOfficial(data.projetos);
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
