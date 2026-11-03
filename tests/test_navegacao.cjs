const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const navigation=require('../docs/assets/navegacao.js');
const site=fs.readFileSync(path.join(__dirname,'../docs/index.html'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'../docs/assets/navegacao.css'),'utf8');

test('todas as áreas de conteúdo possuem acesso na barra de navegação',()=>{
 const expected=[
  'inicio-editorial','edPulse','marcas','acervo','monitor','monitorMentions','visao',
  'catalogo-projetos','projetos','fontes','oportunidades','agenda','reunioes','notificacoes','publicacao'
 ];
 assert.deepEqual(navigation.SECTIONS,expected);
 const header=site.slice(site.indexOf('<header class="site-head'),site.indexOf('</header>'));
 for(const id of expected){
  assert.ok(header.includes('href="#'+id+'"'),id);
  assert.ok(header.includes('data-section="'+id+'"'),id+' tem indicador ativo');
 }
 assert.ok(header.includes('data-nav-help'),'botão de ajuda');
 assert.ok(header.includes('aria-label="Navegação principal"'));
});

test('os menus agrupam conteúdos relacionados e não repetem seções',()=>{
 assert.deepEqual(navigation.MENUS.editais,['monitor','monitorMentions','visao']);
 assert.deepEqual(navigation.MENUS.fontes,['fontes','oportunidades']);
 assert.deepEqual(navigation.MENUS.central,['notificacoes','publicacao']);
 assert.equal(navigation.menuForTarget('agenda'),null);
 assert.equal(navigation.menuForTarget('monitorMentions'),'editais');
 assert.equal(navigation.menuForTarget('acervo'),'inicio');
 const all=navigation.SECTIONS;
 assert.equal(new Set(all).size,all.length);
});

test('menus acessíveis por botão, teclado, foco e estado expandido',()=>{
 const header=site.slice(site.indexOf('<header class="site-head'),site.indexOf('</header>'));
 for(const id of Object.keys(navigation.MENUS)){
  assert.ok(header.includes('data-nav-trigger="'+id+'"'));
  assert.ok(header.includes('data-nav-panel="'+id+'"'));
  assert.ok(header.includes('aria-controls="op-nav-panel-'+id+'"'));
  assert.ok(header.includes('aria-expanded="false"'));
 }
 const script=fs.readFileSync(path.join(__dirname,'../docs/assets/navegacao.js'),'utf8');
 for(const part of ["event.key!=='Escape'","event.key==='ArrowDown'","aria-current","document.addEventListener('click'","requestAnimationFrame"]){
  assert.ok(script.includes(part),part);
 }
});

test('o destaque acompanha a seção visível na rolagem',()=>{
 const rows=[{id:'inicio-editorial',top:-610},{id:'monitor',top:140},{id:'projetos',top:1200}];
 assert.equal(navigation.chooseActive(rows,160),'monitor');
 assert.equal(navigation.chooseActive(rows,80),'inicio-editorial');
 assert.equal(navigation.chooseActive([{id:'agenda',top:900},{id:'reunioes',top:1400}],100),'agenda');
 assert.equal(navigation.normalizeTarget('#projetos'),'projetos');
});

test('o design mantém logo original central e acesso móvel ao conteúdo',()=>{
 const header=site.slice(site.indexOf('<header class="site-head'),site.indexOf('</header>'));
 assert.ok(header.includes('class="brand-logo"'));
 assert.ok(header.includes('op-header-masthead'));
 assert.ok(header.includes('id="menuButton"'));
 assert.ok(header.includes('id="nav"'));
 assert.ok(style.includes('grid-template-columns:1fr auto 1fr'));
 assert.ok(style.includes('background:var(--nav-navy)!important'));
 assert.ok(style.includes('@media(max-width:1040px)'));
 assert.ok(style.includes('.op-nav-v2.open'));
 assert.ok(style.includes('.op-nav-panel[hidden]'));
 assert.ok(style.includes(':focus-visible'));
 assert.ok(site.includes('./assets/navegacao.css'));
 assert.ok(site.includes('./assets/navegacao.js'));
});


test('cada grupo ocupa um intervalo consecutivo e os links seguem a sequência da página',()=>{
 const header=site.slice(site.indexOf('<nav class="nav op-nav-v2"'),site.indexOf('</nav>'));
 const links=[...header.matchAll(/data-section="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(links,navigation.SECTIONS);
 for(const ids of Object.values(navigation.MENUS)){
  const positions=ids.map(id=>links.indexOf(id));
  assert.ok(positions.every(p=>p>=0));
  assert.ok(positions.every((p,i)=>i===0||p===positions[i-1]+1));
 }
});

test('destaque progride ao descer, retorna ao subir e alcança a última seção curta',()=>{
 const ids=['inicio-editorial','monitor','catalogo-projetos','fontes','agenda','reunioes','notificacoes','publicacao'];
 const at=scroll=>ids.map((id,i)=>({id,top:i*600-scroll})).reverse();
 const down=ids.map((_,i)=>navigation.chooseActive(at(i*600),160));
 const up=ids.map((_,i)=>navigation.chooseActive(at((ids.length-1-i)*600),160));
 assert.deepEqual(down,ids);
 assert.deepEqual(up,[...ids].reverse());
 const end=[{id:'notificacoes',top:-180},{id:'publicacao',top:310}];
 assert.equal(navigation.chooseActive(end,160),'notificacoes');
 assert.equal(navigation.chooseActive(end,160,true),'publicacao');
 assert.equal(navigation.chooseActive([],160,true),'inicio-editorial');
});
