/* Oitava Parede — capa editorial e linha do tempo. A marca original já pertence ao site. */
(function(root){
'use strict';
function docDate(doc){
 const fromData=String(doc.data_no_arquivo||'').slice(0,10);
 if(/^\d{4}-\d{2}-\d{2}$/.test(fromData))return {date:fromData,source:'no arquivo'};
 const match=String(doc.url||'').match(/(?:^|\/)(20\d\d)([01]\d)([0-3]\d)[_-]/);
 if(match){
  const v=match[1]+'-'+match[2]+'-'+match[3];
  if(!Number.isNaN(Date.parse(v)))return {date:v,source:'no arquivo'};
 }
 const seen=String(doc.primeira_detecao||'').slice(0,10);
 return {date:seen,source:'indexado'};
}
function fmtDate(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return 'Sem data';
 const [year,month,day]=date.split('-');
 return day+'.'+month+'.'+year;
}
function sortedDocs(docs){
 return [...docs].filter(x=>x&&x.titulo&&x.url).sort((a,b)=>docDate(b).date.localeCompare(docDate(a).date));
}
function escapeHTML(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const sourceName={pnab_pg:'PNAB · Praia Grande',lpg_pg:'Lei Paulo Gustavo',diario_pg:'Diário Oficial'};
function mountEditorial(){
 if(document.querySelector(".ed-home"))return;
 const spot=document.querySelector("main > .hero");if(!spot)return;
 spot.insertAdjacentHTML("beforebegin","<section class=\"ed-home\" id=\"inicio-editorial\" aria-label=\"Painel inicial da Oitava Parede\"><div class=\"wrap\"><div class=\"ed-hero\">\n<div class=\"ed-hero-copy\"><div class=\"ed-kicker\">OITAVA PAREDE · ARQUIVO EM MOVIMENTO</div>\n<h1>O que vem<br/>a <em>seguir?</em></h1>\n<p class=\"ed-hero-intro\">Editais, projetos, produção audiovisual, repertório cultural e os próximos encontros da equipe. Um espaço de pesquisa para os membros da Oitava Parede, sem ruído e com o que importa organizado.</p>\n<div class=\"ed-inline-actions\"><a class=\"ed-cta\" href=\"#monitor\">Explorar editais <span aria-hidden=\"true\">→</span></a><a class=\"ed-cta ghost\" href=\"#agenda\">Ver agenda cultural <span aria-hidden=\"true\">→</span></a></div></div>\n<div class=\"ed-hero-art\"><div class=\"ed-art-ring\" aria-hidden=\"true\"></div><div class=\"ed-art-eight\" aria-hidden=\"true\">8</div><img class=\"ed-art-logo\" alt=\"Logotipo original da Oitava Parede Films\" loading=\"eager\"/>\n<div class=\"ed-art-stamp\">OITAVA<br/>PAREDE<br/>FILMES</div><div class=\"ed-art-caption\"><span>IMAGENS · FILMES · CULTURA</span><a href=\"https://www.instagram.com/oitavaparede/\" target=\"_blank\" rel=\"noopener noreferrer\">Acervo no Instagram →</a></div></div>\n</div></div><div class=\"ed-badge-strip\"><div class=\"wrap\"><span id=\"edToday\">Central do coletivo</span><span>Projetos e buscas de <strong>Giovanna Barbosa · OitavaFest</strong></span><a href=\"#edPulse\">Últimas publicações →</a></div></div>\n<div class=\"wrap\"><nav class=\"ed-modules\" aria-label=\"Áreas principais\"><a class=\"ed-module\" href=\"#monitor\"><div class=\"ed-module-head\"><span>01 / MONITORAMENTO</span><span>→</span></div><h2>Radar de<br/>editais.</h2><p>Inscrições, resultados, recursos e mudanças em documentos oficiais.</p></a>\n<a class=\"ed-module\" href=\"#agenda\"><div class=\"ed-module-head\"><span>02 / REPERTÓRIO</span><span>→</span></div><h2>Agenda<br/>cultural.</h2><p>Festivais, cinema, shows e eventos para ampliar as referências.</p></a>\n<a class=\"ed-module\" href=\"#reunioes\"><div class=\"ed-module-head\"><span>03 / CONEXÃO</span><span>→</span></div><h2>Reuniões<br/>& encontros.</h2><p>Cafés, bares e espaços de trabalho para transformar ideias em projetos.</p></a></nav></div></section>\n<section class=\"ed-feature-zone\" id=\"edPulse\" aria-label=\"Últimos documentos identificados\"><div class=\"wrap\"><div class=\"ed-section-top\"><div><div class=\"ed-kicker\" style=\"color:#cfdef9\">AGORA NO RADAR</div><h2>Últimas <em>movimentações.</em></h2></div><div class=\"ed-small\"><span id=\"edLastCheck\">Verificação automática do radar</span><p>Datas de arquivos não comprovam publicação oficial. Consulte os originais.</p></div></div>\n<div class=\"ed-pulse-grid\" id=\"edPulseList\"><div class=\"ed-pulse-card\">Carregando publicações recentes...</div></div></div></section>\n<section class=\"ed-programs\" id=\"marcas\" aria-label=\"Programas e marcas oficiais\"><div class=\"wrap\"><div class=\"ed-program-header\"><div><div class=\"ed-kicker\">FONTES & PROGRAMAS</div><h2>De onde vem<br/>a informação.</h2></div><p>Marcas oficiais usadas apenas para identificar as fontes. A central não representa os órgãos públicos.</p></div><div class=\"ed-program-grid\">\n<article class=\"ed-program\"><div class=\"ed-program-logo\"><img alt=\"Logotipo oficial Política Nacional Aldir Blanc\" loading=\"lazy\" src=\"https://www.gov.br/cultura/pt-br/assuntos/politica-nacional-aldir-blanc/documentos/logos-e-reguas/rgb-horizontal.png\" onerror=\"this.hidden=true;this.nextElementSibling.hidden=false\"/><span class=\"ed-logo-fallback\" hidden>PNAB</span></div><h3>Política Nacional<br/>Aldir Blanc</h3><p>Resultados, editais, retificações e etapas do fomento cultural.</p><a href=\"https://www2.praiagrande.sp.gov.br/secretarias/cultura-turismo/lei-aldir-blanc\" rel=\"noopener noreferrer\" target=\"_blank\">Consultar editais em Praia Grande →</a><span class=\"ed-program-source\">MARCA: MINISTÉRIO DA CULTURA</span></article>\n<article class=\"ed-program\"><div class=\"ed-program-logo\"><img alt=\"Assinatura oficial Lei Paulo Gustavo\" loading=\"lazy\" src=\"https://www.gov.br/cultura/pt-br/assuntos/lei-paulo-gustavo/imagens/horizontal_preferencial.png\" onerror=\"this.hidden=true;this.nextElementSibling.hidden=false\"/><span class=\"ed-logo-fallback\" hidden>LPG</span></div><h3>Lei<br/>Paulo Gustavo</h3><p>Documentos e resultados de editais culturais e audiovisuais.</p><a href=\"https://www2.praiagrande.sp.gov.br/secretarias/cultura-turismo/lei-paulo-gustavo\" target=\"_blank\" rel=\"noopener noreferrer\">Consultar editais em Praia Grande →</a><span class=\"ed-program-source\">MARCA: MINISTÉRIO DA CULTURA</span></article>\n<article class=\"ed-program\"><div class=\"ed-program-logo\"><img alt=\"Logo oficial ProAC SP\" loading=\"lazy\" src=\"https://fomentocultsp.sp.gov.br/assets/image/proac/proac-all-black.png\" onerror=\"this.hidden=true;this.nextElementSibling.hidden=false\"/><span class=\"ed-logo-fallback\" hidden>PROAC</span></div><h3>ProAC /<br/>Fomento CULTSP</h3><p>Oportunidades estaduais para consulta manual; ainda não há varredura automática desta fonte.</p><a href=\"https://fomentocultsp.sp.gov.br/\" target=\"_blank\" rel=\"noopener noreferrer\">Abrir o portal oficial →</a><span class=\"ed-program-source\">MARCA: FOMENTO CULTSP</span></article>\n</div><p class=\"ed-image-note\">Logotipos provenientes dos portais oficiais. Para aplicação institucional, consulte os manuais de cada programa.</p></div></section>\n<section class=\"ed-ig\" id=\"acervo\" aria-label=\"Acervo Oitava Parede\"><div class=\"wrap\"><div class=\"ed-ig-inner\"><div class=\"ed-ig-copy\"><div class=\"ed-kicker\">OITAVA PAREDE · NO SET E FORA DELE</div><h2>Histórias<br/>em <em>imagens.</em></h2><p>Os bastidores, fotografias e registros oficiais do coletivo estão no perfil original. Acesse diretamente o acervo da produtora.</p><a href=\"https://www.instagram.com/oitavaparede/\" target=\"_blank\" rel=\"noopener noreferrer\">Ver fotografias e bastidores no Instagram →</a></div><a href=\"https://www.instagram.com/oitavaparede/\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"ed-ig-art\" aria-label=\"Abrir o Instagram da Oitava Parede\"><img class=\"ed-ig-art-logo\" alt=\"Marca Oitava Parede\"/><span class=\"ed-ig-stamp\">ACERVO OFICIAL →</span></a></div>\n<p class=\"ed-image-note\">Fotografias, bastidores e registros da Oitava Parede no perfil oficial do coletivo.</p></div></section>");
 document.documentElement.classList.add("ed-ready");
 const nav=document.getElementById("nav");if(nav&&!nav.querySelector('[href="#acervo"]')){
 const a=document.createElement("a");a.href="#acervo";a.textContent="Acervo";nav.appendChild(a);
 a.addEventListener("click",()=>{nav.classList.remove("open");const b=document.getElementById("menuButton");if(b)b.setAttribute("aria-expanded","false");});}
}
function init(){
 mountEditorial();
 const logo=document.querySelector('.site-head .brand-logo')||document.querySelector('.brand-logo');
 if(logo)document.querySelectorAll('.ed-art-logo,.ed-ig-art-logo').forEach(x=>{x.src=logo.src;});
 const top=document.getElementById('edToday');
 if(top){
  const today=new Date();
  top.textContent='Central do coletivo · '+today.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'long',year:'numeric'});
 }
 const list=document.getElementById('edPulseList');
 if(!list)return;
 fetch('./dados/radar.json?t='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('radar');return r.json()}).then(data=>{
  const generated=data.generated_at;
  const checked=document.getElementById('edLastCheck');
  if(checked&&generated){
   const date=new Date(generated);
   if(!Number.isNaN(date.getTime()))checked.textContent='ÚLTIMA VARREDURA · '+date.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'});
  }
  const docs=sortedDocs(data.publicacoes||[]);
  const featured=docs.filter(x=>['retificacao','resultado','edital'].includes(x.categoria)).slice(0,3);
  const items=featured.length?featured:docs.slice(0,3);
  if(!items.length){list.innerHTML='<p class="ed-no-pulse">Sem documentos indexados. Consulte as fontes oficiais pelo Radar.</p>';return;}
  list.innerHTML=items.map((d,i)=>{
   const date=docDate(d),kind={retificacao:'Alteração de edital',resultado:'Resultado ou etapa',edital:'Edital / chamada'}[d.categoria]||'Documento';
   const link=String(d.url||'');
   const allowed=link.startsWith('https://')&&(link.includes('praiagrande.sp.gov.br/')||link.includes('plenussistemas.dioenet.com.br/'));
   return '<article class="'+(i===0?'ed-pulse-main':'ed-pulse-card')+'">'+
    '<div class="ed-pulse-item-date"><span>'+escapeHTML(fmtDate(date.date))+'</span><span>'+escapeHTML(date.source==='no arquivo'?'DATA NO ARQUIVO':'INDEXADO NO RADAR')+'</span></div>'+
    '<div class="ed-pulse-title"><small>'+escapeHTML(sourceName[d.fonte]||d.fonte)+' · '+escapeHTML(kind)+'</small>'+escapeHTML(d.titulo)+'</div>'+
    '<div class="ed-pulse-bottom"><span>Conferência do original necessária</span>'+
     (allowed?'<a target="_blank" rel="noopener noreferrer" href="'+escapeHTML(link)+'">Ver documento →</a>':'')+'</div></article>';
  }).join('');
 }).catch(()=>{
  list.innerHTML='<p class="ed-no-pulse">Não foi possível carregar o resumo. Os documentos podem ser consultados no <a href="#monitor">Radar de editais</a>.</p>';
 });
}
const api={docDate,fmtDate,sortedDocs};
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined')if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:null);
