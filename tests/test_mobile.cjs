const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {dockForSection,countFilters}=require('../docs/assets/mobile.js');

test('atalho inferior acompanha subseções sem marcar uma área fora do contexto',()=>{
 for(const id of ['monitor','monitorMentions','visao'])assert.equal(dockForSection(id),'monitor');
 for(const id of ['catalogo-projetos','projetos'])assert.equal(dockForSection(id),'catalogo-projetos');
 assert.equal(dockForSection('agenda'),'agenda');
 assert.equal(dockForSection('reunioes'),'reunioes');
 for(const id of ['inicio-editorial','acervo','fontes','oportunidades','notificacoes','publicacao',undefined])assert.equal(dockForSection(id),null);
});
test('indicador de filtros ignora opções gerais e distingue filtros ativos',()=>{
 assert.equal(countFilters(),0);
 assert.equal(countFilters({cities:['Todas'],categories:['todos']}),0);
 assert.equal(countFilters({cities:['Santos'],categories:['audiovisual'],period:'today',saved:true}),4);
 assert.equal(countFilters({cities:['São Vicente'],categories:['cafe']}),2);
});
test('catálogo distingue pessoa e ano alterado do ano corrente de Brasília',()=>{
 assert.equal(countFilters({year:'2026',currentYear:'2026'}),0);
 assert.equal(countFilters({year:'2024',currentYear:'2026',person:'Giovanna Barbosa Arantes'}),2);
 assert.equal(countFilters({year:'',currentYear:'2026'}),1);
});
test('inicialização defer aguarda os controles existentes mesmo em interactive',()=>{
 let callback,queries=0;
 const document={readyState:'interactive',addEventListener(type,fn,options){assert.equal(type,'DOMContentLoaded');assert.equal(options.once,true);callback=fn;},getElementById(){queries++;return {};}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../docs/assets/mobile.js'),'utf8'),{document,module:{exports:{}}});
 assert.equal(queries,0);
 callback();
 assert.equal(queries,1);
});
