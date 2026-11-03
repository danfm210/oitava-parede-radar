import unittest
from scripts.monitorar import filename_date
class TestOfficialDates(unittest.TestCase):
 def test_from_filename(self):
  self.assertEqual(filename_date("https://www2.praiagrande.sp.gov.br/files/documentos/20261024_005855_Resultados.pdf"),"2026-10-24")
 def test_missing_date(self):
  self.assertEqual(filename_date("https://plenussistemas.dioenet.com.br/list/praia-grande"),"")
 def test_bad_date(self):
  self.assertEqual(filename_date("https://www2.praiagrande.sp.gov.br/files/20261340_edital.pdf"),"")
if __name__=="__main__":unittest.main()
