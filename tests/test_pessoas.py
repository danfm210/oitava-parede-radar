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


class NomesAtualizadosTests(unittest.TestCase):
 def test_formas_anteriores_mantem_busca_mas_recebem_nome_completo_sem_duplicar(self):
  for canonical,alias in [('Julia Xavier de Freitas','Julia Xavier'),('Enzo Santana Borges','Enzo Borges')]:
   matches=matching_terms(canonical.upper().replace(' ','\n'),load_terms())
   self.assertIn(canonical,matches);self.assertIn(alias,matching_terms(alias.upper().replace(' ','\n'),load_terms()))
   for hits in [matches,[alias],[canonical,alias]]:
    level,note=priority_for(hits)
    self.assertEqual(level,'alta');self.assertEqual(note.count(canonical),1)
  self.assertEqual(matching_terms('Julia e Enzo',load_terms()),[])

if __name__=='__main__':unittest.main()
