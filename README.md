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
