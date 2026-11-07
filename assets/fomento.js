(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.OitavaFomento=api;api.init();}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';

 const PROGRAMS=Object.freeze([
  {
   id:'promac',title:'PROMAC',scope:'São Paulo (capital)',mechanism:'Incentivo fiscal municipal',
   deadline:'2026-05-26',deadlineLabel:'novos projetos',
   fit:'Audiovisual, cinema, festivais, formação e outras linguagens culturais.',
   requirement:'Proponente residente ou sediado no Município de São Paulo há pelo menos 2 anos.',
   note:'Não é um programa estadual. Acompanhar resultados, captação e a próxima edição.',
   url:'https://portadeentrada.prefeitura.sp.gov.br/promac/'
  },
  {
   id:'proac-editais',title:'ProAC Editais / Fomento CultSP',scope:'Estado de São Paulo',mechanism:'Fomento direto estadual',
   status:'Acompanhar resultados e novas chamadas',tone:'watch',
   fit:'Produção audiovisual, telefilme ou longa, roteiro, mostras, festivais e eventos.',
   requirement:'As regras variam por edital; conferir sede, tempo de atuação e tipo de proponente.',
   note:'É a principal frente estadual para chamadas competitivas do grupo.',
   url:'https://www.cultura.sp.gov.br/sec_cultura/Fomento/Programa_ProAC_%28Editais%29'
  },
  {
   id:'proac-icms',title:'ProAC ICMS',scope:'Estado de São Paulo',mechanism:'Incentivo fiscal estadual',
   status:'Captação 2026 em acompanhamento',tone:'watch',
   fit:'Projetos culturais e audiovisuais aprovados para buscar patrocínio incentivado.',
   requirement:'Exige aprovação do projeto e captação com empresas habilitadas; aprovação não garante recurso.',
   note:'Cobertura estadual por incentivo de ICMS, distinta do PROMAC municipal.',
   url:'https://www.cultura.sp.gov.br/sec_cultura/Fomento/FAQ_Transpar%C3%AAncia_ProAC_ICMS'
  },
  {
   id:'pnab-sp',title:'PNAB · Estado de São Paulo',scope:'Estado de São Paulo',mechanism:'Editais públicos estaduais',
   status:'Acompanhar ciclos, resultados e retificações',tone:'watch',
   fit:'Linhas de produção, circulação, formação, espaços e demais ações culturais.',
   requirement:'Elegibilidade e território dependem de cada chamamento estadual.',
   note:'Complementa a PNAB municipal de Praia Grande e os editais da Baixada.',
   url:'https://www.cultura.sp.gov.br/sec_cultura/Fomento/Programa_PNAB'
  },
  {
   id:'spcine-fsa',title:'SPCine / FSA',scope:'São Paulo (capital)',mechanism:'Fomento audiovisual',
   deadline:'2026-12-16',deadlineLabel:'Edital 02/2026 · finalização de longas',
   fit:'Produção, finalização e distribuição de longas e obras seriadas.',
   requirement:'A linha aberta exige produtora independente com matriz e sede no Município de São Paulo há 2 anos.',
   note:'Útil para parceria ou inscrição apenas quando todos os requisitos territoriais forem atendidos.',
   url:'https://spcine.com.br/editais-fsa/'
  },
  {
   id:'facult-santos',title:'FACULT Santos',scope:'Baixada Santista',mechanism:'Fomento municipal',
   deadline:'2026-03-31',deadlineLabel:'edição 2026',
   fit:'Cinema, videografia, fotografia, festivais e outros segmentos culturais.',
   requirement:'Projetos culturais realizados em Santos; confirmar condições da edição vigente.',
   note:'Acompanhar resultados de 2026 e a abertura da próxima edição.',
   url:'https://www.santos.sp.gov.br/?q=node%2F159144'
  },
  {
   id:'ancine-fsa',title:'ANCINE / Fundo Setorial do Audiovisual',scope:'Brasil',mechanism:'Fomento audiovisual federal',
   status:'Acompanhar chamadas oficiais',tone:'watch',
   fit:'Produção, distribuição, coprodução e outras linhas estruturantes do audiovisual.',
   requirement:'Cada chamada define registro ANCINE, perfil da empresa, desempenho e demais condições.',
   note:'Confirmar no portal quais chamadas estão realmente em andamento e seus prazos.',
   url:'https://www.gov.br/ancine/pt-br/fsa/como-participar/chamadas-publicas-disponiveis-1'
  },
  {
   id:'lei-rouanet',title:'Lei Rouanet / SALIC',scope:'Brasil',mechanism:'Incentivo fiscal federal',
   status:'Consultar regras e apresentação no SALIC',tone:'watch',
   fit:'Festivais, mostras, formação, difusão e projetos culturais elegíveis.',
   requirement:'Aprovação autoriza captação; não significa patrocínio garantido nem recurso liberado.',
   note:'Planejar proposta, orçamento, documentação e estratégia de patrocinadores.',
   url:'https://www.gov.br/cultura/pt-br/assuntos/acoes-programas-e-politicas/lei-rouanet-1'
  }
 ]);

 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

 function todayKey(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return `${values.year}-${values.month}-${values.day}`;
 }
 function formatDate(value){
  const [year,month,day]=String(value).split('-');
  return `${day}/${month}/${year}`;
 }
 function statusFor(program,now=new Date()){
  if(!program.deadline)return {label:program.status,tone:program.tone||'watch'};
  const open=todayKey(now)<=program.deadline;
  return open
   ?{label:`Inscrições até ${formatDate(program.deadline)}`,tone:'open'}
   :{label:`Prazo de ${program.deadlineLabel} encerrado em ${formatDate(program.deadline)}`,tone:'closed'};
 }
 function isOfficialURL(value){
  try{
   const url=new URL(value);
   const host=url.hostname.toLowerCase();
   return url.protocol==='https:'&&(
    host==='portadeentrada.prefeitura.sp.gov.br'||host==='www.cultura.sp.gov.br'||
    host==='spcine.com.br'||host==='www.santos.sp.gov.br'||host==='www.gov.br'
   );
  }catch{return false;}
 }
 function card(program,now){
  const state=statusFor(program,now);
  return `<article class="funding-card" data-program="${esc(program.id)}"><div class="funding-card-top"><span class="funding-scope">${esc(program.scope)}</span><span class="funding-state is-${esc(state.tone)}">${esc(state.label)}</span></div><h3>${esc(program.title)}</h3><p class="funding-mechanism">${esc(program.mechanism)}</p><dl><div><dt>Onde pode ajudar</dt><dd>${esc(program.fit)}</dd></div><div><dt>Atenção à elegibilidade</dt><dd>${esc(program.requirement)}</dd></div></dl><p class="funding-note">${esc(program.note)}</p><a href="${esc(program.url)}" target="_blank" rel="noopener noreferrer">Conferir fonte oficial <span aria-hidden="true">→</span></a></article>`;
 }
 function render(node,now=new Date()){
  if(!node)return '';
  const html=PROGRAMS.map(program=>card(program,now)).join('');
  node.innerHTML=html;
  return html;
 }
 function init(){
  const start=()=>render(document.getElementById('fundingChecklist'));
  if(typeof document==='undefined')return;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
 }
 return {PROGRAMS,todayKey,formatDate,statusFor,isOfficialURL,render,init};
});
