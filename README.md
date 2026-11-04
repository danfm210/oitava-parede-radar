# Oitava Parede Films — Central de Editais 2.0

Website responsivo com logo oficial fornecido pelo coletivo, tentáculos azuis ornamentais e histórico local de projetos e **radar automatizável de fontes oficiais**. Construído para iniciar no plano gratuito do GitHub, sem servidor pago e sem rodar nada no computador após a implantação.

## O que realmente é automático

O fluxo `.github/workflows/radar.yml` faz uma consulta programada diariamente por volta das **08h37 de Brasília**. Lê três fontes prioritárias: **Diário Oficial de Praia Grande**, **PNAB Praia Grande** e **Lei Paulo Gustavo Praia Grande**. Lê documentos elegíveis (PDF e HTML) dentro de limites de tamanho, pesquisa nomes monitorados e atualiza `docs/dados/radar.json`. O site busca esse relatório automaticamente toda vez que é aberto ou recarregado. Eventos anteriores permanecem visíveis para consulta.

**Aprovação e reprovação NÃO são inferidas automaticamente.** Uma ocorrência só significa que um termo foi localizado e precisa de revisão no documento oficial. "Edital localizado" não significa "inscrições abertas". Alguns PDFs digitalizados, anexos em DOC/XLS, arquivos grandes, mudanças de layout e bloqueios podem impedir a leitura. A tela exibe o estado de cada fonte e a última verificação. O primeiro inventário recebe a marca `base_inicial` e não é apresentado como nova aprovação.

**Importante:** o arquivo HTML sozinho não executa varreduras. É preciso colocar os arquivos no GitHub e habilitar GitHub Actions e GitHub Pages. O monitor do ChatGPT existente é separado; não envia automaticamente dados para este website.

## Publicar gratuitamente no GitHub Pages

1. Faça login em https://github.com, crie um **novo repositório público** (ex.: `oitava-parede-radar`) com ramo principal chamado `main`. No plano GitHub Free, Pages exige repositório público.
2. Envie **o conteúdo desta pasta** (não uma pasta dentro do repositório), preservando a pasta oculta `.github/workflows/` e a pasta `docs/`. Pelo navegador, use **Add file → Upload files**, arraste as pastas quando possível e confirme que `.github/workflows/radar.yml` ficou no repositório. Se o navegador não aceitar a pasta oculta, crie o arquivo manualmente pelo editor do GitHub com o mesmo caminho e conteúdo.
3. Abra **Settings → Pages → Build and deployment → Source: GitHub Actions**. Salve.
4. Em **Actions**, abra o workflow **Oitava Parede - verificar fontes e publicar site**, escolha **Run workflow** para a primeira verificação. Aguarde o término da execução; veja logs de falhas por portal se houver.
5. O endereço será algo como `https://SEU-USUARIO.github.io/oitava-parede-radar/`. Substitua pelo nome real do repositório. Abra o site; o campo “Última execução” comprova se o radar está funcionando.
6. Para mudar termos de busca **não sensíveis**, edite `config/termos_publicos.txt`. Se precisar pesquisar protocolos sensíveis, utilize **Settings → Secrets and variables → Actions → New repository secret**, nome `OITAVA_TERMS`, valor com um termo por linha ou separados por ponto e vírgula. Não coloque dados pessoais no repositório, nem confirme/publicize protocolos sem avaliar privacidade.

O GitHub pode atrasar execuções agendadas e desabilitar workflows sem atividade em repositórios públicos após 60 dias. Revise a aba **Actions** periodicamente e use **Run workflow** para retomar, se necessário. O GitHub Pages gratuito não oferece controle de acesso: **o site e o JSON de resultados serão públicos**.

## Alertas automáticos por e-mail — configuração do administrador

O GitHub Actions já inclui o envio de e-mail **apenas para novos documentos oficiais** que mencionem Giovanna Barbosa (incluindo Arantes) ou o Projeto OitavaFest. Uma menção não confirma aprovação, seleção ou reprovação. O sistema evita reenviar IDs já avisados e não dispara alertas para o inventário inicial. Não envia mensagens enquanto os segredos abaixo não forem configurados.

**No GitHub:** abra [Settings → Secrets and variables → Actions](https://github.com/danfm210/oitava-parede-radar/settings/secrets/actions), selecione **New repository secret** e cadastre:

| Secret | Valor | Observação |
|---|---|---|
| `EMAIL_USER` | E-mail Gmail utilizado para **enviar** alertas | Conta remetente que a equipe controla |
| `EMAIL_APP_PASSWORD` | Senha de app gerada na conta Google remetente | Nunca use a senha normal ou publique no código |
| `EMAIL_RECIPIENTS` | `giovannabarbosa46@gmail.com` | Destinatária desejada; para adicionar membros, separe e-mails por vírgula |

Para gerar uma senha de app, na conta de envio Google ative a verificação em duas etapas e procure **Senhas de app** (a opção pode não estar disponível em todas as contas). A senha de app deve ser inserida **somente** em um secret; nunca compartilhe no chat.

**Teste manual:** em [Actions](https://github.com/danfm210/oitava-parede-radar/actions), abra **Radar Oitava Parede - monitoramento e publicacao → Run workflow**, marque **email_test = true** e execute. Isso envia um e-mail claramente marcado **[TESTE]** a todos os destinatários configurados, sem anunciar resultados. Depois disso, verificações com documentos prioritários novos enviam avisos automaticamente, sem reenvio.

O estado geral da conexão é mostrado na seção **Notificações** do site, sem publicar endereços de e-mail. Não existe cadastro público de usuários: como o GitHub Pages é um site estático, só o administrador adiciona ou retira destinatários por meio do secret `EMAIL_RECIPIENTS`. A conexão Gmail do ChatGPT **não fornece acesso SMTP** ao GitHub Actions.

## Estrutura

```
.github/workflows/radar.yml    → verificação diária, gravação e publicação
docs/index.html               → site responsivo da Oitava Parede
docs/dados/radar.json          → saída publicada da varredura
scripts/monitorar.py          → leitor de páginas, links e PDFs
scripts/enviar_alertas.py     → e-mail SMTP sob credenciais protegidas
config/alertas_enviados.json  → IDs já avisados (criado após envios)
docs/dados/email_status.json  → estado do envio sem divulgar destinatários
config/termos_publicos.txt    → nomes públicos procurados
requirements.txt              → dependências do monitor
```

## Agenda cultural e pontos de encontro (novo)

O site tem as abas **Agenda cultural** e **Reuniões**, com filtros por cidade, categoria e tipo de encontro, fotos externas com crédito quando disponíveis, links para as fontes e para o mapa, favoritos locais e botão para copiar convites.

- A agenda inicial foi pesquisada em **03/11/2026**, com eventos publicados para Santos, Praia Grande e São Paulo. Fontes individuais e portais de referência aparecem nos cartões.
- Eventos são **curados manualmente**, não há uma coleta automática de novos eventos nesta fase. O navegador oculta os que encerraram, conforme a data publicada. Para manter atualizada a programação após novembro, atualize `docs/dados/agenda.json` e `dados/agenda.json` simultaneamente (a ferramenta de criação online pode fazer isso por commit).
- As cidades **Santos, São Vicente e Praia Grande** têm sugestões de cafés, bares e coworkings para reuniões. Os estabelecimentos e horários devem ser confirmados antes do encontro.
- As fotos pertencem a seus respectivos proprietários e são referenciadas externamente com crédito e link de origem. Se alguma imagem externa não carregar, o site exibe uma ilustração de fallback; nenhuma imagem é reproduzida no repositório.
- Favoritos e preferências são salvos apenas no navegador do dispositivo; não são compartilhados entre os membros e não há cadastro público.
- Dados públicos e curadoria são informativos, não representam parceria com empresas, garantia de entrada ou reserva.

## Privacidade e colaboração

- Os **documentos oficiais localizados** ficam em uma página pública, assim como os links originais; nenhuma anotação privada é enviada ao JSON.
- Os **projetos cadastrados no formulário** ainda ficam no armazenamento local de **cada navegador**, sem sincronização entre membros. Exportar/importar funciona como no site anterior.
- Para edição compartilhada de projetos e acesso restrito, será necessário um banco autenticado (ex.: Supabase) e regras de acesso, e pode ser criada uma segunda etapa. **Não cadastre dados pessoais ou confidenciais acreditando que o Pages é privado.**
- Notificações do ChatGPT continuam na automação de quem a criou. Cada integrante pode ter sua própria tarefa, conforme os recursos disponíveis em sua conta.

## Teste local (opcional, desenvolvedores)

`pip install -r requirements.txt`

`python -m unittest discover -s tests -v`

`python scripts/monitorar.py` (acessa fontes oficiais pela internet)

`python -m http.server 8000 --directory docs` (abrir http://localhost:8000)

## Limites honestos do monitor

- Apenas **três fontes** iniciam a fase automática. Outros municípios e o Fomento CultSP continuam listados como links no site; requerem novos conectores e testes.
- Até 7 edições recentes do Diário Oficial e 85 anexos indexados por portal são descobertos por leitura; por rodada o sistema verifica a maioria dos links novos e os 4 iniciais dos já conhecidos, com até 12 anexos por fonte e limite de 18 MB por arquivo. Não é vigilância exaustiva de toda a história dos portais.
- O monitor não realiza OCR, não faz buscas em documentos escaneados sem texto e não garante prazos nem confirmação de decisões.
- A primeira execução inventaria documentos existentes e não os trata como novidades de publicação.

## Uso de nomes

Os termos públicos foram incluídos apenas para verificar **ocorrências em documentos oficiais**. O resultado publicado não reproduz conteúdo pessoal dos arquivos, não armazena números privados e não pode substituir a consulta ao documento original.
## Reformulação editorial — 03/11/2026

O layout foi repensado para uma experiência de revista cultural e pesquisa interna, tomando como referências o tratamento editorial de [Frans Hals Museum](https://www.awwwards.com/sites/franshals-museum), [The Beautiful Truth](https://thebeautifultruth.org) e [WePresent](https://wepresent.wetransfer.com). É um projeto visual original, não uma cópia.

- **Capa e narrativa:** tipografia maior, blocos editoriais, marca Oitava Parede original (já fornecida), tentáculos discretos, alto contraste e menu responsivo.
- **Marcas oficiais:** logos PNAB, Lei Paulo Gustavo e ProAC referenciados diretamente dos portais institucionais, com links de origem e fallback. O Diário Oficial mantém identificação tipográfica, pois não há marca individual confirmada.
- **Datas claras:** `data_no_arquivo` identifica somente data presente no nome do arquivo, quando disponível, sem atribuir falsamente data de publicação. `primeira_detecao` é a data em que o radar detectou o link; `ultima_leitura` indica a última leitura real do documento. `generated_at` informa a última execução do radar.
- **Filtros:** ordenar por data de referência, relevância editorial para audiovisual ou inclusão no radar; limitar a 7, 30 ou 90 dias; pesquisar e filtrar programa, tipo e modalidade.
- **Instagram:** o acesso automatizado às fotos do perfil [@oitavaparede](https://www.instagram.com/oitavaparede/) não estava disponível. O site utiliza o logotipo do coletivo e um link para o acervo oficial, sem inventar ou incorporar imagens de terceiros como se fossem da produtora.
- As funções anteriores (cadastro local de projetos, monitoramento de editais, agenda cultural e pontos de encontro) foram mantidas.

Arquivos principais: `docs/assets/editorial.css`, `docs/assets/editorial.js` (com cópias em `assets/` para a publicação pela raiz).


## Melhorias para os membros — fotos, revisão e ajuda (03/11/2026)

- **Agenda cultural e Reuniões:** fotografias externas identificadas, com créditos de sites dos estabelecimentos ou locais de evento. Onde o material disponível é apenas uma **foto do local**, isso é explicitado; não se atribui a imagem à edição atual do evento. Imagens externas podem deixar de funcionar e devem cair no layout ilustrativo. A lista curada está em `docs/dados/agenda.json`, com cópia em `dados/agenda.json`.
- **Marcas oficiais:** o logo original enviado pelos membros permanece centralizado em fundo azul-marinho no cabeçalho, capa e acervo.
- **Conferência individual:** o painel “Menções e conferência de documentos” tem guias Pendentes/Conferidas/Todas e checkbox de conferência, reversível. A marcação é persistida somente em `localStorage` no navegador corrente, **não compartilhada** entre os membros; não altera o resultado oficial e não deve ser interpretada como validação de aprovação.
- **Ajuda Oitava:** assistente de ajuda **guiado, sem IA generativa no GitHub Pages**. Responde a dúvidas comuns com orientações contextualizadas; questões abertas oferecem copiar a pergunta e abrir o ChatGPT, sem enviar chaves ou dados do navegador. Para incorporar uma IA generativa diretamente na página seria necessário um serviço de backend autenticado, com orçamento e proteção de credenciais.
- **Fotos da produtora:** a pasta do Google Drive enviada pelo usuário não estava acessível via conector na data da atualização. Até que o Google Drive seja conectado/autorizado, não foram baixados nem republicados arquivos privados na hospedagem pública. O acervo oficial continua com o link do Instagram.

## Navegação colapsável de publicações — 03/11/2026

A seção **Publicações por programa e tipo de edital** agora permite abrir ou recolher três níveis:

- **Programa:** PNAB, Lei Paulo Gustavo ou Diário Oficial, identificados por cores e marcas disponíveis.
- **Categoria / modalidade:** Audiovisual, Festivais, Cultura Viva, Formação, Pesquisa, Multilinguagens e assuntos gerais.
- **Tipo de publicação:** Resultados, Retificações, Editais e inscrições, Anexos, Edições oficiais e outros documentos. Dentro de categorias extensas, há também um botão "Mostrar outros documentos".

Os controles **Expandir tudo** / **Recolher tudo** ajudam a ver ou ocultar todos os grupos. Os filtros de data, tipo, modalidade e busca por nome ou número do edital continuam em funcionamento, expandindo automaticamente grupos correspondentes à busca. O sistema usa os elementos acessíveis `<details>` e `<summary>`, utilizáveis com teclado. Nenhuma publicação foi removida: mudou apenas a organização visual.

## Barra de navegação unificada — 03/11/2026

O cabeçalho mantém o logotipo original da Oitava Parede **centralizado no azul-marinho**, com menu organizado por tarefas para facilitar o acesso a todas as informações.

- Acesso direto a **Início**, **Projetos**, **Agenda cultural**, **Reuniões** e **Ajuda**.
- **Ordem da página:** Início → Editais → Inscrições e projetos → Fontes e fomento → Agenda cultural → Reuniões → A central. Cada grupo reúne apenas áreas consecutivas, sem fazer o destaque voltar a um menu anterior ao descer a página.
- **Subseções acessíveis:** Início reúne capa, últimas movimentações, programas e acervo; Editais reúne radar, menções e visão geral; Inscrições e projetos abre o catálogo e os cadastros locais; Fontes e fomento abre portais e oportunidades; A central reúne avisos e compartilhamento.
- Atalho **Ajuda** abre a janela contextual existente, sem expor chaves de IA.
- O item da seção atual fica destacado em amarelo conforme o usuário navega ou rola a página. O cabeçalho fixo calcula uma margem para não cobrir o título da seção.
- Em celulares, o menu abre verticalmente com grupos expansíveis; permite uso por toque, teclado, Escape e rótulos acessíveis.
- Arquivos: `docs/assets/navegacao.css`, `docs/assets/navegacao.js` e as cópias sob `assets/` para publicação pela raiz. Testes em `tests/test_navegacao.cjs`.

Esta atualização modifica apenas a navegação: o radar, a agenda, os projetos cadastrados localmente, as menções e as notificações mantêm as funcionalidades existentes.

## Refinamentos de experiência — 03/11/2026

- **Busca rápida de seções:** botão de lupa no cabeçalho ou atalho **Ctrl+K / Cmd+K**. Pesquisa local nomes, termos-chave e ações, inclusive Giovanna, OitavaFest, PNAB, projetos, eventos e reuniões. Não pesquisa o texto de todos os PDFs; a busca detalhada de editais permanece no radar.
- **Atalhos de ação:** permite ir diretamente ao campo de pesquisa do Radar, Projetos, Agenda ou Reuniões.
- **Rolagem em páginas longas:** botão de **voltar ao topo** após rolar e barra dourada de progresso de leitura.
- **Cabeçalho responsivo:** a área do logotipo se compacta discretamente durante a rolagem, preservando o alinhamento central e o fundo azul-marinho.
- **Acessibilidade:** janela de busca com Escape, Tab, setas e Enter; foco devolvido ao controle anterior; suporte a preferência por movimento reduzido.

A busca acontece inteiramente no navegador, sem enviar texto digitado a terceiros. Os recursos estão em `docs/assets/navegacao-extras.js` e `docs/assets/navegacao-extras.css`, com as versões correspondentes em `assets/`.

## Visita rara do sapinho

O sapinho ilustrado aparece em 3% das sessões elegíveis, cinco segundos após entrar, com intervalo mínimo de 14 dias neste navegador. Não aparece enquanto um formulário ou diálogo estiver em uso. O botão **Ouvir croac** sintetiza um som curto localmente, sem autoplay ou serviço externo; a caixa pode ser fechada e respeita a preferência por movimento reduzido. O teste `tests/test_sapinho.cjs` cobre probabilidade e intervalo, inclusive datas inválidas.

## Aviso de aprovação confirmada

`docs/dados/aprovacoes.json` (espelhado em `dados/aprovacoes.json`) é um cadastro editorial independente das possíveis menções do radar e dos projetos locais. Começa vazio: nenhum resultado é inferido ou simulado. Ao abrir o site, resultados positivos finais conferidos aparecem em um diálogo de destaque, com projeto, proponente, edital, etapa, data, explicação, trecho documental e link oficial. O aviso pode ser fechado; ele não repete na mesma sessão e permanece acessível pelo botão **Ver resultados confirmados** no Radar. Nova revisão volta a avisar. O preenchimento de um projeto local como “contemplado” não aciona este aviso público.

Para registrar uma decisão, confira o documento original, identidade, projeto, edital e fase. Publique o mesmo registro nos dois arquivos, preservando os demais. Campos obrigatórios:

- `id`: identificador estável (letras, números, hífen ou sublinhado); `revisao`: inteiro positivo, incrementado em cada alteração.
- `confirmado`: `true`; `conferencia`: `documental`.
- `projeto`, `proponente` (um dos nomes monitorados ou Oitava Parede), `programa`.
- `resultado`: `contemplado`, `selecionado` ou `aprovado`, conforme a decisão oficial; `etapa`: `resultado_final` ou `homologacao`. Não use habilitação, classificação em cadastro reserva ou seleção preliminar como aprovação final.
- `publicado_em` e `conferido_em`: datas reais `AAAA-MM-DD`, sem datas futuras; a conferência não pode anteceder a publicação.
- `explicacao`: como ocorreu a decisão e o que ela concede (incluindo ressalvas de contratação/repasse, quando constarem); `trecho_fonte`: trecho fiel e curto que sustenta a decisão, respeitando direitos autorais; `fonte_url`: URL HTTPS do documento oficial em domínio `.gov.br` ou no Diário Oficial `plenussistemas.dioenet.com.br`.

Em revogação, suspensão ou dúvida, incremente `revisao` e marque `confirmado: false` para retirar o aviso. Nunca mantenha uma aprovação superada como ativa. O processo de conferência documental é obrigatório; a busca por nomes e palavras como “aprovado” não substitui a leitura do resultado oficial. O monitoramento agendado do ChatGPT pode manter este cadastro após a conferência; a coleta simples do GitHub apenas identifica possíveis menções.

## Catálogo de projetos e inscrições

O catálogo **Projetos e inscrições** (`#catalogo-projetos`), acessível no menu **Inscrições e projetos**, reúne **Todos**, **Fontes oficiais** e **Neste navegador**, com busca por título/edital/protocolo e filtro por pessoa. O título oficial é copiado do campo PROJETO, com grafia e pontuação preservadas; o nome do edital ou do arquivo nunca substitui o título. Cada fonte mostra proponente como publicado, edital, etapa, situação no documento, página e link. Cadastros locais não são publicados nem promovidos automaticamente a registros oficiais, e suas alterações atualizam o catálogo no mesmo navegador.

O cadastro público é `docs/dados/projetos-oficiais.json`, espelhado em `dados/projetos-oficiais.json`. Os cinco títulos iniciais foram conferidos em 03/11/2026: OITAVAFEST (19/2026, p. 15), LIVRO "OITAVO AMOR" e ZEBOLA DANCE - VIDEOCLIPE (retificação 16/2026, pp. 65–66), CURSO PROFISSIONALIZANTE EM PÓS PRODUÇÃO (20/2026, p. 17) e FASHION FILM (42/2024, p. 17). As referências completas estão no JSON. Esses registros mostram inscrições e não certificam aprovação final, repasse, identidade de homônimos ou vigência após atos posteriores.

A coleta existente chama `scripts/projetos_oficiais.py` nos PDFs já lidos. O extrator aceita apenas ficha com um proponente por página, nome monitorado exato (normalizando acentos/caixa/espaços) e campos explícitos PROPONENTE, PROJETO e STATUS. Descarta páginas ambíguas e não copia CPF/CNPJ. PDFs escaneados, tabelas com várias inscrições na mesma página e outros formatos precisam de conferência documental antes de inclusão. O monitoramento do ChatGPT pode complementar o cadastro após essa conferência. Falha de coleta não apaga evidências já registradas. Evidências do mesmo projeto, pessoa e edital são agrupadas visualmente; os documentos e protocolos permanecem consultáveis.

Para inclusão manual, preserve os registros existentes e use: `id`, `titulo` exato, `proponente` conforme fonte, `programa`, `edital`, `etapa`, `situacao_na_fonte`, `protocolo` (vazio se não conferido), `conferencia: documental`, `verificado_em`, `fonte_titulo`, `fonte_url` oficial HTTPS e `pagina` começando em 1. Nunca adivinhe o título ou preencha protocolo de uma ficha vizinha. Os testes `test_projetos_oficiais.py` e `test_catalogo_projetos.cjs` verificam identificação de campos, nomes, separação de proponentes, busca e origem dos dados.

### Anos e histórico

O catálogo abre no ano atual de Brasília e agrupa pelo **ano do edital**, registrado em `ano_edital`, sem usar a data de publicação ou de conferência. O filtro permite consultar todos os anos, ciclos anteriores (Histórico), próximos ciclos e cadastros sem ano. Novos cadastros locais possuem o campo opcional Ano do edital, mantido ao editar, exportar e importar; registros sem informação não recebem um ano por suposição.

FASHION FILM pertence ao edital 042/2024 e está **aprovado e concluído**, conforme atualização fornecida pelo coletivo em 03/11/2026. Essa atualização fica em `acompanhamento` (`aprovacao: aprovado`, `execucao: concluido`, `origem: informado_pelo_coletivo`, `atualizado_em`). A interface identifica essa origem e mantém a situação do documento de inscrição, INSCRIÇÃO OK, dentro dos detalhes da fonte. A coleta deve preservar esse acompanhamento ao atualizar as evidências. O registro histórico não aciona um novo aviso público de aprovação; esse aviso continua dependendo da conferência de uma nova decisão final oficial.

## Circuito de cinema e pontos personalizados — 03/11/2026

A agenda traz destaques do 24º Curta Santos (abertura, bate-papo, fórum e videoclipes), com o serviço do Sesc e a programação completa. O circuito permanente reúne Curta Santos, Santos Film Fest, Curta Kinoforum, Mostra de São Paulo e Cine Curtinhas, com edição, datas e fonte. O estado Em breve / Em andamento / Edição encerrada acompanha a data de Brasília. Edições encerradas permanecem como referências; não são anunciadas como inscrições abertas. A repescagem da 50ª Mostra foi incluída de 30/10 a 04/11/2026 conforme o organizador.

A seção Reuniões passou a reunir 15 sugestões públicas, com seis novas opções: Rei do Café, Cafeteria do Museu do Café, Café Carioca, Parque Cultural Vila de São Vicente, Biblioteca Porto do Saber e Portinho. Endereços e informações têm links para as fontes oficiais ou dos estabelecimentos. As indicações de uso são sugestões editoriais; bibliotecas exigem respeito ao silêncio, e espaços culturais ou ao ar livre não são salas reservadas. Fotografias novas da Biblioteca e do Portinho vêm do portal de turismo de Praia Grande, com créditos; não são imagens genéricas atribuídas aos locais.

**Cadastrar ponto** permite criar, editar e excluir um endereço personalizado, com nome, cidade livre, tipo, referência, descrição, uso, link e observações. Os cadastros ficam exclusivamente no `localStorage` deste navegador (`oitava_locais_personalizados_v1`), sem publicação nem sincronização de equipe. Participam dos filtros, favoritos, mapa e convite. Cidades fora da lista inicial ganham um filtro automaticamente. Um ID `custom-` separa os cadastros das sugestões públicas; leitura e gravação validam campos, limites e links HTTP(S), impedem sobrescrever um ponto da curadoria e não afirmam salvamento quando o armazenamento falha. A janela usa diálogo nativo, foco e Escape. Dados públicos indisponíveis não bloqueiam seus pontos já salvos.

## Convites na agenda e refinamentos de uso — 03/11/2026

Cada evento em andamento ou futuro tem **Criar convite**. A janela mostra a programação de referência e permite escolher dia dentro do evento, horário do encontro, ponto de encontro e mensagem. A prévia identifica o horário como combinação do grupo, preserva o período publicado, a entrada anunciada e o link da fonte. Não adivinha a hora de uma sessão. **Copiar convite** funciona sem envio; **Compartilhar** aparece quando a Web Share API está disponível e só abre o compartilhamento após o clique do visitante. O convite não é publicado nem salvo em servidor. Uma cópia recusada tenta o mecanismo compatível e, se necessário, seleciona a prévia para cópia manual, sem afirmar sucesso.

A agenda ganhou **Quando** (toda a agenda, hoje, próximos sete dias e fim de semana), resumo dos filtros e botão para limpar uma seleção vazia. Os períodos usam o dia de Brasília, cruzam a duração do evento e respeitam `weekdays` quando informado (0 = domingo, 6 = sábado); a atividade Da Zona Sul para a Mesa tem esse campo conforme o serviço já cadastrado, que informa apenas fins de semana. O cadastro local, favoritos e convites de pontos de encontro foram preservados. Controles de toque têm altura mínima de 44 px; os cartões separam programação, favorito e convite, com nome do evento nos rótulos acessíveis. Agenda, Reuniões e circuito de cinema compensam o cabeçalho fixo e o scroll-padding global ao navegar por âncoras.

## Nomes completos de acompanhamento — 03/11/2026

Enzo Santana Borges e Julia Xavier de Freitas passam a ser os nomes principais no radar, filtros, busca rápida e sugestões de preenchimento. Enzo Borges e Julia Xavier continuam apenas como variações de busca. O cadastro Python de pessoas e aliases fica em `scripts/pessoas.py`; a coleta mantém seis nomes principais na lista de pessoas e usa as variantes para encontrar documentos antigos. Nomes, títulos e trechos copiados das fontes continuam com a grafia publicada. O filtro por pessoa e a pesquisa do catálogo reconhecem os nomes anteriores sem reescrever projetos locais. Uma possível correspondência ainda exige conferir identidade e vínculo; a atualização de nome não confirma aprovação.


## Direção visual e navegação por cenas — 03/11/2026

A atualização usa como referência os critérios públicos do Awwwards: Design 40%, Usabilidade 30%, Criatividade 20% e Conteúdo 10% ([avaliação oficial](https://www.awwwards.com/about-evaluation/)). Não representa nota, submissão ou certificação do Awwwards. A marca original centralizada no cabeçalho azul foi preservada.

A abertura cinematográfica reúne um painel de quatro tarefas — Radar, Projetos, Agenda e Encontros — com chamada direta para cada seção e contagens reais dos componentes correspondentes. Números de projetos, eventos e locais acompanham a seleção de filtros; ausência ou falha de carregamento aparece como travessão, sem inventar zero ou totais. A busca da abertura usa a busca rápida existente. O painel admite setas, Home e End, com seleção, foco e rótulos acessíveis. Não há rotação automática.

Tipografia, cores, espaçamento, cartões e estados de foco formam um sistema comum. Entradas discretas no campo de visão e luz reativa ao ponteiro usam recursos nativos, sem novas bibliotecas, vídeo, som automático ou cursor personalizado. A preferência por movimento reduzido desativa as animações. Os cartões permanecem visíveis mesmo sem IntersectionObserver. A seção de compartilhamento informa os limites reais do armazenamento local e copia apenas o endereço da central após o clique.

Os arquivos `assets/experiencia.js` e `assets/experiencia.css` são espelhados em `docs/assets/`. O script aguarda DOMContentLoaded também no estado interactive para iniciar após a capa editorial. Os testes `tests/test_experiencia.cjs` verificam essa ordem, contagens e navegação por teclado. Os fluxos de cadastro, histórico, fontes, convites e pontos personalizados permanecem nos componentes existentes.


### Navegação sequencial — 03/11/2026

Os links do cabeçalho seguem a mesma ordem física das seções. O destaque acompanha a rolagem nos dois sentidos, inclusive em Últimas movimentações, Programas e na seção final de compartilhamento. No fim da página, a última área pode ser reconhecida mesmo quando não tem altura suficiente para alcançar o cabeçalho. Os menus mantêm abertura por clique ou seta para baixo, fechamento por Escape e retorno de foco; não abrem automaticamente durante a rolagem. As âncoras compensam o cabeçalho fixo e o scroll-padding global sem duplicar o espaço acima da seção.


## Experiência mobile — 03/11/2026

Até 760 px, a Central tem atalhos inferiores para Radar, Projetos, Agenda, Encontros e Ajuda. O destaque acompanha a seção real, usando o mesmo evento do cabeçalho; não há um segundo detector de rolagem. O botão original de ajuda muda para a barra inferior e volta ao seu lugar no desktop, preservando as respostas, o estado, o fechamento por Escape e o foco. Busca e Menu têm rótulos visíveis, com o logo original centralizado. O aviso inicial recebe uma versão curta no celular.

Filtros secundários de Radar, catálogo, Agenda e locais ficam em painéis nativos expansíveis, com indicador de seleções ativas. Busca, contagem e resultados continuam visíveis. São os mesmos controles e listeners: a interface move os elementos e os restaura nas posições originais ao voltar para desktop, sem clonar campos, limpar filtros ou alterar armazenamento. Todos os filtros ficam disponíveis sem JavaScript adicional; os painéis são criados apenas após os componentes existentes.

A atualização melhora tamanho dos textos, áreas de toque, espaçamento dos cartões, formulários, convites e uso do teclado. A barra inferior reserva espaço no documento e respeita áreas seguras; fica oculta durante formulários modais e busca. Mensagens de confirmação ficam acima dela. A ajuda possui layout compacto para telas baixas. A navegação completa e a ordem das seções continuam no cabeçalho. Não há gestos obrigatórios, novos serviços, rastreamento ou bibliotecas. Os arquivos `mobile.css` e `mobile.js` em `assets/` são espelhados em `docs/assets/`.

## Painel pessoal, documentos salvos e calendário — 04/11/2026

**Meu painel** fica após a abertura, com acesso no cabeçalho, menu Início e busca rápida. Reúne Documentos, Eventos e Lugares em abas com teclado, busca quando há vários salvos e expansão da lista. Os documentos são guardados em `oitava_documentos_salvos_v1`, com URL oficial HTTPS, título e fonte; a leitura valida estrutura, domínio, credenciais, limites e duplicidades. Eventos e lugares usam os favoritos já existentes, incluindo pontos personalizados. As ações abrem o documento, criam o convite ou localizam o endereço original. Remover um favorito no painel atualiza o coração na seção correspondente. Os dados permanecem pessoais deste navegador, sem sincronização de equipe nem envio a servidor.

A situação do radar vem do mesmo relatório já carregado pela página, sem outra consulta: fontes, horário de Brasília e distinção entre recente (até 48 h), antigo, parcial, data inválida/futura e falha de carregamento. O próximo programa usa a curadoria existente, respeitando datas e dias de atividade; não indica inscrições abertas ou confirmação de sessão. A comunicação entre componentes usa eventos locais e dados já disponíveis. Falhas de armazenamento não são apresentadas como salvamento concluído.

O convite cultural oferece **Adicionar ao meu calendário**, que prepara um arquivo `.ics` local a partir do dia, hora, local e mensagem escolhidos. Validação de período, dias de atividade e formulário é a mesma do convite. Com horário, usa o instante correspondente a America/Sao_Paulo e não inventa duração; sem horário, é um lembrete de dia inteiro. Inclui fonte, instruções e texto revisável, sem ATTENDEE, envio, inscrição ou alteração de agenda externa. A geração segue o [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html), com CRLF, escape de texto e dobramento de linhas em até 75 bytes sem dividir caracteres UTF-8. Os testes verificam data inválida, virada de mês/ano, horário de Brasília, injeção de propriedades e Unicode.

As seções de programas e acervo são expansíveis, preservando conteúdo e acesso direto pelas âncoras. A navegação mantém a ordem das seções, incluindo Meu painel. A posição de uma âncora inicial acompanha o carregamento de conteúdo e fontes até a primeira interação do visitante, para evitar saltos para uma área errada após atualizar um link direto. Não interfere na rolagem iniciada pelo usuário.

O logo foi extraído sem alteração de pixels: `assets/oitava-logo-original.png` e o espelho em `docs/assets/` têm SHA-256 `79a981a9c2e3729c64404f24b8646d1050847ab9bc5ab886d00290b94e69a868`. Antes havia duas cópias base64 idênticas no HTML (416.068 bytes). O HTML passou a aproximadamente 95 KB, e a imagem original de 121.302 bytes é carregada uma vez e reutilizada pelo navegador. As mesmas fontes tipográficas passaram de @import para links no cabeçalho, com display=swap e preconexão; não foram acrescentados serviços de fontes. Metadados de compartilhamento usam a marca original. Isso é redução de transferência e duplicação, não uma pontuação de Lighthouse ou certificação de desempenho.

As etiquetas do radar usam somente o ano explicitado no título do edital, sem acrescentar 2026 a documentos históricos. Os nomes de projeto, documentos e fontes permanecem preservados. Os testes novos são `test_central.cjs` e `test_calendario.cjs`; a rotina de publicação executa ambos com as verificações existentes.

Validação desta revisão: 82 testes JavaScript e 23 testes Python passaram. A conferência no navegador cobriu salvar e recarregar documentos, abas com teclado, busca e expansão de salvos, favoritos de evento/local e remoção sincronizada, navegação de acesso direto após recarga, seções expansíveis e larguras de 320, 375, 768 px e desktop, sem rolagem horizontal nas telas verificadas. A janela de convite validou data fora do período e horário corrigido no celular. Os registros criados para teste foram removidos. A geração do calendário foi validada pelos testes e pelo estado da interface; o navegador de teste não disponibilizou o evento de download, e a importação em um calendário externo não foi realizada.


## Tentáculos e navegação compacta — 04/11/2026

A direção visual reaproveita o desenho vetorial dos tentáculos da Central em azul, com marcas de película, claquete e rolo de filme. Os grafismos ficam em áreas próprias da abertura, cabeçalhos, bordas e rodapé; são decorativos, não recebem foco nem cliques e não cobrem os cartões de conteúdo. A marca original no azul marinho foi preservada. O SVG dos tentáculos substitui duas cópias codificadas no HTML e é reutilizado como asset local, sem nova biblioteca ou animação automática.

Resumo do acompanhamento, fontes, fomento, avisos, conferência de menções, circuito de festivais e portais da agenda usam menus nativos expansíveis. Os nós, IDs, formulários e ações são preservados. O menu superior, links internos e busca rápida abrem a seção de destino antes de mover foco e rolagem. Fechar pelo botão ao fim devolve o foco ao resumo e traz esse controle para a área visível. Sem JavaScript adicional, o conteúdo original continua disponível.

Agenda, lugares e cada ano do catálogo mostram uma prévia de três cartões. Ver mais conserva os demais registros, com total explícito; Recolher reduz novamente a lista. Pesquisas textuais abrem os resultados adicionais automaticamente. Favoritar um evento/local preserva o estado da lista e o foco no botão. Os programas do radar começam recolhidos, com abertura ao escolher a fonte ou pesquisar; a primeira categoria agora recebe um booleano em vez do índice numérico, evitando abrir todas as categorias seguintes por engano. Nenhum projeto, fonte ou evento foi removido.

As verificações adicionais de preservação dos registros, ações e abertura de ancestrais estão em test_direcao_visual.cjs, também incluído na rotina do GitHub.

Na conferência em desktop de 1.348 px, a altura inicial passou de 22.655 px para cerca de 10,3 mil px (aproximadamente 55% menor), com fontes e dados carregados e menus adicionais fechados. A medida descreve a prévia inicial, não a altura após abrir todos os conteúdos. A revisão também corrigiu o rótulo Menu/Fechar depois de seguir um link no celular, inclusive quando o listener original já removeu a classe de abertura.

Validação: 86 testes JavaScript e 23 testes Python passaram. No navegador foram conferidos expansão/recolhimento com teclado e retorno de foco, busca rápida abrindo seções, acesso direto a menções após recarga, seleção e busca do radar, circuito de cinco festivais, convite a partir de evento adicional, catálogo completo e pesquisa por Julia Xavier, favoritos de evento/local nas listas adicionais e remoção sincronizada. Os dados usados nos testes foram removidos. Larguras de 320, 375, 768 px e desktop foram verificadas sem rolagem horizontal; em 320 px os títulos dos menus têm mais espaço.


## Ilustrações maiores e acabamento editorial — 04/11/2026

A abertura ganhou uma ilustração própria de tentáculos azuis, rolo e película de cinema, exibida em até 570 px no desktop e na largura disponível no celular. Os atalhos Radar/Projetos/Agenda/Encontros passaram para uma faixa compacta logo abaixo, preservando os mesmos nós, eventos, links, navegação por teclado e contagens reais. A Agenda tem uma segunda arte de rolo e claquete; Reuniões usa a composição dos tentáculos. No celular, os cabeçalhos ficam em coluna para separar arte e leitura. Os menus expansíveis e as prévias de três cartões continuam ativos.

As duas ilustrações foram criadas com a ferramenta integrada de geração de imagens, com transparência, estilo de guache e gravura em azul-marinho, cobalto e dourado. A marca original não foi redesenhada. Os arquivos de entrega são `assets/tentaculos-cinema-editorial.webp` (1.312 × 1.199, 522.874 bytes) e `assets/cinema-editorial.webp` (1.536 × 1.024, 531.176 bytes), espelhados em `docs/assets/`. A conversão para WebP mantém as dimensões e o canal alfa original, conferido byte a byte. A arte da abertura usa preload, dimensões explícitas e prioridade alta; as imagens das seções usam carregamento sob demanda.

Os 86 testes JavaScript passaram. A conferência no navegador validou a ilustração carregada, dimensões, alternância dos quatro atalhos e contagens, teclado e adaptação em 320, 375, 768 px e desktop. Em 320 px, textos e artes dos cabeçalhos têm a largura da coluna e não se sobrepõem; não houve rolagem horizontal nas larguras verificadas.

<details><summary>Prompts finais das ilustrações — geração integrada</summary>

### Arte 1

Use case: illustration-story. Asset type: large transparent website hero illustration. Sophisticated editorial illustration for the Brazilian audiovisual collective Oitava Parede. Hand-painted gouache with very fine engraved crosshatching, sculptural volume, beautiful restrained texture, crisp print-quality edges. Rich cobalt blue and midnight navy (#204d9f, #10275d), with small warm antique gold accents (#c39a42), natural cream highlights. Premium art-book illustration, visually striking and elegant, not flat vector icons, not childish cartoon, not plastic 3D. Subject: three or four elegant BLUE OCTOPUS TENTACLES with beautifully detailed suction cups, curling gracefully around a large vintage 35mm FILM REEL and a flowing strip of cinema film. No octopus face or head. The tentacles are the main visual subject, strong flowing blue silhouettes, layered organic curves; the reel is an authentic open-spoke metal cinema reel with realistic recognizable geometry, film strip has clear sprocket holes and frames. Composition: one unified sculptural still-life, a compact balanced mass, rising curls toward the top and wrapping around the reel; generous transparent margin around all edges, entire artwork fully visible, suitable for a large 500px-wide illustration beside website text. Actual transparent background, isolated cutout with no colored rectangle, no paper background, no floor, no cast shadow outside artwork. No text, no letters, no numbers, no logo, no watermark, no UI, no border.

### Arte 2

Use case: illustration-story. Asset type: large transparent editorial website illustration for a cultural agenda. Sophisticated editorial illustration for the Brazilian audiovisual collective Oitava Parede. Hand-painted gouache with very fine engraved crosshatching, sculptural volume, beautiful restrained texture, crisp print-quality edges. Rich cobalt blue and midnight navy (#204d9f, #10275d), with small warm antique gold accents (#c39a42), natural cream highlights. Premium art-book illustration, visually striking and elegant, not flat vector icons, not childish cartoon, not plastic 3D. Subject: a carefully composed cinematic still-life of a beautiful vintage 35mm metal FILM REEL, a CLOSED CLAPPERBOARD without any writing, and an elegant curved strip of 35mm film with visible sprocket holes and frames. Main shapes in rich blue, cream accents, a few antique gold details. Beautiful detailed cinema equipment illustration with subtle engraved shading, balanced clean composition and striking silhouette. One cohesive compact arrangement, not a sheet of separate icons. No tentacles in this second image. Entire artwork fully visible with generous transparent margin, suitable for a 350px-wide illustration in a website section header. Actual transparent background, isolated cutout, no background rectangle, no floor, no broad drop shadow. No text, no letters, no numbers, no logos, no watermark, no UI, no frame.

</details>

## Prévias nos menus fechados e marca na ilustração — 04/11/2026

Os resumos dos menus agora mostram uma amostra do conteúdo real: títulos dos documentos, projetos adicionais, eventos, pontos de encontro, nomes dos portais, fontes de inscrição e respostas das perguntas frequentes. Cada prévia ocupa até duas linhas de itens; o conteúdo integral permanece no menu. Ao abrir, a amostra é ocultada para evitar repetição. Os títulos originais e o comportamento nativo de teclado são preservados, sem incluir botões ou links dentro da prévia.

O módulo `assets/previas.js`, espelhado em `docs/assets/`, acompanha o carregamento e a atualização dos registros, buscas e filtros. A seleção dos filtros móveis fica visível quando o menu está fechado. A amostra não faz novas requisições, não muda os dados e não interpreta menções como aprovações. A grade do radar permite encolher os cartões para que títulos extensos não ampliem a página no celular.

A abertura usa `assets/tentaculos-cinema-marca.webp`, com o 8 dourado e a escrita Oitava Parede integrados à ilustração escolhida pelo usuário. A edição foi feita pela geração integrada a partir da imagem selecionada e do logotipo original como referência. A versão anterior e o logotipo do cabeçalho foram preservados. O novo WebP tem 1.312 × 1.199 px e 336.542 bytes; o canal alfa é idêntico ao PNG gerado.

<details><summary>Prompt final da arte com a marca — geração integrada</summary>

Use case: compositing. Asset type: transparent branded editorial illustration for the Oitava Parede audiovisual website. Image 1 is the EXACT EDIT TARGET: the blue engraved/gouache octopus tentacles, antique gold cinema reel, and film strip. Preserve its subject, detailed hand-painted texture, rich cobalt/navy/gold palette, overall framing, and all the recognizable tentacle curls and film reel. Image 2 is the ORIGINAL BRAND INSERT REFERENCE, not an illustration to redraw: a distinctive brush-painted GOLD numeral 8 with an angled upper loop, and the cream vintage display-serif wordmark reading exactly 'Oitava Parede'. Primary request: add that recognizable original 8 emblem AND the original 'Oitava Parede' lettering to image 1 in an elegant, legible, intentional composition. Use the unused upper-left space for a compact dark navy painted emblem/plaque carrying the gold 8 above the cream wordmark, tastefully nestled among the tentacle curves. Match the texture and visual quality of the artwork; keep all lettering fully visible and unobstructed, large enough to read when the full illustration is shown at 570 pixels wide. Faithfully match the reference 8 silhouette and distinctive rounded decorative serif letter shapes, including its capital O and P. Text verbatim: 'Oitava Parede'. Add no other words, slogans, numbers, borders, watermarks, or new objects. Do not substitute a plain typeset 8 or infinity sign. Keep a true transparent background outside the artwork and the navy emblem. No navy rectangular full-image background. Preserve transparency and leave a little clear margin around the entire finished artwork.

</details>

Validação: 86 testes JavaScript passaram. No navegador foram conferidos expansão pelo teclado, ocultação da amostra ao abrir, atualização dos nomes e contagens depois de filtrar as fontes e resumo dos filtros móveis. A arte carregou na abertura. As larguras de 320, 375 e 768 px foram verificadas sem rolagem lateral após o ajuste da grade.


## Localização dos arquivos novos no radar — 04/11/2026

Arquivos detectados nas últimas 48 horas, fora da carga inicial, recebem a tag “Novo no radar”, fundo e borda verdes. A mesma contagem aparece nos cartões dos programas e nos títulos fechados de programa, modalidade e tipo. Uma faixa no início do radar mostra até dois títulos recentes, com o caminho de cada arquivo e a ação “Localizar”. O atalho limpa os filtros que poderiam esconder o documento, abre todos os menus do caminho (inclusive “Mostrar outros”), destaca o cartão e leva o foco e a rolagem até ele.

“Ver só os novos” mostra todas as novidades, ordenadas pela detecção, com os menus já abertos. “Mostrar todos os arquivos” e “Limpar filtros” restauram a consulta completa. O destaque usa `primeira_detecao` com hora e `base_inicial === false`: uma publicação antiga localizada agora pode ser nova no radar; data recente no nome do arquivo ou nova leitura não cria uma novidade. Sem registros nesse intervalo, a faixa é ocultada.

Os três testes adicionais cobrem o limite de 48 horas, datas futuras ou inválidas, exclusão da carga inicial, distinção entre publicação e detecção, ordenação e documentos duplicados. Todos os 89 testes JavaScript passaram.

A conferência no navegador validou a filtragem dos dois arquivos novos reais, contagens nos programas, navegação até o documento com busca sem resultados e foco no cartão. Um cenário temporário com arquivo novo fora dos três primeiros registros confirmou a abertura dos quatro níveis, inclusive “Mostrar outros”. As prévias fechadas priorizam títulos novos quando houver novidades. A revisão final também conferiu 320, 375 e 768 px sem rolagem lateral. Nenhum registro de teste foi publicado.
