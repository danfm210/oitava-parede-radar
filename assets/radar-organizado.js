/* Radar organizado da Oitava Parede — agrupamento visual sem inferir decisões oficiais. */
(function (root) {
  'use strict';
  const OFFICIAL_LOGOS={
    pnab_pg:'https://www.gov.br/cultura/pt-br/assuntos/politica-nacional-aldir-blanc/documentos/logos-e-reguas/rgb-horizontal.png',
    lpg_pg:'https://www.gov.br/cultura/pt-br/assuntos/lei-paulo-gustavo/imagens/horizontal_preferencial.png'
  };
  const PROGRAMS = {
    pnab_pg: {name:'Política Nacional Aldir Blanc',short:'PNAB',detail:'Praia Grande · Fomento cultural',tone:'pnab',order:1},
    lpg_pg: {name:'Lei Paulo Gustavo',short:'LPG',detail:'Praia Grande · Cultura e audiovisual',tone:'lpg',order:2},
    diario_pg: {name:'Diário Oficial de Praia Grande',short:'DOPG',detail:'Publicações e atos municipais',tone:'diario',order:3}
  };
  const TYPES = {
    resultado: {name:'Resultados e etapas',short:'Resultado',order:1,icon:'check'},
    retificacao: {name:'Retificações e mudanças',short:'Alteração',order:2,icon:'refresh'},
    edital: {name:'Editais e inscrições',short:'Edital',order:3,icon:'document'},
    anexo: {name:'Anexos e formulários',short:'Anexo',order:4,icon:'paperclip'},
    diario: {name:'Edições oficiais',short:'Diário',order:5,icon:'news'},
    documento: {name:'Outros documentos',short:'Documento',order:6,icon:'file'}
  };
  const THEMES = {
    audiovisual:{name:'Audiovisual e cinema',short:'Audiovisual',order:1},
    festivais:{name:'Festivais e eventos',short:'Eventos',order:2},
    cultura:{name:'Cultura Viva',short:'Cultura Viva',order:3},
    formacao:{name:'Formação e capacitação',short:'Formação',order:4},
    pesquisa:{name:'Bolsas e pesquisa',short:'Bolsas',order:5},
    multilinguagens:{name:'Multilinguagens',short:'Multilinguagens',order:6},
    geral:{name:'Diversos e gerais',short:'Geral',order:7}
  };
  // Mapeamento de editais PNAB de Praia Grande divulgado nos avisos municipais de 2026.
  const PNAB_EDITAIS = {
    '16':'multilinguagens','17':'multilinguagens','18':'audiovisual',
    '19':'festivais','20':'formacao','21':'formacao','22':'formacao',
    '24':'cultura','25':'cultura','26':'pesquisa'
  };
  const norm = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const safeText = (v) => String(v == null ? '' : v);
  const escapeHTML = (v) => safeText(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  function editalNumber(title) {
    const text=norm(title);
    const found=text.match(/\b(?:edital|chamamento)\s*(?:de\s+)?(?:n[\u00ba\u00b0.]?\s*)?0?([1-9]\d?)(?:\s*[-/]\s*20\d{2})?/i);
    return found ? String(Number(found[1])) : '';
  }
  function documentType(item) {
    const name=norm(item.titulo);
    if (item.fonte==='diario_pg' || item.categoria==='diario') return 'diario';
    if (/\b(retific|errata|revoga|republica|suspens|aditamento|correcao|despacho de revog)/.test(name)) return 'retificacao';
    if (/\b(anexo|formulario|modelo|declaracao|termo de|planilha|ficha|manual|criterios|cronograma|regulamento|minuta|termo de execucao)/.test(name)) return 'anexo';
    if (/\b(resultado|classific|habilita|homologa|indefer|avaliac|recurso|preliminar|selecionad|contemplad|parecer|inscricoes aprovadas)/.test(name)) return 'resultado';
    if (/\b(edital|chamamento|premiac|fomento|inscric|bolsa cultural|abertura)/.test(name)) return 'edital';
    return ['resultado','retificacao','edital'].includes(item.categoria) ? item.categoria : 'documento';
  }
  function documentTheme(item) {
    if (item.fonte==='diario_pg') return 'geral';
    const num=editalNumber(item.titulo);
    if (item.fonte==='pnab_pg' && PNAB_EDITAIS[num]) return PNAB_EDITAIS[num];
    const s=norm(item.titulo);
    if (/festival|mostra|oitava\s*fest|feira|evento cultural|produ[cç]ao de evento/.test(s)) return 'festivais';
    if (/audiovisual|cinema|film(e|es)|lac audiovisual|videoclipe|curta/.test(s)) return 'audiovisual';
    if (/pontos? de cultura|pont(?:o|ao)es? de cultura|cultura viva|tcc ponto/.test(s)) return 'cultura';
    if (/pesquisa|bolsa de pesquisa|divulgacao/.test(s)) return 'pesquisa';
    if (/formac|formativ|capacita|aprimoramento|curso|oficina|bolsas culturais|agente cultural comunitario/.test(s)) return 'formacao';
    if (/multilingu|primeiros? projetos?|artes e cultura/.test(s)) return 'multilinguagens';
    return 'geral';
  }
  function classifyDocument(item) {
    return {program:PROGRAMS[item.fonte] ? item.fonte : 'outro',
            type:documentType(item),theme:documentTheme(item)};
  }
  function groupPublications(rows) {
    const out=new Map();
    const used=new Set();
    (Array.isArray(rows) ? rows : []).forEach((item,index)=>{
      if (!item || typeof item!=='object' || !item.url || !item.titulo) return;
      const classification=classifyDocument(item);
      // Somente URLs idênticas ou IDs repetidos são descartados; editais distintos nunca são fundidos.
      const idKey=item.id ? 'id:'+String(item.id) : '';
      const urlKey='url:'+String(item.url);
      if ((idKey && used.has(idKey)) || used.has(urlKey)) return;
      if (idKey) used.add(idKey);
      used.add(urlKey);
      const grpKey=classification.program+'|'+classification.theme+'|'+classification.type;
      if (!out.has(grpKey)) out.set(grpKey,{key:grpKey,...classification,items:[]});
      out.get(grpKey).items.push({...item, originalIndex:index});
    });
    return Array.from(out.values()).sort((a,b)=>{
      const proA=PROGRAMS[a.program]?.order || 99,proB=PROGRAMS[b.program]?.order || 99;
      return proA-proB || (TYPES[a.type]?.order||99)-(TYPES[b.type]?.order||99)
        || (THEMES[a.theme]?.order||99)-(THEMES[b.theme]?.order||99);
    });
  }
  function svgMark(type) {
    const base='<svg viewBox="0 0 44 44" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">';
    if(type==='pnab_pg') return base+'<path fill="#f0bb35" d="M4 7h14v14H4z"/><path fill="#6bbb65" d="M24 7h15v14H24z"/><path fill="#ee7962" d="M24 25h15v13H24z"/><path fill="#91b4ed" d="M4 25h14v13H4z"/></svg>';
    if(type==='lpg_pg') return base+'<rect x="5" y="10" width="34" height="26" rx="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M7 19h30M17 20v14M27 20v14" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="m6 7 8 5M18 7l8 5M30 7l7 5" stroke="currentColor" stroke-width="3"/></svg>';
    if(type==='diario_pg')return base+'<path d="M11 5h19l7 7v26H11z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M29 5v9h9M16 20h16M16 26h16M16 32h12" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
    return base+'<rect x="6" y="8" width="32" height="28" rx="6" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
  }
  function renderBadgeLabel(item) {
    const theme=THEMES[item.theme]?.short || 'Geral';
    return '<span class="radar-theme-label">'+escapeHTML(theme)+'</span>';
  }
  let currentDocs=[];
  let filterProgram='todos', filterType='todos', filterTheme='todos', query='', sortMode='recent', period='all';
  function inferredDate(doc){
    const own=safeText(doc.data_no_arquivo).slice(0,10);
    if(/^20\d{2}-\d{2}-\d{2}$/.test(own))return own;
    const found=safeText(doc.url).match(/(?:^|\/)20(\d{2})([01]\d)([0-3]\d)[_-]/);
    if(found){const date='20'+found[1]+'-'+found[2]+'-'+found[3];if(!Number.isNaN(Date.parse(date)))return date;}
    return '';
  }
  function firstSeen(doc){return safeText(doc.primeira_detecao).slice(0,10)}
  function viewDate(doc){return inferredDate(doc)||firstSeen(doc)}
  function relativePriority(doc){
    const theme=documentTheme(doc),type=documentType(doc);
    return (type==='retificacao'?15:type==='resultado'?12:type==='edital'?7:0)
      + (theme==='audiovisual'?8:theme==='festivais'?6:0)
      + (/oitava|giovanna|giovana/i.test(doc.titulo||'')?25:0);
  }
  function sortDocs(docs,sort=sortMode){
    const copy=[...docs];
    if(sort==='relevant')return copy.sort((a,b)=>relativePriority(b)-relativePriority(a)||viewDate(b).localeCompare(viewDate(a)));
    if(sort==='indexed')return copy.sort((a,b)=>firstSeen(b).localeCompare(firstSeen(a)));
    return copy.sort((a,b)=>viewDate(b).localeCompare(viewDate(a))||firstSeen(b).localeCompare(firstSeen(a)));
  }
  function withinPeriod(doc,p){
    if(p==='all')return true;
    const date=viewDate(doc);
    if(!date)return false;
    const ref=new Date(date+'T12:00:00Z');
    const today=new Date(),days=Number(p);
    return Number.isFinite(ref.getTime()) && ref.getTime()>=today.getTime()-days*86400000 && ref.getTime()<=today.getTime()+86400000;
  }
  function officialLogo(program){
    const logo=OFFICIAL_LOGOS[program];
    return logo?'<img class="ed-pub-logo" src="'+escapeHTML(logo)+'" alt="Marca oficial do programa" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"/><span hidden class="ed-brand-fallback">'+escapeHTML(PROGRAMS[program]?.short||'')+'</span>':'';
  }
  let allowLink=()=>false,htmlEscape=escapeHTML;

  function editalReference(title) {
    const number=editalNumber(title);if(!number)return '';
    const year=String(title||'').match(/\bedital\b[^0-9]{0,20}\d{1,4}\s*(?:\/|[-–—])\s*(20\d{2})\b/i);
    return number+(year?'/'+year[1]:'');
  }
  function showItem(item) {
    const kind=classifyDocument(item);
    const number=editalReference(item.titulo);
    const reference=inferredDate(item),first=firstSeen(item),read=safeText(item.ultima_leitura).slice(0,10);
    const fmt=d=>d?d.split('-').reverse().join('/'):'—';
    const docLabel=reference?'Data identificada no arquivo: '+fmt(reference):'Data do documento não informada';
    const meta='<span class="ed-doc-date"><time datetime="'+escapeHTML(reference||first)+'">'+escapeHTML(reference?fmt(reference):'Sem data')+'</time><small>'+escapeHTML(reference?'NO ARQUIVO':'NÃO INFORMADA')+'</small></span>';
    const secondary='Adicionado ao radar: '+fmt(first)+(read?' · Lido em '+fmt(read):' · Leitura não registrada');
    const href=allowLink(item.url) ?
      '<a class="radar-entry-link" href="'+htmlEscape(item.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Abrir documento oficial: '+htmlEscape(item.titulo)+'">Documento oficial <span aria-hidden="true">↗</span></a>':'';
    return '<article class="radar-entry">'+
      '<div class="radar-entry-main">'+
      '<div class="radar-entry-labels"><span class="radar-type-pill type-'+kind.type+'">'+htmlEscape(TYPES[kind.type]?.short||'Documento')+'</span>'+
      (number?'<span class="radar-edital-pill">Edital '+htmlEscape(number)+'</span>':'')+'</div>'+
      '<strong class="radar-entry-title">'+htmlEscape(item.titulo)+'</strong>'+
      '<small>'+htmlEscape(docLabel)+'</small><small class="ed-date-meta">'+htmlEscape(secondary)+'</small></div>'+meta+(href?'<div class="op-doc-actions">'+href+'<button type="button" class="op-doc-save" data-doc-save="'+htmlEscape(item.url)+'" aria-pressed="false" aria-label="Salvar documento: '+htmlEscape(item.titulo)+'">☆ Salvar</button></div>':'')+'</article>';
  }

  // Nível 1: programa; nível 2: modalidade; nível 3: tipo de documento.
  // A organização preserva cada arquivo e evita repetir uma mesma modalidade várias vezes.
  function buildHierarchy(groups) {
    const programs=new Map();
    for(const group of groups) {
      if(!programs.has(group.program))programs.set(group.program,new Map());
      const themes=programs.get(group.program);
      if(!themes.has(group.theme))themes.set(group.theme,[]);
      themes.get(group.theme).push(group);
    }
    return Array.from(programs,([program,themes])=>({
      program,
      categories:Array.from(themes,([theme,types])=>({
        theme,
        types:types.sort((a,b)=>(TYPES[a.type]?.order||99)-(TYPES[b.type]?.order||99)),
        count:types.reduce((n,g)=>n+g.items.length,0),
        latest:types.flatMap(g=>g.items).map(viewDate).sort().reverse()[0]||''
      })).sort((a,b)=>(THEMES[a.theme]?.order||99)-(THEMES[b.theme]?.order||99))
    })).sort((a,b)=>(PROGRAMS[a.program]?.order||99)-(PROGRAMS[b.program]?.order||99));
  }
  const accordionOverrides=new Map();
  function detailsAttrs(key,defaultOpen) {
    const open=accordionOverrides.has(key)?accordionOverrides.get(key):defaultOpen;
    return ' data-accordion-key="'+escapeHTML(key)+'"'+(open?' open':'');
  }
  function latestLabel(date) {
    return date?'<span class="radar-accordion-latest">Data mais recente no grupo: '+escapeHTML(date.split('-').reverse().join('/'))+'</span>':'';
  }
  function card(group,defaultOpen) {
    const types=TYPES[group.type]||TYPES.documento;
    const key='type:'+group.program+':'+group.theme+':'+group.type;
    const latest=group.items.slice(0,3),extra=group.items.slice(3);
    return '<details class="radar-topic-card radar-accordion-level-3" data-kind="'+escapeHTML(group.type)+'"'+detailsAttrs(key,defaultOpen)+'>'+
      '<summary class="radar-topic-header"><div><span class="radar-topic-kicker">TIPO DE PUBLICAÇÃO</span><h4>'+escapeHTML(types.name)+'</h4></div>'+
      '<div class="radar-topic-count">'+group.items.length+' <span>documento'+(group.items.length===1?'':'s')+'</span></div>'+
      '<span class="radar-accordion-chevron" aria-hidden="true"></span></summary>'+
      '<div class="radar-topic-contents"><div class="radar-topic-list">'+latest.map(showItem).join('')+'</div>'+
      (extra.length?'<details class="radar-more"><summary><span>Mostrar outros '+extra.length+' documento'+(extra.length===1?'':'s')+' deste tipo</span><span aria-hidden="true" class="radar-more-chevron">⌄</span></summary><div class="radar-topic-list extra">'+extra.map(showItem).join('')+'</div></details>':'')+
      '</div></details>';
  }
  function categorySection(category,program,isFirstCategory,defaultOpen,forceOpen) {
    const theme=THEMES[category.theme]||THEMES.geral;
    const key='theme:'+program+':'+category.theme;
    const open=forceOpen||(defaultOpen&&isFirstCategory);
    return '<details class="radar-category-section radar-accordion-level-2"'+detailsAttrs(key,open)+'>'+
      '<summary class="radar-category-title"><span class="radar-category-index">'+escapeHTML(String(theme.order||7).padStart(2,'0'))+'</span>'+
      '<span class="radar-category-label"><strong>'+escapeHTML(theme.name)+'</strong>'+
      '<small>'+category.count+' documento'+(category.count===1?'':'s')+' em '+category.types.length+' tipo'+(category.types.length===1?'':'s')+
      latestLabel(category.latest)+'</small></span>'+
      '<span class="radar-accordion-chevron" aria-hidden="true"></span></summary>'+
      '<div class="radar-category-contents"><div class="radar-topic-grid">'+
      category.types.map((group,i)=>card(group,forceOpen||(open&&i===0))).join('')+
      '</div></div></details>';
  }
  function programSection(section,isFirst,forceOpen) {
    const program=section.program;
    const source=PROGRAMS[program]||{short:'Outras fontes',name:'Outras fontes',tone:'other'};
    const count=section.categories.reduce((t,g)=>t+g.count,0);
    const key='program:'+program;
    const isOpen=forceOpen||(filterProgram!=='todos'&&filterProgram===program)||(isFirst&&filterProgram==='todos');
    const logo=OFFICIAL_LOGOS[program]?officialLogo(program):svgMark(program);
    return '<details class="radar-source-section radar-accordion-level-1 program-'+source.tone+'"'+detailsAttrs(key,isOpen)+'>'+
      '<summary class="radar-source-title"><span class="radar-source-emblem">'+logo+'</span>'+
      '<span class="radar-source-name"><small>PROGRAMA / FONTE</small><strong>'+escapeHTML(source.name)+'</strong>'+
      '<span>'+section.categories.length+' categoria'+(section.categories.length===1?'':'s')+' · '+count+' documento'+(count===1?'':'s')+'</span></span>'+
      '<span class="radar-accordion-chevron" aria-hidden="true"></span></summary>'+
      '<div class="radar-source-contents"><div class="radar-category-grid">'+
      section.categories.map((c,i)=>categorySection(c,program,i,isOpen,forceOpen)).join('')+
      '</div></div></details>';
  }
  function renderCurrent() {
    const sum=document.getElementById('radarProgramSummary');
    const target=document.getElementById('monitorPublications');
    const counter=document.getElementById('radarVisibleCounter');
    if(!target || !sum)return;
    const allGroups=groupPublications(sortDocs(currentDocs.filter(p=>withinPeriod(p,period))));
    const programIDs=['pnab_pg','lpg_pg','diario_pg'];
    sum.innerHTML=programIDs.map(id=>{
      const data=PROGRAMS[id],amount=currentDocs.filter(d=>d.fonte===id).length;
      const active=filterProgram===id,logo=svgMark(id);
      return '<button type="button" class="radar-program-card program-'+data.tone+(active?' is-active':'')+
        '" data-program="'+id+'" aria-pressed="'+active+'">'+
        '<span class="radar-program-icon">'+(OFFICIAL_LOGOS[id]?officialLogo(id):logo)+'<b>'+data.short+'</b></span>'+
        '<span class="radar-program-content"><strong>'+data.short+'</strong><small>'+escapeHTML(data.name)+'</small><span>'+amount+' documentos · '+escapeHTML(data.detail)+'</span></span>'+
        '<span class="radar-program-arrow" aria-hidden="true">→</span></button>';
    }).join('');
    sum.querySelectorAll('[data-program]').forEach(btn=>btn.addEventListener('click',()=>{
      filterProgram=filterProgram===btn.dataset.program?'todos':btn.dataset.program;
      accordionOverrides.clear();
      renderCurrent();
    }));
    let filtered=allGroups.filter(g=>(filterProgram==='todos'||g.program===filterProgram)
      &&(filterType==='todos'||g.type===filterType)
      &&(filterTheme==='todos'||g.theme===filterTheme));
    if(query){
      const terms=norm(query);
      filtered=filtered.map(g=>({...g,items:g.items.filter(p=>norm(p.titulo+' '+(p.url||'')+' '+(PROGRAMS[g.program]?.name||'')).includes(terms))})).filter(g=>g.items.length);
    }
    filtered=filtered.map(g=>({...g,items:sortDocs(g.items)}));
    if(sortMode==='recent'||sortMode==='indexed'){
      filtered.sort((a,b)=>viewDate(sortDocs(b.items)[0]||{}).localeCompare(viewDate(sortDocs(a.items)[0]||{})));
    }else if(sortMode==='relevant'){
      filtered.sort((a,b)=>relativePriority(sortDocs(b.items)[0]||{})-relativePriority(sortDocs(a.items)[0]||{}));
    }
    const total=filtered.reduce((acc,g)=>acc+g.items.length,0);
    if(counter)counter.textContent=total+' arquivo'+(total===1?'':'s')+' · '+filtered.length+' grupo'+(filtered.length===1?'':'s')+' visualizado'+(filtered.length===1?'':'s');
    if(!filtered.length){
      target.innerHTML='<div class="radar-empty"><strong>Nenhuma publicação para estes filtros</strong><p>Experimente outro programa, modalidade ou tipo de documento.</p></div>';
      return;
    }
    const hierarchy=buildHierarchy(filtered);
    const forceOpen=Boolean(query || filterType!=='todos' || filterTheme!=='todos');
    target.innerHTML=hierarchy.map((section,i)=>programSection(section,i===0,forceOpen)).join('');
  }
  function renderRadarOrganizado(docs,allowed,esc){
    currentDocs=Array.isArray(docs)?docs:[];
    allowLink=typeof allowed==='function'?allowed:()=>false;
    htmlEscape=typeof esc==='function'?esc:escapeHTML;
    const selector=document.getElementById('radarTypeFilter');
    const theme=document.getElementById('radarThemeFilter');
    const input=document.getElementById('radarDocQuery');
    const reset=document.getElementById('radarResetFilters');
    const target=document.getElementById('monitorPublications');
    if(target&&!target.dataset.accordionBound) {
      target.dataset.accordionBound='1';
      target.addEventListener('click',e=>{
        const summary=e.target.closest('summary');
        if(!summary || !target.contains(summary))return;
        const details=summary.parentElement;
        if(details?.matches('details[data-accordion-key]')){
          accordionOverrides.set(details.dataset.accordionKey,!details.open);
        }
      });
    }
    const controls=document.querySelector('.radar-toolbar');
    if(controls&&!document.getElementById('radarAccordionActions')) {
      const actions=document.createElement('div');
      actions.id='radarAccordionActions';
      actions.className='radar-accordion-actions';
      actions.innerHTML='<span><strong>Explorar por etapas</strong><small>Abra o programa, a modalidade e o tipo de publicação para ver os arquivos.</small></span>'+
        '<div class="radar-accordion-buttons"><button type="button" id="radarExpandAll">Expandir tudo</button><button type="button" id="radarCollapseAll">Recolher tudo</button></div>';
      controls.append(actions);
      for(const [id,open] of [['radarExpandAll',true],['radarCollapseAll',false]]) {
        document.getElementById(id).addEventListener('click',()=>{
          document.querySelectorAll('#monitorPublications details[data-accordion-key]').forEach(item=>{
            accordionOverrides.set(item.dataset.accordionKey,open);
            item.open=open;
          });
        });
      }
    }
    if(controls && !document.getElementById('edSortMode')){
      const node=document.createElement('div');node.className='ed-date-tools';
      node.innerHTML='<label for="edSortMode">Ordenar por<select id="edSortMode"><option value="recent">Mais recentes — data do arquivo</option><option value="relevant">Mais relevantes para audiovisual</option><option value="indexed">Adicionados recentemente ao radar</option></select></label>'+
      '<label for="edPeriod">Período<select id="edPeriod"><option value="all">Todo o histórico</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></label>';
      controls.prepend(node);
      node.querySelector('#edSortMode').addEventListener('change',e=>{sortMode=e.target.value;renderCurrent();});
      node.querySelector('#edPeriod').addEventListener('change',e=>{period=e.target.value;renderCurrent();});
    }
    if(selector&&!selector.dataset.bound){selector.dataset.bound='1';selector.addEventListener('change',()=>{filterType=selector.value;accordionOverrides.clear();renderCurrent();});}
    if(theme&&!theme.dataset.bound){theme.dataset.bound='1';theme.addEventListener('change',()=>{filterTheme=theme.value;accordionOverrides.clear();renderCurrent();});}
    if(input&&!input.dataset.bound){input.dataset.bound='1';input.addEventListener('input',()=>{query=input.value.trim();accordionOverrides.clear();renderCurrent();});}
    if(reset&&!reset.dataset.bound){reset.dataset.bound='1';reset.addEventListener('click',()=>{
      filterProgram='todos';filterType='todos';filterTheme='todos';query='';sortMode='recent';period='all';accordionOverrides.clear();
      const sort=document.getElementById('edSortMode'),p=document.getElementById('edPeriod');
      if(sort)sort.value='recent';if(p)p.value='all';
      if(selector)selector.value='todos';if(theme)theme.value='todos';if(input)input.value='';
      renderCurrent();
    });}
    renderCurrent();
  }
  const api={PROGRAMS,TYPES,THEMES,documentType,documentTheme,classifyDocument,groupPublications,buildHierarchy,editalNumber,editalReference,inferredDate,sortDocs,withinPeriod};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&typeof document!=='undefined')root.renderRadarOrganizado=renderRadarOrganizado;
})(typeof window!=='undefined'?window:null);
