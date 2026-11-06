const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');

test('carrega a camada de coerencia por ultimo nos dois documentos',()=>{
 for(const file of ['index.html','docs/index.html']){
  const html=read(file);
  const coherence=html.indexOf('coerencia-visual.css?v=20261106-unificado');
  assert.ok(coherence>html.indexOf('novidades.css?v=20261104-sino'));
  assert.ok(coherence<html.indexOf('</head>'));
 }
});

test('mantem a camada visual espelhada para o GitHub Pages',()=>{
 assert.equal(read('assets/coerencia-visual.css'),read('docs/assets/coerencia-visual.css'));
});

test('reutiliza a arte de cinema sem cobrir fotografias reais',()=>{
 const css=read('assets/coerencia-visual.css');
 assert.match(css,/tentaculos-cinema-editorial\.webp/);
 assert.match(css,/\.op-event-cover:not\(\.has-photo\):after/);
 assert.match(css,/\.op-photo-fallback/);
 assert.doesNotMatch(css,/tentaculos-azuis\.svg/);
});

test('preserva cores semanticas do radar fora da paleta de programas',()=>{
 const css=read('assets/coerencia-visual.css');
 assert.match(css,/\.program-pnab/);
 assert.match(css,/\.program-lpg/);
 assert.doesNotMatch(css,/radar-topic-card\[data-kind=/);
});
