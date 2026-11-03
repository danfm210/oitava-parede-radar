import unittest
from scripts.monitorar import load_terms,matching_terms,priority_for,MONITORED_PEOPLE

class PessoasMonitoradasTests(unittest.TestCase):
 def test_nomes_completos_preservam_giovanna_e_coletivo(self):
  terms=load_terms()
  for name in MONITORED_PEOPLE:
   self.assertIn(name,terms)
  self.assertIn('Giovanna Barbosa',terms)
  self.assertIn('OitavaFest',terms)
 def test_nomes_em_caixa_alta_acentos_e_quebras(self):
  for name in MONITORED_PEOPLE:
   content='Resultado: '+name.upper().replace(' ','\n')
   self.assertIn(name,matching_terms(content,load_terms()))
  self.assertIn('Oscar Stefanno Fornari',matching_terms('Óscar Stefanno Fornari',load_terms()))
 def test_todos_recebem_prioridade_e_identificacao_correta(self):
  for name in MONITORED_PEOPLE:
   level,note=priority_for([name])
   self.assertEqual(level,'alta')
   self.assertIn(name,note)
   self.assertEqual(priority_for([name,'OitavaFest'])[0],'maxima')
  self.assertEqual(priority_for(['Oitava Parede'])[0],'normal')
 def test_nao_criar_alias_curto_generico(self):
  self.assertEqual(matching_terms('Daniel Fernandes e Matheus de Castro',load_terms()),[])

if __name__=='__main__':unittest.main()
