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

## Estrutura

```
.github/workflows/radar.yml    → verificação diária, gravação e publicação
docs/index.html               → site responsivo da Oitava Parede
docs/dados/radar.json          → saída publicada da varredura
scripts/monitorar.py          → leitor de páginas, links e PDFs
config/termos_publicos.txt    → nomes públicos procurados
requirements.txt              → dependências do monitor
```

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