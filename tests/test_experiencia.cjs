const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {metricNumber,nextScene}=require('../docs/assets/experiencia.js');
const source=fs.readFileSync(require.resolve('../docs/assets/experiencia.js'),'utf8');

test('contagens mostram dados reais, inclusive zero e milhares em português',()=>{
 for(const [text,value] of [['129',129],['4 registros na seleção · 4 da fonte oficial',4],[' 12 eventos na seleção',12],['0 sugestões · 0 pontos personalizados',0],['1.234 publicações',1234]])assert.equal(metricNumber(text),value);
});
test('carregamento e texto sem contagem não são apresentados como zero',()=>{
 for(const text of [undefined,null,'','—','Carregando eventos…','Erro ao carregar','3/3 fontes','12,5'])assert.equal(metricNumber(text),null);
});
test('navegação por teclado percorre as abas em ciclo e permite ir aos extremos',()=>{
 assert.equal(nextScene(3,'ArrowRight'),0);
 assert.equal(nextScene(0,'ArrowLeft'),3);
 assert.equal(nextScene(2,'ArrowLeft'),1);
 assert.equal(nextScene(2,'Home'),0);
 assert.equal(nextScene(1,'End'),3);
 assert.equal(nextScene(2,'Tab'),2);
});
test('script defer aguarda a capa editorial criada no DOMContentLoaded',()=>{
 let listener,queries=0;
 const document={readyState:'interactive',addEventListener(type,fn,options){assert.equal(type,'DOMContentLoaded');assert.equal(options.once,true);listener=fn;},getElementById(){queries++;return null;}};
 vm.runInNewContext(source,{document,module:{exports:{}}});
 assert.equal(queries,0);
 assert.equal(typeof listener,'function');
 listener();
 assert.equal(queries,1);
});
test('carregamento tardio após o DOM pronto inicializa sem esperar outro evento',()=>{
 let queries=0;
 const document={readyState:'complete',addEventListener(){assert.fail('não deve aguardar um evento que já ocorreu');},getElementById(){queries++;return null;}};
 vm.runInNewContext(source,{document,module:{exports:{}}});
 assert.equal(queries,1);
});
