/* Radar organizado da Oitava Parede — agrupamento visual sem inferir decisões oficiais. */
(function (root) {
  'use strict';
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
      const dedup = String(item.id || item.url);
      if (used.has(dedup)) return;
      used.add(dedup);
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
  let filterProgram='todos', filterType='todos', filterTheme='todos', query='';
  let allowLink=()=>false,htmlEscape=escapeHTML;

  function showItem(item) {
    const kind=classifyDocument(item);
    const number=editalNumber(item.titulo);
    const date=safeText(item.primeira_detecao).slice(0,10);
    const docLabel=item.base_inicial?'Inventário inicial':date ? 'Identificado em '+date.split('-').reverse().join('/'):'Documento identificado';
    const href=allowLink(item.url) ?
      '<a class="radar-entry-link" href="'+htmlEscape(item.url)+'" target="_blank" rel="noopener noreferrer" aria-label="Abrir documento oficial: '+htmlEscape(item.titulo)+'">Documento oficial <span aria-hidden="true">↗</span></a>':'';
    return '<article class="radar-entry">'+
      '<div class="radar-entry-main">'+
      '<div class="radar-entry-labels"><span class="radar-type-pill type-'+kind.type+'">'+htmlEscape(TYPES[kind.type]?.short||'Documento')+'</span>'+
      (number?'<span class="radar-edital-pill">Edital '+htmlEscape(number)+'/2026</span>':'')+'</div>'+
      '<strong class="radar-entry-title">'+htmlEscape(item.titulo)+'</strong>'+
      '<small>'+htmlEscape(docLabel)+' · Conferir publicação original</small></div>'+href+'</article>';
  }
  function card(group) {
    const types=TYPES[group.type], theme=THEMES[group.theme]||THEMES.geral;
    const latest=group.items.slice(0,2),extra=group.items.slice(2);
    const area=group.theme!=='geral'?'<span class="radar-area-pill">'+escapeHTML(theme.name)+'</span>':'';
    return '<section class="radar-topic-card" data-kind="'+escapeHTML(group.type)+'">'+
      '<div class="radar-topic-header"><div><span class="radar-topic-kicker">'+escapeHTML(types.short)+'</span><h4>'+escapeHTML(group.theme==='geral'?types.name:theme.name)+'</h4></div><div class="radar-topic-count">'+group.items.length+' <span>arquivo'+(group.items.length===1?'':'s')+'</span></div></div>'+
      (area?'<div class="radar-topic-subline">'+area+'</div>':'')+
      '<div class="radar-topic-list">'+latest.map(showItem).join('')+'</div>'+
      (extra.length?'<details class="radar-more"><summary><span>Ver mais '+extra.length+' documento'+(extra.length===1?'':'s')+' deste grupo</span><span aria-hidden="true" class="radar-more-chevron">⌄</span></summary><div class="radar-topic-list extra">'+extra.map(showItem).join('')+'</div></details>':'')+
    '</section>';
  }
  function renderCurrent() {
    const sum=document.getElementById('radarProgramSummary');
    const target=document.getElementById('monitorPublications');
    const counter=document.getElementById('radarVisibleCounter');
    if(!target || !sum)return;
    const allGroups=groupPublications(currentDocs);
    const programIDs=['pnab_pg','lpg_pg','diario_pg'];
    sum.innerHTML=programIDs.map(id=>{
      const data=PROGRAMS[id],amount=currentDocs.filter(d=>d.fonte===id).length;
      const active=filterProgram===id,logo=svgMark(id);
      return '<button type="button" class="radar-program-card program-'+data.tone+(active?' is-active':'')+
        '" data-program="'+id+'" aria-pressed="'+active+'">'+
        '<span class="radar-program-icon">'+logo+'<b>'+data.short+'</b></span>'+
        '<span class="radar-program-content"><strong>'+data.short+'</strong><small>'+escapeHTML(data.name)+'</small><span>'+amount+' documentos · '+escapeHTML(data.detail)+'</span></span>'+
        '<span class="radar-program-arrow" aria-hidden="true">→</span></button>';
    }).join('');
    sum.querySelectorAll('[data-program]').forEach(btn=>btn.addEventListener('click',()=>{
      filterProgram=filterProgram===btn.dataset.program?'todos':btn.dataset.program;
      renderCurrent();
    }));
    let filtered=allGroups.filter(g=>(filterProgram==='todos'||g.program===filterProgram)
      &&(filterType==='todos'||g.type===filterType)
      &&(filterTheme==='todos'||g.theme===filterTheme));
    if(query){
      const terms=norm(query);
      filtered=filtered.map(g=>({...g,items:g.items.filter(p=>norm(p.titulo+' '+(p.url||'')+' '+(PROGRAMS[g.program]?.name||'')).includes(terms))})).filter(g=>g.items.length);
    }
    const total=filtered.reduce((acc,g)=>acc+g.items.length,0);
    if(counter)counter.textContent=total+' arquivo'+(total===1?'':'s')+' · '+filtered.length+' grupo'+(filtered.length===1?'':'s')+' visualizado'+(filtered.length===1?'':'s');
    if(!filtered.length){
      target.innerHTML='<div class="radar-empty"><strong>Nenhuma publicação para estes filtros</strong><p>Experimente outro programa, modalidade ou tipo de documento.</p></div>';
      return;
    }
    const byProgram=new Map();
    filtered.forEach(g=>{if(!byProgram.has(g.program))byProgram.set(g.program,[]);byProgram.get(g.program).push(g);});
    target.innerHTML=Array.from(byProgram.entries()).map(([program,groups])=>{
      const source=PROGRAMS[program]||{short:'Outras fontes',name:'Outras fontes',tone:'other'};
      const count=groups.reduce((t,g)=>t+g.items.length,0);
      return '<section class="radar-source-section program-'+source.tone+'">'+
        '<div class="radar-source-title"><span class="radar-source-emblem">'+svgMark(program)+'</span>'+
        '<div><small>FONTE / PROGRAMA</small><h3>'+escapeHTML(source.name)+'</h3>'+
        '<p>'+count+' documento'+(count===1?'':'s')+' agrupado'+(count===1?'':'s')+' por tipo e modalidade</p></div></div>'+
        '<div class="radar-topic-grid">'+groups.map(card).join('')+'</div></section>';
    }).join('');
  }
  function renderRadarOrganizado(docs,allowed,esc){
    currentDocs=Array.isArray(docs)?docs:[];
    allowLink=typeof allowed==='function'?allowed:()=>false;
    htmlEscape=typeof esc==='function'?esc:escapeHTML;
    const selector=document.getElementById('radarTypeFilter');
    const theme=document.getElementById('radarThemeFilter');
    const input=document.getElementById('radarDocQuery');
    const reset=document.getElementById('radarResetFilters');
    if(selector&&!selector.dataset.bound){selector.dataset.bound='1';selector.addEventListener('change',()=>{filterType=selector.value;renderCurrent();});}
    if(theme&&!theme.dataset.bound){theme.dataset.bound='1';theme.addEventListener('change',()=>{filterTheme=theme.value;renderCurrent();});}
    if(input&&!input.dataset.bound){input.dataset.bound='1';input.addEventListener('input',()=>{query=input.value.trim();renderCurrent();});}
    if(reset&&!reset.dataset.bound){reset.dataset.bound='1';reset.addEventListener('click',()=>{
      filterProgram='todos';filterType='todos';filterTheme='todos';query='';
      if(selector)selector.value='todos';if(theme)theme.value='todos';if(input)input.value='';
      renderCurrent();
    });}
    renderCurrent();
  }
  const api={PROGRAMS,TYPES,THEMES,documentType,documentTheme,classifyDocument,groupPublications,editalNumber};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&typeof document!=='undefined')root.renderRadarOrganizado=renderRadarOrganizado;
})(typeof window!=='undefined'?window:null);
