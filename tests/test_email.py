import unittest
from scripts.enviar_alertas import eligible, addresses, build_email

class EmailAlertsTests(unittest.TestCase):
 def test_address(self):
  self.assertEqual(addresses("a@example.com;a@example.com, b@example.com"),["a@example.com","b@example.com"])
  with self.assertRaises(ValueError):addresses("invalid_email")
 def test_only_new_high_priority_document_mentions(self):
  valid={"id":"abc123","publicacao_id":"document","prioridade":"maxima","url":"https://www2.praiagrande.sp.gov.br/docs/edital.pdf","base_inicial":False}
  self.assertTrue(eligible(valid))
  self.assertFalse(eligible({**valid,"base_inicial":True}))
  self.assertFalse(eligible({**valid,"prioridade":"normal"}))
  self.assertFalse(eligible({**valid,"publicacao_id":""}))
  self.assertFalse(eligible({**valid,"url":"https://site-inseguro.example/arquivo.pdf"}))
 def test_test_email_does_not_announce_approval(self):
  import os
  old=os.environ.get("EMAIL_USER")
  os.environ["EMAIL_USER"]="sender@example.com"
  try:
   message=build_email("membro@example.com",[],True)
   self.assertIn("[TESTE]",message["Subject"])
   self.assertIn("NAO indica resultado de edital",message.get_content())
  finally:
   if old is None:os.environ.pop("EMAIL_USER",None)
   else:os.environ["EMAIL_USER"]=old

if __name__=="__main__":unittest.main()
