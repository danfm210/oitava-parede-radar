/* Oitava Parede · revisão local de menções e ajuda guiada.
   Não envia dados pessoais a terceiros e não oferece respostas por IA generativa embutida. */
(function(root){
'use strict';
const STORE='oitava_mencoes_conferidas_v1';
let mentions=[], allowedUrl=()=>false, escapeFn=(x)=>String(x??''),filter='pendentes',locatedId='';
const $=id=>document.getElementById(id);
let checked={};
try{checked=JSON.parse(localStorage.getItem(STORE)||'{}')||{};if(typeof checked!=='object'||Array.isArray(checked))checked={};}catch{checked={};}
function save(){try{localStorage.setItem(STORE,JSON.stringify(checked));}catch{}}
function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function onlyCleanId(x){return String(x??'').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,90);}
function status(m){return Boolean(checked[onlyCleanId(m.id)]);}
function helpLabel(t){return String(t||'').replace(/\s+/g,' ').trim();}
function renderMentions(rows,allowed,esc){
 if(Array.isArray(rows))mentions=rows;
 if(typeof allowed==='function')allowedUrl=allowed;
 if(typeof esc==='function')escapeFn=esc;
 const node=$('monitorMentions');if(!node)return;
 const total=mentions.length,count=mentions.filter(status).length,remaining=total-count;
 const summary=$('monitorMatches');if(summary)summary.textContent=String(remaining);
 const subset=mentions.filter(m=>filter==='todas'||(filter==='conferidas'?status(m):!status(m))).slice(0,24);
 const located=mentions.find(m=>onlyCleanId(m.id)===locatedId);
 if(filter==='todas'&&located&&!subset.includes(located))subset.push(located);
 const tabs='<div class="op-review-toolbar"><div class="op-review-stats"><strong>'+remaining+' pendente'+(remaining===1?'':'s')+'</strong><span>'+count+' conferida'+(count===1?'':'s')+' neste navegador</span></div>'+
  '<div class="op-review-tabs">'+
   [['pendentes','Pendentes'],['conferidas','Conferidas'],['todas','Todas']].map(([v,l])=>'<button type="button" class="op-review-tab '+(filter===v?'is-active':'')+'" data-review-filter="'+v+'" aria-pressed="'+(filter===v)+'">'+l+'</button>').join('')+
  '</div></div>';
 const note='<p class="op-review-note">Marcação individual deste navegador. Indica apenas que você consultou o documento; não confirma a decisão nem atualiza o registro de outros membros.</p>';
 const list=subset.map(m=>{
  const id=onlyCleanId(m.id),done=status(m),priority=String(m.prioridade||'normal');
  const stamp=done?String(checked[id]?.at||''):'';
  const date=stamp?new Date(stamp).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'';
  const link=allowedUrl(m.url)?'<a class="op-mention-link" target="_blank" rel="noopener noreferrer" href="'+escapeFn(m.url)+'">Abrir original ↗</a>':'';
  return '<article class="op-mention-card '+(done?'is-checked':'')+'" id="op-mention-'+id+'" tabindex="-1">'+
   '<label class="op-mention-check"><input type="checkbox" data-review-id="'+id+'" '+(done?'checked':'')+' aria-label="Marcar documento como conferido: '+escapeHTML(m.titulo)+'"/><span>Conferida</span></label>'+
   '<div class="op-mention-main"><span class="op-mention-priority '+(priority==='maxima'?'is-max':priority==='alta'?'is-high':'')+'">'+(priority==='maxima'?'Prioridade máxima':priority==='alta'?'Prioridade alta':'Menção não confirmada')+'</span>'+
   '<strong>'+escapeFn(m.titulo)+'</strong><p>'+escapeFn(m.mensagem||'Termo localizado; confira o documento.')+'</p>'+
   '<small>'+(done?'✓ Conferida neste dispositivo em '+escapeHTML(date):'Pendente de leitura e verificação')+'</small></div>'+link+'</article>';
 }).join('');
 node.innerHTML=tabs+(subset.length?'<div class="op-review-list">'+list+'</div>':
 '<div class="op-review-empty">'+(total===0?'Nenhuma menção localizada nos documentos analisados.':filter==='pendentes'?'Todas as menções exibidas foram marcadas como conferidas.':'Nenhum registro nesta categoria.')+'</div>')+note;
}
function initReview(){
 const root=$('monitorMentions');
 if(!root || root.dataset.opReviewBound)return;
 root.dataset.opReviewBound='yes';
 root.addEventListener('click',e=>{
  const button=e.target.closest('[data-review-filter]');if(!button)return;
  filter=button.dataset.reviewFilter;renderMentions();
 });
 root.addEventListener('change',e=>{
  const input=e.target.closest('[data-review-id]');if(!input)return;
  const id=onlyCleanId(input.dataset.reviewId);
  if(!mentions.some(m=>onlyCleanId(m.id)===id))return;
  if(input.checked)checked[id]={at:new Date().toISOString()};else delete checked[id];
  save();renderMentions();
  window.dispatchEvent(new CustomEvent('op:reviews-updated'));
 });
}
function buildHelp(){
 if($('opHelpLauncher'))return;
 const wrapper=document.createElement('div');wrapper.className='op-help-shell';
 wrapper.innerHTML='<button id="opHelpLauncher" class="op-help-launcher" type="button" aria-label="Abrir ajuda para usar a Central Oitava Parede" aria-controls="opHelpPanel" aria-expanded="false"><span class="op-help-spark">✳</span><span>Precisa de ajuda?</span></button>'+
 '<section id="opHelpPanel" class="op-help-panel" role="dialog" aria-modal="false" aria-label="Ajuda Oitava Parede" hidden>'+
 '<div class="op-help-header"><div class="op-help-avatar">8</div><div><strong>Ajuda Oitava</strong><small>Guia rápido da Central</small></div><button class="op-help-close" type="button" id="opHelpClose" aria-label="Fechar ajuda">×</button></div>'+
 '<div class="op-help-body" id="opHelpMessages" role="log" aria-live="polite"><div class="op-help-msg is-bot">Olá! Posso orientar você sobre editais, projetos, agenda e reuniões. Escolha um assunto ou escreva sua dúvida.</div></div>'+
 '<div class="op-help-chips" id="opHelpChips">'+
 ['Como encontro os editais recentes?','Como marco uma menção conferida?','Como cadastro um projeto?','Como salvo eventos e locais?'].map(x=>'<button type="button" data-help-question="'+escapeHTML(x)+'">'+escapeHTML(x)+'</button>').join('')+'</div>'+
 '<form id="opHelpForm" class="op-help-form"><input type="text" id="opHelpInput" maxlength="300" autocomplete="off" placeholder="Escreva sua dúvida..." aria-label="Sua dúvida sobre a central"/><button type="submit" aria-label="Enviar pergunta">➤</button></form>'+
 '<div class="op-help-disclaimer">Respostas guiadas sobre o site. Para perguntas abertas, abra o ChatGPT; nenhuma API de IA fica exposta nesta página.</div></section>';
 document.body.appendChild(wrapper);
 const panel=$('opHelpPanel'),launcher=$('opHelpLauncher');
 const toggle=open=>{panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));if(open)$('opHelpInput').focus();else launcher.focus();};
 launcher.addEventListener('click',()=>toggle(panel.hidden));
 $('opHelpClose').addEventListener('click',()=>toggle(false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)toggle(false);});
 $('opHelpChips').addEventListener('click',e=>{const b=e.target.closest('[data-help-question]');if(b)answer(b.dataset.helpQuestion);});
 $('opHelpForm').addEventListener('submit',e=>{e.preventDefault();const input=$('opHelpInput'),value=helpLabel(input.value);if(!value)return;input.value='';answer(value);});
}
function knowledge(question){
 const q=helpLabel(question).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/recent|novidad|ultim|data|ordena|filtro|pnab|edital/.test(q))return {text:'Abra **Radar diário**. Selecione PNAB, Lei Paulo Gustavo ou Diário Oficial, use o filtro de modalidade e escolha “Mais recentes — data do arquivo”. A data no nome do arquivo não é necessariamente a publicação oficial. Abra sempre o documento original.',anchor:'#monitor'};
 if(/menc|conferid|marc|check|giovanna|oitavafest|resultado/.test(q))return {text:'No Radar, abra **Fontes e possíveis menções**. Selecione “Pendentes”, leia o documento oficial e marque **Conferida**. O check fica salvo apenas neste navegador; não significa aprovação nem é compartilhado com os outros membros.',anchor:'#monitorMentions'};
 if(/projet|cadastr|inscri|proponente|protocolo|status/.test(q))return {text:'Na seção **Meus projetos**, escolha adicionar projeto, preencha título, proponente, edital e protocolo, se tiver, e salve. Os dados ficam neste navegador. Use Exportar para criar uma cópia de segurança.',anchor:'#projetos'};
 if(/agenda|evento|show|festival|cinema|ingresso|programa/.test(q))return {text:'Em **Agenda cultural**, filtre por cidade e tema, confira a data e selecione **Programação** para abrir a fonte. O coração salva o evento somente neste dispositivo. Novos eventos entram por curadoria, não por varredura automática.',anchor:'#agenda'};
 if(/reuni|cafe|bar|cerva|cerveja|encontro|mapa|convite|local/.test(q))return {text:'Na aba **Reuniões**, escolha a cidade e o estilo do encontro. Use **Ver no mapa** para localização ou **Copiar convite** para enviar ao grupo. Confirme horários e reservas diretamente com o estabelecimento.',anchor:'#reunioes'};
 if(/notific|email|alerta|mensagem/.test(q))return {text:'Use o sino **Novidades**, no cabeçalho, para consultar avisos e ir direto ao arquivo ou à menção. As bolhas na navegação mostram as novidades não lidas de cada área. Ao localizar ou abrir um arquivo novo, ele sai da faixa de novidades e continua no histórico do radar. O check de uma menção continua sendo uma conferência separada. As leituras ficam neste navegador.',anchor:'#monitor'};
 if(/foto|imagem|drive|instagram|logo|oitava/.test(q))return {text:'O logo vem dos materiais fornecidos pela Oitava Parede. As fotos da Agenda e dos locais possuem créditos e links de origem. Para incluir fotos de projetos da produtora, a pasta de arquivos precisa estar acessível e os materiais devem ser publicados no repositório.',anchor:'#acervo'};
 return {text:'Não encontrei uma resposta específica nos tópicos de funcionamento. Você pode copiar sua pergunta e conversar com uma IA no ChatGPT para explorar a dúvida, ou navegar pelas áreas principais da Central.',external:true};
}
function safeText(str){return escapeHTML(str).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');}
function answer(question){
 const messages=$('opHelpMessages');if(!messages)return;
 const human=document.createElement('div');human.className='op-help-msg is-user';human.textContent=question;messages.appendChild(human);
 const info=knowledge(question);const bot=document.createElement('div');bot.className='op-help-msg is-bot';
 bot.innerHTML=safeText(info.text)+(info.anchor?'<div><a href="'+info.anchor+'" class="op-help-go">Ir para a seção ↗</a></div>':'');
 messages.appendChild(bot);
 if(info.external){
  const action=document.createElement('button');action.type='button';action.className='op-help-ai';action.textContent='Copiar dúvida e abrir ChatGPT ↗';
  action.addEventListener('click',async()=>{try{await navigator.clipboard.writeText('Estou usando a Central de Pesquisa da Oitava Parede. Minha dúvida é: '+question)}catch{}window.open('https://chatgpt.com/','_blank','noopener,noreferrer')});
  bot.appendChild(action);
 }
 const link=bot.querySelector('.op-help-go');if(link)link.addEventListener('click',()=>{$('opHelpPanel').hidden=true;$('opHelpLauncher').setAttribute('aria-expanded','false');});
 messages.scrollTop=messages.scrollHeight;
}
function init(){initReview();buildHelp();}
const api={knowledge,onlyCleanId};
if(typeof module==='object'&&module.exports)module.exports=api;
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();}
root.renderMencoesRevisaveis=renderMentions;
root.OitavaReviews={locateMention(id){
 const clean=onlyCleanId(id);if(!mentions.some(m=>onlyCleanId(m.id)===clean))return null;
 locatedId=clean;filter='todas';renderMentions();return $('op-mention-'+clean);
}};
})(typeof window!=='undefined'?window:globalThis);
