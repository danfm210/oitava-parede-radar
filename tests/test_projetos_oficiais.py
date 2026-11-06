import unittest
from scripts.projetos_oficiais import parse_page,parse_page_rows,extract_pdf,merge_rows
from scripts.monitorar import MONITORED_PEOPLE,load_terms

class OfficialProjectTests(unittest.TestCase):
 def test_titulos_de_fichas_publicadas_e_nao_dos_documentos(self):
  # Trechos dos campos públicos auditados em 03/11/2026; CPF não é copiado.
  titles=['OITAVAFEST','LIVRO "OITAVO AMOR"','ZEBOLA DANCE - VIDEOCLIPE','CURSO PROFISSIONALIZANTE EM PÓS PRODUÇÃO']
  for title in titles:
   page='PROPONENTE\nGIOVANNA BARBOSA\nCPF/CNPJ\nDADO OMITIDO\nCATEGORIA\nAUDIOVISUAL\nPROJETO\n'+title+'\nSTATUS\nACEITO\nMOTIVO\nINSCRIÇÃO VÁLIDA\nPROTOCOLO\nQA2026001'
   row=parse_page(page,load_terms());self.assertEqual(row['titulo'],title);self.assertEqual(row['protocolo'],'QA2026001')
   self.assertNotIn('CPF',str(row));self.assertEqual(row['situacao_na_fonte'],'ACEITO')
 def test_projeto_multilinha_e_nome_exato_de_pessoa(self):
  page='PROPONENTE JULIA XAVIER CPF/CNPJ OMITIDO CATEGORIA ARTE PROJETO Meu projeto\ncom subtítulo STATUS INDEFERIDO MOTIVO Conferir original PROTOCOLO QA2026002'
  self.assertEqual(parse_page(page,MONITORED_PEOPLE)['titulo'],'Meu projeto com subtítulo')
  self.assertIsNone(parse_page(page.replace('JULIA XAVIER','JULIANA XAVIER'),MONITORED_PEOPLE))
 def test_nao_inferir_de_mencao_nem_misturar_duas_pessoas(self):
  self.assertIsNone(parse_page('Giovanna Barbosa consta no Resultado Inscricoes Edital 19 - 2026',load_terms()))
  self.assertIsNone(parse_page('PROPONENTE Giovanna Barbosa PROJETO A STATUS ACEITO MOTIVO X PROPONENTE Julia Xavier PROJETO B STATUS ACEITO MOTIVO X',load_terms()))
 def test_varias_fichas_na_pagina_preservam_status_e_motivo_de_cada_uma(self):
  page=('PROPONENTE GIOVANNA BARBOSA CPF/CNPJ* OMITIDO CATEGORIA AUDIOVISUAL '
        'PROJETO OITAVAFEST STATUS ACEITO MOTIVO INSCRIÇÃO VÁLIDA PROTOCOLO 20264677AF5EB3B '
        'PROPONENTE JULIA XAVIER DE FREITAS CPF/CNPJ* OMITIDO CATEGORIA AUDIOVISUAL '
        'PROJETO ELE - UM VIDEOCLIPE ALIADOS STATUS INSCRIÇÃO INVÁLIDA MOTIVO '
        'PROTOCOLO 20261AFF24C9E82 DOCUMENTAÇÃO NÃO APRESENTADA DENTRO DO PRAZO')
  rows=parse_page_rows(page,MONITORED_PEOPLE)
  self.assertEqual([row['titulo'] for row in rows],['OITAVAFEST','ELE - UM VIDEOCLIPE ALIADOS'])
  self.assertEqual(rows[0]['motivo'],'INSCRIÇÃO VÁLIDA')
  self.assertEqual(rows[1]['situacao_na_fonte'],'INSCRIÇÃO INVÁLIDA')
  self.assertEqual(rows[1]['motivo'],'DOCUMENTAÇÃO NÃO APRESENTADA DENTRO DO PRAZO')
 def test_pdf_sem_rotulos_e_fontes_nao_oficiais_nao_produzem_projetos(self):
  import fitz
  doc=fitz.open();p=doc.new_page();p.insert_text((50,50),'Chamamento Público n° 019/2026\nResultado de inscrições\nGiovanna Barbosa')
  b=doc.tobytes();doc.close()
  self.assertEqual(extract_pdf(b,'https://www2.praiagrande.sp.gov.br/a.pdf','Nome de edital','PNAB',load_terms(),'2026-11-03'),[])
  self.assertEqual(extract_pdf(b,'https://example.com/a.pdf','Nome de edital','PNAB',load_terms(),'2026-11-03'),[])
 def test_mesma_ficha_atualiza_sem_apagar_outras_fontes(self):
  old={'fonte_url':'https://www.gov.br/a.pdf','pagina':1,'titulo':'Antes'}
  new={**old,'titulo':'Depois'}
  self.assertEqual(merge_rows([old],[new]),[new])
 def test_protocolos_distintos_na_mesma_pagina_nao_se_sobrescrevem(self):
  first={'fonte_url':'https://www.gov.br/a.pdf','pagina':6,'titulo':'A','proponente':'Julia Xavier','protocolo':'PROTOCOLO1'}
  second={**first,'titulo':'B','protocolo':'PROTOCOLO2'}
  updated={**second,'situacao_na_fonte':'INSCRIÇÃO INVÁLIDA'}
  rows=merge_rows([first,second],[updated])
  self.assertEqual(len(rows),2);self.assertEqual(rows[0]['titulo'],'A')
  self.assertEqual(rows[1]['situacao_na_fonte'],'INSCRIÇÃO INVÁLIDA')
 def test_ano_extraido_e_do_edital_e_nao_da_data_de_publicacao(self):
  import fitz
  doc=fitz.open();p=doc.new_page();p.insert_text((50,50),'Chamamento Publico no 042/2024\nResultado de inscricoes publicado em 2026\nPROPONENTE GIOVANNA BARBOSA CPF/CNPJ OMITIDO\nCATEGORIA AUDIOVISUAL\nPROJETO FASHION FILM\nSTATUS ACEITO MOTIVO INSCRICAO VALIDA')
  b=doc.tobytes();doc.close()
  rows=extract_pdf(b,'https://www2.praiagrande.sp.gov.br/a.pdf','Publicacao de 2026','PNAB',load_terms(),'2026-11-03')
  self.assertEqual(len(rows),1);self.assertEqual(rows[0]['ano_edital'],2024)
 def test_resultado_recursal_com_varias_fichas_vira_etapa_atual(self):
  import fitz
  text=('Chamamento Publico no 016/2026\nResultado de inscricoes\n'
        'PROPONENTE GIOVANNA BARBOSA CPF/CNPJ* OMITIDO\nCATEGORIA AUDIOVISUAL\n'
        'PROJETO OITAVAFEST\nSTATUS ACEITO - RECURSO\nMOTIVO\nPROTOCOLO 20264677AF5EB3B\nDOCUMENTOS OK\n'
        'PROPONENTE JULIA XAVIER DE FREITAS CPF/CNPJ* OMITIDO\nCATEGORIA AUDIOVISUAL\n'
        'PROJETO ELE - UM VIDEOCLIPE ALIADOS\nSTATUS INSCRIÇÃO INVÁLIDA\nMOTIVO\n'
        'PROTOCOLO 20261AFF24C9E82\nDOCUMENTAÇÃO NÃO APRESENTADA DENTRO DO PRAZO')
  doc=fitz.open();page=doc.new_page();page.insert_text((50,50),text,fontsize=8)
  data=doc.tobytes();doc.close()
  rows=extract_pdf(data,'https://www2.praiagrande.sp.gov.br/recurso.pdf','Resultado Recursos Edital-16 - 2026','PNAB Praia Grande',MONITORED_PEOPLE,'2026-11-06')
  self.assertEqual(len(rows),2)
  julia=next(row for row in rows if row['proponente']=='JULIA XAVIER DE FREITAS')
  self.assertEqual(julia['etapa'],'Resultado da etapa recursal')
  self.assertEqual(julia['motivo'],'DOCUMENTAÇÃO NÃO APRESENTADA DENTRO DO PRAZO')
 def test_atualizacao_da_fonte_preserva_conclusao_informada_pelo_coletivo(self):
  progress={'aprovacao':'aprovado','execucao':'concluido','origem':'informado_pelo_coletivo'}
  old={'fonte_url':'https://www.gov.br/a.pdf','pagina':17,'titulo':'FASHION FILM','ano_edital':2024,'acompanhamento':progress}
  incoming={'fonte_url':old['fonte_url'],'pagina':17,'titulo':'FASHION FILM','situacao_na_fonte':'INSCRIÇÃO OK','verificado_em':'2026-11-04'}
  merged=merge_rows([old],[incoming])[0]
  self.assertEqual(merged['acompanhamento'],progress);self.assertEqual(merged['ano_edital'],2024)
  self.assertEqual(merged['situacao_na_fonte'],'INSCRIÇÃO OK')

 def test_nomes_atualizados_aceitam_alias_exato_sem_mudar_o_texto_da_fonte(self):
  for name in ['JULIA XAVIER DE FREITAS','JULIA XAVIER','ENZO SANTANA BORGES','ENZO BORGES']:
   page='PROPONENTE '+name+' CPF/CNPJ OMITIDO CATEGORIA ARTE PROJETO Nome conforme fonte STATUS ACEITO MOTIVO INSCRICAO VALIDA'
   self.assertEqual(parse_page(page,MONITORED_PEOPLE)['proponente'],name)
   self.assertIsNone(parse_page(page.replace(name,name+' JUNIOR'),MONITORED_PEOPLE))

if __name__=='__main__':unittest.main()
