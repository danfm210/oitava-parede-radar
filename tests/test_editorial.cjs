const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),path=require('node:path');
const editorial=require('../docs/assets/editorial.js');
const radar=require('../docs/assets/radar-organizado.js');
test('Data no nome do arquivo tem prioridade sobre indexacao',()=>{
 const d={url:'https://www2.praiagrande.sp.gov.br/files/docs/20261024_005855_Resultado.pdf',primeira_detecao:'2026-11-03T10:00:00Z'};
 assert.deepEqual(editorial.docDate(d),{date:'2026-10-24',source:'no arquivo'});
 assert.equal(radar.inferredDate(d),'2026-10-24');
});
test('Quando nao ha data do arquivo, informa indexacao',()=>{
 const d={url:'https://plenussistemas.dioenet.com.br/list/praia-grande',primeira_detecao:'2026-11-03T10:00:00Z'};
 assert.deepEqual(editorial.docDate(d),{date:'2026-11-03',source:'indexado'});
});
test('Mais recentes e mais relevantes geram ordenacoes distintas',()=>{
 const old={titulo:'Resultado Inscricoes Edital 16',categoria:'resultado',url:'https://x.test/20260901_doc.pdf',primeira_detecao:'2026-11-03'};
 const newDoc={titulo:'Edital Cultura Viva',categoria:'edital',url:'https://x.test/20261101_doc.pdf',primeira_detecao:'2026-11-03'};
 assert.equal(editorial.sortedDocs([old,newDoc])[0].titulo,newDoc.titulo);
 assert.equal(radar.sortDocs([old,newDoc],'recent')[0].titulo,newDoc.titulo);
});
test('Filtro por periodo usa a data mais confiavel disponivel',()=>{
 const d={url:'https://site.test/20261020_doc.pdf',primeira_detecao:'2026-11-03T10:00:00Z'};
 assert.equal(radar.withinPeriod(d,'all'),true);
 assert.equal(radar.inferredDate(d),'2026-10-20');
});
test('HTML incorpora visual editorial e marcas oficiais com fallback',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
 const js=fs.readFileSync(path.join(__dirname,'../docs/assets/editorial.js'),'utf8');
 assert.ok(html.includes('editorial.css')&&html.includes('editorial.js'));
 assert.ok(js.includes('Oitava Parede')&&js.includes('marca')===false || js.includes('MINISTÉRIO DA CULTURA'));
 assert.ok(js.includes('https://www.instagram.com/oitavaparede/'));
});
