import unittest
from scripts.projetos_oficiais import parse_page,extract_pdf,merge_rows
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
 def test_ano_extraido_e_do_edital_e_nao_da_data_de_publicacao(self):
  import fitz
  doc=fitz.open();p=doc.new_page();p.insert_text((50,50),'Chamamento Publico no 042/2024\nResultado de inscricoes publicado em 2026\nPROPONENTE GIOVANNA BARBOSA CPF/CNPJ OMITIDO\nCATEGORIA AUDIOVISUAL\nPROJETO FASHION FILM\nSTATUS ACEITO MOTIVO INSCRICAO VALIDA')
  b=doc.tobytes();doc.close()
  rows=extract_pdf(b,'https://www2.praiagrande.sp.gov.br/a.pdf','Publicacao de 2026','PNAB',load_terms(),'2026-11-03')
  self.assertEqual(len(rows),1);self.assertEqual(rows[0]['ano_edital'],2024)
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
