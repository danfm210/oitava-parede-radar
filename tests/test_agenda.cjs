const test=require('node:test'),assert=require('node:assert/strict');
const agenda=require('../docs/assets/agenda-reunioes.js');
const data=require('../docs/dados/agenda.json');

test('agenda curada contem eventos futuros, fontes e locais reais',()=>{
 assert.equal(data.schema,1);
 assert.ok(data.events.length>=9);
 assert.ok(data.places.length>=9);
 assert.ok(data.sources.length>=6);
 assert.equal(new Set(data.events.map(x=>x.id)).size,data.events.length);
 assert.equal(new Set(data.places.map(x=>x.id)).size,data.places.length);
 assert.ok(data.events.every(e=>e.start<=e.end&&/^https:\/\//.test(e.url)));
 assert.ok(data.places.every(p=>['Santos','São Vicente','Praia Grande'].includes(p.city)&&p.address&&p.url));
});

test('só eventos em andamento ou futuros aparecem',()=>{
 const rows=[{id:'old',start:'2026-09-01',end:'2026-09-02',title:'Antigo'},
 {id:'live',start:'2026-11-01',end:'2026-11-09',title:'Em andamento'},
 {id:'next',start:'2026-11-20',end:'2026-11-21',title:'Futuro'}];
 assert.deepEqual(agenda.upcomingEvents(rows,'2026-11-03').map(x=>x.id),['live','next']);
});

test('filtro de evento respeita cidade categoria busca e favoritos',()=>{
 const rows=data.events;
 assert.ok(agenda.filterEvents(rows,'Santos','audiovisual','curta',false,new Set()).some(x=>x.id==='curta-santos-2026'));
 assert.ok(!agenda.filterEvents(rows,'Praia Grande','audiovisual','curta',false,new Set()).some(x=>x.id==='curta-santos-2026'));
 const saved=new Set(['curta-santos-2026']);
 assert.deepEqual(agenda.filterEvents(rows,'Santos','audiovisual','',true,saved).map(x=>x.id),['curta-santos-2026']);
});

test('localização e estilo de reunião são filtráveis',()=>{
 const spots=agenda.filterPlaces(data.places,'São Vicente','trabalho','',false,new Set());
 assert.ok(spots.some(x=>x.id==='ideall'));
 assert.ok(!spots.some(x=>x.city==='Santos'));
 const coffee=agenda.filterPlaces(data.places,'Praia Grande','cafe','',false,new Set());
 assert.ok(coffee.some(x=>x.id==='benkell'));
});
