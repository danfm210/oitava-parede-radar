/* Radar organizado da Oitava Parede — agrupamento visual sem inferir decisões oficiais. */
(function (root) {
  'use strict';
  const NEWS_STORE='oitava_novidades_lidas_v1';
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
  let currentDocs=[],recentDocs=[],recentKeys=new Set(),newOnly=false,sessionSeenNotices=new Set();
  let filterProgram='todos', filterType='todos', filterTheme='todos', query='', sortMode='recent', period='all';
  function inferredDate(doc){
    const own=safeText(doc.data_no_arquivo).slice(0,10);
    if(/^20\d{2}-\d{2}-\d{2}$/.test(own))return own;
    const found=safeText(doc.url).match(/(?:^|\/)20(\d{2})([01]\d)([0-3]\d)[_-]/);
    if(found){const date='20'+found[1]+'-'+found[2]+'-'+found[3];if(!Number.isNaN(Date.parse(date)))return date;}
    return '';
  }
  function firstSeen(doc){return safeText(doc.primeira_detecao).slice(0,10)}
  const documentKey=doc=>String(doc.id||doc.url);
  const documentAnchor=doc=>'radar-file-'+encodeURIComponent(documentKey(doc));
  function readNoticeIds(raw){
    try{const values=JSON.parse(raw||'[]');return new Set(Array.isArray(values)?values.filter(value=>typeof value==='string'&&value.length<1200).slice(-1000):[]);}catch{return new Set();}
  }
  const documentNoticeId=doc=>'document:'+documentKey(doc)+':'+safeText(doc.primeira_detecao);
  function newlyDetected(rows,now=Date.now()){
    const end=Number(now),start=end-48*60*60*1000;
    if(!Number.isFinite(end))return [];
    return groupPublications(rows).flatMap(group=>group.items).filter(doc=>{
      const seen=String(doc.primeira_detecao||'');
      const time=/^\d{4}-\d{2}-\d{2}T/.test(seen)?Date.parse(seen):NaN;
      return doc.base_inicial===false&&Number.isFinite(time)&&time>=start&&time<=end;
    }).sort((a,b)=>Date.parse(b.primeira_detecao)-Date.parse(a.primeira_detecao));
  }
  function unseenNewDocuments(rows,seen,now=Date.now()){
    const ids=seen instanceof Set?seen:readNoticeIds(seen);
    return newlyDetected(rows,now).filter(doc=>!ids.has(documentNoticeId(doc)));
  }
  function activeNoticeIds(){
    let ids=new Set();
    try{ids=readNoticeIds(localStorage.getItem(NEWS_STORE));}catch{}
    sessionSeenNotices.forEach(id=>ids.add(id));
    return ids;
  }
  function markDocumentViewed(doc,source='radar'){
    const id=documentNoticeId(doc);sessionSeenNotices.add(id);let persisted=true;
    try{const ids=readNoticeIds(localStorage.getItem(NEWS_STORE));ids.add(id);localStorage.setItem(NEWS_STORE,JSON.stringify([...ids].slice(-1000)));}catch{persisted=false;}
    if(root&&typeof root.dispatchEvent==='function'&&typeof CustomEvent==='function')root.dispatchEvent(new CustomEvent('op:news-seen',{detail:{id,persisted,source}}));
    return persisted;
  }
  const isNew=doc=>recentKeys.has(documentKey(doc));
  const newCount=items=>items.filter(isNew).length;
  const newBadge=count=>count?'<span class="radar-new-badge">'+count+' novo'+(count===1?'':'s')+' no radar</span>':'';
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
      '<a class="radar-entry-link" data-radar-document-key="'+htmlEscape(documentKey(item))+'" href="'+htmlEscape(item.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Abrir documento oficial: '+htmlEscape(item.titulo)+'">Documento oficial <span aria-hidden="true">↗</span></a>':'';
    return '<article class="radar-entry'+(isNew(item)?' is-new-file':'')+'" id="'+escapeHTML(documentAnchor(item))+'" tabindex="-1">'+
      '<div class="radar-entry-main">'+
      '<div class="radar-entry-labels"><span class="radar-type-pill type-'+kind.type+'">'+htmlEscape(TYPES[kind.type]?.short||'Documento')+'</span>'+
      (number?'<span class="radar-edital-pill">Edital '+htmlEscape(number)+'</span>':'')+(isNew(item)?'<span class="radar-new-badge">Novo no radar</span>':'')+'</div>'+
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
  function shouldCollapse(count,branches=2){
    return Number.isFinite(Number(count))&&Number(count)>3&&Number(branches)>1;
  }
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
    const collapsible=shouldCollapse(group.items.length),tag=collapsible?'details':'section',heading=collapsible?'summary':'div';
    const latest=group.items.length<=6?group.items:group.items.slice(0,3),extra=group.items.slice(latest.length);
    return '<'+tag+' class="radar-topic-card radar-accordion-level-3'+(collapsible?'':' op-inline-group')+'" data-kind="'+escapeHTML(group.type)+'"'+(collapsible?detailsAttrs(key,defaultOpen):'')+'>'+
      '<'+heading+' class="radar-topic-header"><div><span class="radar-topic-kicker">TIPO DE PUBLICAÇÃO</span><h4>'+escapeHTML(types.name)+'</h4>'+newBadge(newCount(group.items))+'</div>'+
      '<div class="radar-topic-count">'+group.items.length+' <span>documento'+(group.items.length===1?'':'s')+'</span></div>'+
      (collapsible?'<span class="radar-accordion-chevron" aria-hidden="true"></span>':'')+'</'+heading+'>'+
      '<div class="radar-topic-contents"><div class="radar-topic-list">'+latest.map(showItem).join('')+'</div>'+
      (extra.length?'<details class="radar-more"><summary><span>Mostrar outros '+extra.length+' documento'+(extra.length===1?'':'s')+' deste tipo</span><span aria-hidden="true" class="radar-more-chevron">⌄</span></summary><div class="radar-topic-list extra">'+extra.map(showItem).join('')+'</div></details>':'')+
      '</div></'+tag+'>';
  }
  function categorySection(category,program,isFirstCategory,defaultOpen,forceOpen) {
    const theme=THEMES[category.theme]||THEMES.geral;
    const key='theme:'+program+':'+category.theme;
    const open=forceOpen||(defaultOpen&&isFirstCategory);
    const collapsible=shouldCollapse(category.count,category.types.length),tag=collapsible?'details':'section',heading=collapsible?'summary':'div';
    return '<'+tag+' class="radar-category-section radar-accordion-level-2'+(collapsible?'':' op-inline-group')+'"'+(collapsible?detailsAttrs(key,open):'')+'>'+
      '<'+heading+' class="radar-category-title"><span class="radar-category-index">'+escapeHTML(String(theme.order||7).padStart(2,'0'))+'</span>'+
      '<span class="radar-category-label"><strong'+(collapsible?'':' role="heading" aria-level="4"')+'>'+escapeHTML(theme.name)+'</strong>'+
      '<small>'+category.count+' documento'+(category.count===1?'':'s')+' em '+category.types.length+' tipo'+(category.types.length===1?'':'s')+
      latestLabel(category.latest)+'</small>'+newBadge(newCount(category.types.flatMap(group=>group.items)))+'</span>'+
      (collapsible?'<span class="radar-accordion-chevron" aria-hidden="true"></span>':'')+'</'+heading+'>'+
      '<div class="radar-category-contents"><div class="radar-topic-grid">'+
      category.types.map((group,i)=>card(group,forceOpen||(open&&i===0))).join('')+
      '</div></div></'+tag+'>';
  }
  function programSection(section,isFirst,forceOpen) {
    const program=section.program;
    const source=PROGRAMS[program]||{short:'Outras fontes',name:'Outras fontes',tone:'other'};
    const count=section.categories.reduce((t,g)=>t+g.count,0);
    const added=newCount(section.categories.flatMap(category=>category.types.flatMap(group=>group.items)));
    const key='program:'+program;
    const isOpen=forceOpen||(filterProgram!=='todos'&&filterProgram===program);
    const logo=OFFICIAL_LOGOS[program]?officialLogo(program):svgMark(program);
    const collapsible=shouldCollapse(count,section.categories.length),tag=collapsible?'details':'section',heading=collapsible?'summary':'div';
    return '<'+tag+' class="radar-source-section radar-accordion-level-1 program-'+source.tone+(added?' has-new-files':'')+(collapsible?'':' op-inline-group')+'"'+(collapsible?detailsAttrs(key,isOpen):'')+'>'+
      '<'+heading+' class="radar-source-title"><span class="radar-source-emblem">'+logo+'</span>'+
      '<span class="radar-source-name"><small>PROGRAMA / FONTE</small><strong'+(collapsible?'':' role="heading" aria-level="3"')+'>'+escapeHTML(source.name)+'</strong>'+
      '<span>'+section.categories.length+' categoria'+(section.categories.length===1?'':'s')+' · '+count+' documento'+(count===1?'':'s')+'</span>'+newBadge(added)+'</span>'+
      (collapsible?'<span class="radar-accordion-chevron" aria-hidden="true"></span>':'')+'</'+heading+'>'+
      '<div class="radar-source-contents"><div class="radar-category-grid">'+
      section.categories.map((c,i)=>categorySection(c,program,i===0,isOpen,forceOpen)).join('')+
      '</div></div></'+tag+'>';
  }
  function renderCurrent() {
    const sum=document.getElementById('radarProgramSummary');
    const target=document.getElementById('monitorPublications');
    const counter=document.getElementById('radarVisibleCounter');
    if(!target || !sum)return;
    refreshRecentDocuments();
    const allGroups=groupPublications(sortDocs(currentDocs.filter(p=>withinPeriod(p,period))));
    const programIDs=['pnab_pg','lpg_pg','diario_pg'];
    sum.innerHTML=programIDs.map(id=>{
      const data=PROGRAMS[id],amount=currentDocs.filter(d=>d.fonte===id).length;
      const active=filterProgram===id,logo=svgMark(id);
      return '<button type="button" class="radar-program-card program-'+data.tone+(active?' is-active':'')+
        '" data-program="'+id+'" aria-pressed="'+active+'">'+
        '<span class="radar-program-icon">'+(OFFICIAL_LOGOS[id]?officialLogo(id):logo)+'<b>'+data.short+'</b></span>'+
        '<span class="radar-program-content"><strong>'+data.short+'</strong><small>'+escapeHTML(data.name)+'</small><span>'+amount+' documentos · '+escapeHTML(data.detail)+'</span>'+newBadge(recentDocs.filter(doc=>doc.fonte===id).length)+'</span>'+
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
    if(newOnly)filtered=filtered.map(group=>({...group,items:group.items.filter(isNew)})).filter(group=>group.items.length);
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
      const actions=document.getElementById('radarAccordionActions');if(actions)actions.hidden=true;
      return;
    }
    const hierarchy=buildHierarchy(filtered);
    const forceOpen=Boolean(newOnly || query || filterType!=='todos' || filterTheme!=='todos');
    target.innerHTML=hierarchy.map((section,i)=>programSection(section,i===0,forceOpen)).join('');
    const actions=document.getElementById('radarAccordionActions');if(actions)actions.hidden=!target.querySelector('details[data-accordion-key]');
  }
  function resetFilters(){
    filterProgram='todos';filterType='todos';filterTheme='todos';query='';sortMode='recent';period='all';newOnly=false;accordionOverrides.clear();
    for(const [id,value] of [['edSortMode','recent'],['edPeriod','all'],['radarTypeFilter','todos'],['radarThemeFilter','todos'],['radarDocQuery','']]){
      const control=document.getElementById(id);if(control)control.value=value;
    }
  }
  function revealDocument(doc){
    const item=document.getElementById(documentAnchor(doc));if(!item)return false;
    for(let ancestor=item.parentElement;ancestor;ancestor=ancestor.parentElement){
      if(ancestor.tagName==='DETAILS'){ancestor.open=true;if(ancestor.dataset.accordionKey)accordionOverrides.set(ancestor.dataset.accordionKey,true);}
    }
    document.querySelectorAll('.is-new-target').forEach(node=>node.classList.remove('is-new-target'));
    item.classList.add('is-new-target');item.focus({preventScroll:true});
    item.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
    const status=document.getElementById('radarNewLocation');
    if(status)status.textContent='Arquivo localizado: '+doc.titulo+'.';
    return true;
  }
  function locateDocument(doc){
    resetFilters();renderCurrent();
    return revealDocument(doc);
  }
  function locateDocumentByKey(key){
    const doc=currentDocs.find(item=>documentKey(item)===String(key));
    return doc?locateDocument(doc):false;
  }
  function renderNewFiles(){
    const banner=document.getElementById('radarNewFiles');if(!banner)return;
    banner.hidden=!recentDocs.length;
    if(!recentDocs.length){banner.replaceChildren();return;}
    const count=recentDocs.length;
    banner.innerHTML='<div class="radar-new-heading"><div><h3>'+count+' arquivo'+(count===1?' novo':'s novos')+' ainda não visto'+(count===1?'':'s')+'</h3><p>Adicionados nas últimas 48 horas. Ao localizar ou abrir um arquivo, ele sai desta faixa e continua disponível no radar.</p></div>'+
      '<button type="button" id="radarNewOnly" aria-pressed="'+newOnly+'">'+(newOnly?'Mostrar todos os arquivos':'Ver só os novos')+'</button></div>'+
      '<ul class="radar-new-list">'+recentDocs.slice(0,2).map(doc=>{
        const kind=classifyDocument(doc),path=[PROGRAMS[kind.program]?.name||'Outras fontes',THEMES[kind.theme]?.name||'Diversos e gerais',TYPES[kind.type]?.name||'Outros documentos'].join(' › ');
        return '<li><button type="button" data-radar-locate="'+escapeHTML(documentKey(doc))+'" aria-label="Localizar arquivo: '+escapeHTML(doc.titulo)+'"><span><strong>'+escapeHTML(doc.titulo)+'</strong><small>'+escapeHTML(path)+'</small></span><span class="radar-new-jump" aria-hidden="true">Localizar ↓</span></button></li>';
      }).join('')+'</ul>'+(count>2?'<p class="radar-new-more">Mostrando 2 de '+count+' novidades. Use “Ver só os novos” para ver todas.</p>':'')+'<p id="radarNewLocation" class="radar-new-location" role="status" aria-live="polite"></p>';
    banner.querySelector('#radarNewOnly').addEventListener('click',()=>{
      const next=!newOnly;resetFilters();newOnly=next;if(next){sortMode='indexed';const sort=document.getElementById('edSortMode');if(sort)sort.value='indexed';}
      renderCurrent();document.getElementById('radarNewOnly')?.focus({preventScroll:true});
    });
    banner.querySelectorAll('[data-radar-locate]').forEach(button=>button.addEventListener('click',()=>{
      const doc=recentDocs.find(item=>documentKey(item)===button.dataset.radarLocate);
      if(doc&&locateDocument(doc))markDocumentViewed(doc,'locate');
    }));
  }
  function refreshRecentDocuments(){
    recentDocs=unseenNewDocuments(currentDocs,activeNoticeIds());
    recentKeys=new Set(recentDocs.map(documentKey));
    if(!recentDocs.length)newOnly=false;
    renderNewFiles();
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
        const documentLink=e.target.closest('[data-radar-document-key]');
        if(documentLink&&target.contains(documentLink)){
          const doc=currentDocs.find(item=>documentKey(item)===documentLink.dataset.radarDocumentKey);
          if(doc)markDocumentViewed(doc,'document-link');
        }
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
      actions.innerHTML='<span><strong>Organizar as listas longas</strong><small>Grupos pequenos ficam à vista. Expanda ou recolha os grupos com mais documentos.</small></span>'+
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
      resetFilters();
      renderCurrent();
    });}
    renderCurrent();
  }
  const api={NEWS_STORE,PROGRAMS,TYPES,THEMES,documentType,documentTheme,classifyDocument,groupPublications,buildHierarchy,editalNumber,editalReference,inferredDate,sortDocs,withinPeriod,newlyDetected,readNoticeIds,documentNoticeId,unseenNewDocuments,shouldCollapse};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&typeof document!=='undefined'){
    root.renderRadarOrganizado=renderRadarOrganizado;
    root.OitavaRadar={...api,locateDocument:locateDocumentByKey};
    root.addEventListener('op:news-seen',event=>{
      const sync=()=>{
        const id=event.detail?.id;
        const doc=id?currentDocs.find(item=>documentNoticeId(item)===id):null;
        renderCurrent();
        if(doc&&event.detail?.source!=='document-link')revealDocument(doc);
      };
      if(event.detail?.source==='document-link'&&typeof root.setTimeout==='function')root.setTimeout(sync,0);else sync();
    });
    root.addEventListener('storage',event=>{if(event.key===NEWS_STORE||event.key===null)renderCurrent();});
  }
})(typeof window!=='undefined'?window:null);
