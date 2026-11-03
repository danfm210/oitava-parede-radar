import unittest
from scripts.monitorar import valid,clean,normal,kind,discover
from bs4 import BeautifulSoup
class TestRadar(unittest.TestCase):
 def test_url(self):
  self.assertTrue(valid("https://www2.praiagrande.sp.gov.br/secretarias/cultura-turismo/lei-aldir-blanc"))
  self.assertFalse(valid("https://example.com/test.pdf"))
 def test_text(self):
  self.assertEqual(clean(" a  b "),"a b")
  self.assertEqual(normal("Oitáva"),"oitava")
 def test_kind(self): self.assertEqual(kind("Resultado de seleção"),"resultado")
 def test_discover(self):
  src={"id":"pnab_pg","url":"https://www2.praiagrande.sp.gov.br/secretarias/cultura-turismo/lei-aldir-blanc","mode":"portal"}
  soup=BeautifulSoup('<p>Resultado de inscrição e classificação</p><a href="/arquivo.pdf">PDF</a>',"html.parser")
  self.assertEqual(len(discover(src,soup)),1)
if __name__=="__main__": unittest.main()
