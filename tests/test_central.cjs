const test=require('node:test'),assert=require('node:assert/strict');
const {readDocuments,safeURL,radarHealth,nextEvent}=require('../docs/assets/central.js');
const radar=require('../docs/assets/radar-organizado.js');
test('salvos aceitam somente documentos oficiais, sem credenciais e sem duplicidade',()=>{
 const one={url:'https://www2.praiagrande.sp.gov.br/arquivo.pdf',title:'Documento do edital',source:'PNAB'};
 const rows=readDocuments(JSON.stringify([one,one,{...one,url:'javascript:alert(1)'},{...one,url:'https://gov.br.example.com/arquivo.pdf'},{...one,url:'https://user:password@www2.praiagrande.sp.gov.br/arquivo.pdf'},{...one,title:''}]));
 assert.equal(rows.length,1);assert.equal(rows[0].title,one.title);
 assert.equal(readDocuments('{broken').length,0);
 assert.equal(safeURL('https://example.org/',true),'');
 assert.equal(safeURL('https://example.org/',false),'https://example.org/');
});
test('estado do radar distingue relatório recente, atrasado, antigo, parcial, inválido e futuro',()=>{
 const now=Date.parse('2026-11-04T15:00:00Z'),data={generated_at:'2026-11-04T12:00:00Z',fontes:[{situacao:'ok'},{situacao:'ok'}]};
 assert.equal(radarHealth(data,now).state,'ready');
 assert.equal(radarHealth(data,now+19*3600000).state,'late');
 assert.equal(radarHealth(data,now+37*3600000).state,'old');
 assert.equal(radarHealth({...data,fontes:[{situacao:'ok'},{situacao:'erro'}]},now).state,'partial');
 assert.equal(radarHealth({...data,generated_at:'invalid'},now).state,'date');
 assert.equal(radarHealth({...data,generated_at:'2027-01-01T00:00:00Z'},now).state,'date');
 assert.equal(radarHealth(null,now).state,'loading');
});
test('próximo programa respeita fins de semana, término e datas reais',()=>{
 const a={id:'a',title:'Feira',start:'2026-11-01',end:'2026-11-29',weekdays:[0,6],url:'https://www.sescsp.org.br/feira/'};
 assert.equal(nextEvent([a],'2026-11-04').nextDay,'2026-11-07');
 assert.equal(nextEvent([a],'2026-11-08').nextDay,'2026-11-08');
 assert.equal(nextEvent([a],'2026-11-30'),null);
 assert.equal(nextEvent([{...a,start:'2026-02-30'}],'2026-02-28'),null);
 const b={...a,id:'b',title:'Cinema',start:'2026-11-05',end:'2026-11-05',weekdays:[]};
 assert.equal(nextEvent([a,b],'2026-11-04').id,'b');
});
test('referência do edital preserva ano explícito e não inventa ano corrente',()=>{
 assert.equal(radar.editalReference('Resultado Final Edital n° 042/2024 - 13/06/2025'),'42/2024');
 assert.equal(radar.editalReference('Resultado Inscricoes Edital 19 - 2026'),'19/2026');
 assert.equal(radar.editalReference('Edital 19'),'19');
 assert.equal(radar.editalReference('Documento sem número'),'');
});
