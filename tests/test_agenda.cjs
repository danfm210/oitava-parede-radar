const test=require('node:test'),assert=require('node:assert/strict');
const agenda=require('../docs/assets/agenda-reunioes.js');
const data=require('../docs/dados/agenda.json');

test('agenda curada contem eventos futuros, fontes e locais reais',()=>{
 assert.equal(data.schema,1);
 assert.ok(data.events.length>=9);
 assert.ok(data.places.length>=17);
 assert.ok(data.sources.length>=6);
 assert.equal(new Set(data.events.map(x=>x.id)).size,data.events.length);
 assert.equal(new Set(data.places.map(x=>x.id)).size,data.places.length);
 assert.ok(data.events.every(e=>e.start<=e.end&&/^https:\/\//.test(e.url)));
 assert.ok(data.places.every(p=>['Santos','São Vicente','Praia Grande'].includes(p.city)&&p.address&&p.url));
});

test('Viver Praia Grande alimenta agenda e descoberta de pontos de encontro com origem explícita',()=>{
 const isViver=url=>new URL(url).hostname==='viverpraiagrande.com.br';
 const eventSource=data.sources.find(s=>s.url==='https://viverpraiagrande.com.br/eventos/');
 assert.equal(eventSource.kind,'Fonte editorial de descoberta');
 const viverEvents=data.events.filter(e=>e.source==='Viver Praia Grande');
 assert.ok(viverEvents.length>=2);assert.ok(viverEvents.every(e=>e.source_kind==='Fonte editorial'&&isViver(e.url)));
 assert.equal(data.meeting_sources.length,2);
 assert.ok(data.meeting_sources.every(s=>isViver(s.url)));
 const places=data.places.filter(p=>p.source==='Viver Praia Grande');
 for(const id of ['bistro-praia','quintal-bistro-pg','brookie-cafe-pg','portinho-pg'])assert.ok(places.some(p=>p.id===id));
 assert.ok(places.every(p=>isViver(p.source_url)));
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
 assert.equal(data.places.length,17);assert.equal(data.festivals.length,5);
 const kinoforum=data.festivals.find(f=>f.id==='kinoforum');
 assert.equal(agenda.festivalState(kinoforum,'2026-11-03'),'Edição encerrada');
 assert.equal(agenda.festivalState(curta,'2026-11-03'),'Em breve');
 assert.equal(agenda.festivalState(curta,'2026-11-04'),'Em andamento');
 assert.equal(agenda.festivalState(curta,'2026-11-08'),'Em andamento');
 assert.equal(agenda.festivalState(curta,'2026-11-09'),'Edição encerrada');
 assert.equal(agenda.festivalState({},'2026-11-03'),'Datas a confirmar');
 assert.equal(agenda.upcomingEvents([kinoforum],'2026-11-03').length,0);
});

test('convite preserva título e fonte, separa o encontro do grupo e incorpora sua mensagem',()=>{
 const event=data.events.find(e=>e.id==='curta-santos-2026');
 const text=agenda.eventInvitation(event,{date:'2026-11-07',time:'14:15',meeting:'Entrada do Sesc Santos',note:'Vamos chegar juntos?'});
 assert.ok(text.includes('Vamos juntos ao '+event.title+'?'));
 assert.ok(text.includes('Nosso encontro: 07/11/2026 às 14:15'));
 assert.ok(text.includes('Entrada do Sesc Santos · Santos'));
 assert.ok(text.includes('Período do evento: 04/11/2026 a 08/11/2026'));
 assert.ok(text.includes('Vamos chegar juntos?'));assert.ok(text.includes(event.url));
 assert.equal(event.venue,'Sesc, Teatro Guarany e outros locais');
});
test('convite rejeita data impossível, dia fora do evento, horário inválido e fonte executável',()=>{
 const event=data.events.find(e=>e.id==='curta-santos-2026');
 for(const date of ['2026-11-03','2026-11-09','2026-02-30','',undefined])assert.equal(agenda.eventInvitation(event,{date}),'');
 for(const time of ['25:00','14:60','9h'])assert.equal(agenda.eventInvitation(event,{date:'2026-11-07',time}),'');
 assert.equal(agenda.eventInvitation({...event,url:'javascript:alert(1)'},{date:'2026-11-07'}),'');
 const text=agenda.eventInvitation(event,{date:'2026-11-07'});
 assert.ok(text.includes('horário a combinar'));assert.ok(!text.includes('19h'));
});
test('data inicial do convite acompanha o evento em andamento e os dias de atividade',()=>{
 const event=data.events.find(e=>e.id==='curta-santos-2026');
 assert.equal(agenda.defaultInviteDate(event,'2026-11-03'),'2026-11-04');
 assert.equal(agenda.defaultInviteDate(event,'2026-11-06'),'2026-11-06');
 const weekend={...event,start:'2026-11-07',end:'2026-11-29',weekdays:[0,6]};
 assert.equal(agenda.defaultInviteDate(weekend,'2026-11-10'),'2026-11-14');
 assert.equal(agenda.eventInvitation(weekend,{date:'2026-11-10'}),'');
});
test('períodos consideram hoje, sete dias inclusivos e o fim de semana, inclusive aos domingos',()=>{
 assert.deepEqual(agenda.periodBounds('today','2026-11-03'),['2026-11-03','2026-11-03']);
 assert.deepEqual(agenda.periodBounds('week','2026-12-29'),['2026-12-29','2027-01-04']);
 assert.deepEqual(agenda.periodBounds('weekend','2026-11-03'),['2026-11-07','2026-11-08']);
 assert.deepEqual(agenda.periodBounds('weekend','2026-11-08'),['2026-11-07','2026-11-08']);
 assert.equal(agenda.periodBounds('all','2026-11-03'),null);
 const multi={start:'2026-11-01',end:'2026-11-20'};
 assert.equal(agenda.eventInPeriod(multi,'today','2026-11-03'),true);
 assert.equal(agenda.eventInPeriod({start:'2026-11-10',end:'2026-11-11'},'week','2026-11-03'),false);
 const weekend={start:'2026-11-07',end:'2026-11-29',weekdays:[0,6]};
 assert.equal(agenda.eventInPeriod(weekend,'today','2026-11-10'),false);
 assert.equal(agenda.eventInPeriod(weekend,'weekend','2026-11-10'),true);
});
