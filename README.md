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
