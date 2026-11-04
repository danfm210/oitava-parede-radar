const test=require('node:test'),assert=require('node:assert/strict');
const {buildCalendar,brasiliaInstant,escapeText,foldLine}=require('../docs/assets/calendario.js');
const base={id:'curta-santos',title:'Curta Santos',date:'2026-11-04',location:'Sesc Santos',url:'https://www.sescsp.org.br/programacao/curta-santos/'};
const stamp=new Date('2026-11-04T12:00:00Z');
const unfold=text=>text.replace(/\r\n /g,'');
test('encontro com hora usa Brasília e não inventa horário de encerramento',()=>{
 const text=unfold(buildCalendar({...base,time:'19:30'},stamp));
 assert.ok(text.includes('DTSTART:20261104T223000Z\r\n'));
 assert.ok(text.includes('DTSTAMP:20261104T120000Z\r\n'));
 assert.ok(!text.includes('DTEND:')&&!text.includes('DURATION:'));
 assert.ok(!text.includes('ATTENDEE:')&&!text.includes('METHOD:REQUEST'));
 assert.equal(brasiliaInstant('2026-11-04','00:00').toISOString(),'2026-11-04T03:00:00.000Z');
});
test('encontro sem hora é de dia inteiro e atravessa mês e ano corretamente',()=>{
 const text=buildCalendar({...base,date:'2026-12-31'},stamp);
 assert.ok(text.includes('DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101'));
 const leap=buildCalendar({...base,date:'2028-02-29'},stamp);
 assert.ok(leap.includes('DTEND;VALUE=DATE:20280301'));
});
test('arquivo não aceita datas impossíveis, horários inválidos ou links executáveis',()=>{
 for(const patch of [{date:'2026-02-30'},{time:'25:00'},{url:'javascript:alert(1)'},{url:'https://user:secret@example.org/'},{title:''}])assert.equal(buildCalendar({...base,...patch},stamp),'');
});
test('texto e anotações não podem injetar propriedades no calendário',()=>{
 const text=buildCalendar({...base,title:'Filme, café; encontro',description:'Linha 1\r\nATTENDEE:evil@example.org\nBarra \\'},stamp);
 assert.ok(unfold(text).includes('SUMMARY:Oitava Parede · Filme\\, café\\; encontro'));
 assert.ok(!text.includes('\r\nATTENDEE:'));
 assert.equal(escapeText('a,b;c\\d\ne'),'a\\,b\\;c\\\\d\\ne');
});
test('dobramento mantém UTF-8 e limita linhas a 75 bytes com CRLF',()=>{
 const line='DESCRIPTION:'+('Órgãos, produção 🎬 e referências; '.repeat(20));
 const folded=foldLine(line);
 assert.equal(folded.replace(/\r\n /g,''),line);
 assert.ok(folded.split('\r\n').every(row=>Buffer.byteLength(row,'utf8')<=75));
 const text=buildCalendar({...base,description:line},stamp);
 assert.ok(text.endsWith('END:VCALENDAR\r\n'));
 assert.ok(!text.replaceAll('\r\n','').includes('\n'));
});
