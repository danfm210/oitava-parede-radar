const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const help=require('../docs/assets/assistente-revisoes.js');
const agenda=require('../docs/dados/agenda.json');
test('assistente orienta filtros e encaminha duvidas genericas para IA externa',()=>{
 assert.ok(help.knowledge('Como filtrar editais recentes?').anchor==='#monitor');
 assert.ok(help.knowledge('Marcar como conferida').text.includes('navegador'));
 assert.ok(help.knowledge('Como cadastrar um projeto?').anchor==='#projetos');
 assert.ok(help.knowledge('Quais materiais existem sobre uma tecnica muito especifica?').external);
});
test('IDs das menções são limpos e estado local evita compartilhamento inadvertido',()=>{
 assert.equal(help.onlyCleanId('ab-45_<img>'),'ab-45_img');
});
test('eventos fotografados têm crédito e procedência',()=>{
 const items=agenda.events.filter(e=>e.image);
 assert.ok(items.length>=4);
 for(const e of items){
  assert.ok(e.image.startsWith('https://'));
  assert.ok(e.imageCredit&&e.imageSource&&e.imageType==='local');
 }
 assert.ok(agenda.places.filter(x=>x.photo).length>=6);
});
test('HTML exibe marca, assistente e revisão de menções',()=>{
 const site=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
 assert.ok(site.includes('assistente-revisoes.js'));
 assert.ok(site.includes('assistente-revisoes.css'));
 assert.ok(site.includes('window.renderMencoesRevisaveis(mentions,allowed,esc)'));
});
