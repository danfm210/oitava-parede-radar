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

test('pontos personalizados sobrevivem ao armazenamento sem alterar a curadoria',()=>{
 const value={name:'Café do teste',city:'Guarujá',address:'Praça de teste, 10',type:'cafe',why:'Ideias e referências',url:'https://example.com/local'};
 const p=agenda.customPlace(value,'custom-qa-1');
 assert.equal(p.custom,true);assert.equal(p.city,'Guarujá');
 const restored=agenda.readCustomPlaces(JSON.stringify([p]));
 assert.deepEqual(restored,[p]);
 const combined=[...restored,...data.places];
 assert.deepEqual(agenda.filterPlaces(combined,'Guarujá','cafe','referencias',false,new Set()).map(x=>x.id),['custom-qa-1']);
 assert.equal(data.places.some(x=>x.id==='custom-qa-1'),false);
 assert.equal(agenda.filterPlaces(combined,'Todas','todos','',true,new Set(['custom-qa-1'])).length,1);
});
test('cadastro rejeita campos vazios, IDs públicos, tipos desconhecidos e links executáveis',()=>{
 const value={name:'Um ponto',city:'Santos',address:'Centro',type:'cafe'};
 for(const key of ['name','city','address'])assert.equal(agenda.customPlace({...value,[key]:'  '},'custom-qa'),null);
 assert.equal(agenda.customPlace(value,'juicyhub'),null);
 assert.equal(agenda.customPlace({...value,type:'__proto__'},'custom-qa'),null);
 for(const url of ['javascript:alert(1)','data:text/html,teste','https://user:password@example.com/'])assert.equal(agenda.safeURL(url),'');
 const p=agenda.customPlace({...value,url:'javascript:alert(1)',name:'x'.repeat(150)},'custom-qa');
 assert.equal(p.url,'');assert.equal(p.name.length,100);
});
test('armazenamento corrompido, registros inválidos e duplicados não derrubam os locais',()=>{
 const p=agenda.customPlace({name:'Ponto',city:'Santos',address:'Centro',type:'cultural'},'custom-qa');
 assert.deepEqual(agenda.readCustomPlaces('{quebrado'),[]);assert.deepEqual(agenda.readCustomPlaces('{}'),[]);
 assert.deepEqual(agenda.readCustomPlaces(JSON.stringify([null,42,{id:'juicyhub'},p,p])),[p]);
});
test('Curta Santos tem programação detalhada e o circuito preserva festivais encerrados como referência',()=>{
 const curta=data.events.find(e=>e.id==='curta-santos-2026');
 assert.equal(curta.highlights.length,4);assert.ok(curta.references.some(r=>new URL(r.url).hostname==='www.sescsp.org.br'));
 assert.equal(data.places.length,15);assert.equal(data.festivals.length,5);
 const kinoforum=data.festivals.find(f=>f.id==='kinoforum');
 assert.equal(agenda.festivalState(kinoforum,'2026-11-03'),'Edição encerrada');
 assert.equal(agenda.festivalState(curta,'2026-11-03'),'Em breve');
 assert.equal(agenda.festivalState(curta,'2026-11-04'),'Em andamento');
 assert.equal(agenda.festivalState(curta,'2026-11-08'),'Em andamento');
 assert.equal(agenda.festivalState(curta,'2026-11-09'),'Edição encerrada');
 assert.equal(agenda.festivalState({},'2026-11-03'),'Datas a confirmar');
 assert.equal(agenda.upcomingEvents([kinoforum],'2026-11-03').length,0);
});
