const test=require('node:test'),assert=require('node:assert/strict');
const {partition,collectionMarkup,revealTarget}=require('../docs/assets/direcao-visual.js');
test('prévia mantém a ordem e todos os registros da agenda, sem alterar a curadoria',()=>{
 const events=require('../docs/dados/agenda.json').events,ids=events.map(e=>e.id);
 const result=partition(events);
 assert.equal(result.preview.length,Math.min(3,events.length));
 assert.deepEqual([...result.preview,...result.remaining].map(e=>e.id),ids);
 assert.deepEqual(events.map(e=>e.id),ids);
 assert.deepEqual(partition(null),{preview:[],remaining:[],total:0});
});
test('listas pequenas ficam inteiras e a lista expandida mantém todas as ações',()=>{
 const card=x=>'<article><button data-invite="'+x.id+'">Convite '+x.id+'</button></article>';
 const rows=Array.from({length:5},(_,i)=>({id:'e'+i}));
 assert.ok(!collectionMarkup(rows.slice(0,3),card).includes('<details'));
 const html=collectionMarkup(rows,card,{kind:'events',unit:'eventos'});
 assert.equal((html.match(/<article>/g)||[]).length,5);
 assert.equal((html.match(/data-invite=/g)||[]).length,5);
 assert.ok(html.includes('Ver mais 2 eventos'));
 assert.ok(!html.includes('data-collection="events" open'));
 assert.ok(collectionMarkup(rows,card,{expanded:true}).includes('data-collection="events" open'));
});
test('acesso direto abre todos os ancestrais necessários e preserva outros menus',()=>{
 const outer={tagName:'DETAILS',open:false,parentElement:null};
 const inner={tagName:'DETAILS',open:false,parentElement:outer};
 const other={tagName:'DETAILS',open:false,parentElement:null};
 const target={tagName:'DIV',parentElement:inner,matches:()=>false,querySelector:()=>null};
 assert.equal(revealTarget(target),true);assert.equal(outer.open,true);assert.equal(inner.open,true);assert.equal(other.open,false);
 assert.equal(revealTarget(target),false);assert.equal(revealTarget(null),false);
});
test('menu de uma seção também abre quando o alvo é a própria seção',()=>{
 const own={tagName:'DETAILS',open:false,parentElement:null};
 const section={tagName:'SECTION',parentElement:null,matches:()=>false,querySelector:()=>own};
 assert.equal(revealTarget(section),true);assert.equal(own.open,true);
});
