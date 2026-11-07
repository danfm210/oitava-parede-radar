const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const extras=require('../docs/assets/navegacao-extras.js');
const site=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../docs/assets/navegacao-extras.css'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'../docs/assets/navegacao-extras.js'),'utf8');

test('busca normaliza acentos e encontra o conteudo solicitado',()=>{
 assert.equal(extras.normalize('REUNIÕES'),'reunioes');
 assert.ok(extras.searchDestinations('Giovanna').some(x=>x.id==='monitorMentions'));
 assert.ok(extras.searchDestinations('OitavaFest').some(x=>x.id==='monitorMentions'));
 assert.ok(extras.searchDestinations('PNAB').some(x=>x.id==='monitor'));
 assert.ok(extras.searchDestinations('PROMAC').some(x=>x.id==='oportunidades'));
 assert.ok(extras.searchDestinations('SPCine').some(x=>x.id==='oportunidades'));
 assert.ok(extras.searchDestinations('cafÉ').some(x=>x.id==='reunioes' || x.id==='opMeetSearch'));
 assert.ok(extras.searchDestinations('Festival').some(x=>x.id==='agenda'));
});
test('busca oferece atalhos diretos aos quatro campos sem duplicidade',()=>{
 assert.deepEqual(extras.ACTIONS.map(x=>x.id),['radarDocQuery','projectSearch','opEventSearch','opMeetSearch']);
 assert.equal(new Set(extras.DESTINATIONS.map(x=>x.id)).size,extras.DESTINATIONS.length);
 const all=[...extras.DESTINATIONS,...extras.ACTIONS];
 assert.equal(new Set(all.map(x=>x.id)).size,all.length);
 assert.ok(all.every(x=>x.label&&x.description&&x.group));
 assert.ok(extras.searchDestinations('algo inexistente 123').length===0);
 assert.ok(extras.searchDestinations('projeto').length>0);
});
test('o visual inclui botao de busca no cabecalho e recursos de leitura',()=>{
 assert.ok(site.includes('./assets/navegacao-extras.js'));
 assert.ok(site.includes('./assets/navegacao-extras.css'));
 for(const id of ['opQuickSearchTrigger','opQuickSearchDialog','opBackToTop','opReadingProgressBar']){
  assert.ok(js.includes(id),id);
 }
 assert.ok(css.includes('.op-is-compact'));
 assert.ok(css.includes('.op-search-overlay[hidden]'));
 assert.ok(css.includes('.op-back-top[hidden]'));
 assert.ok(css.includes('prefers-reduced-motion'));
});
test('atalhos usam teclado, foco e rotulos acessiveis sem enviar consultas',()=>{
 assert.ok(js.includes("key==='k'"));
 assert.ok(js.includes("e.key==='Escape'"));
 assert.ok(js.includes("e.key==='ArrowDown'"));
 assert.ok(js.includes("e.key==='ArrowUp'"));
 assert.ok(js.includes("e.key==='Enter'"));
 assert.ok(js.includes('aria-modal="true"'));
 assert.ok(js.includes('aria-label="Buscar seções e ações"'));
 assert.ok(js.includes('restoreFocus'));
 assert.ok(js.includes('scrollIntoView'));
 assert.ok(!js.includes('fetch('));
});
test('botao de retorno e progresso lidam com a pagina longa',()=>{
 assert.ok(js.includes('scroll<650'));
 assert.ok(js.includes('scroll/total*100'));
 assert.ok(js.includes("scroll>180"));
 assert.ok(css.includes('op-reading-progress'));
});
