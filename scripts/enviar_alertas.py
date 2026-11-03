#!/usr/bin/env python3
"""Alertas SMTP por e-mail para publicações oficiais novas. Sem credenciais no repositório."""
from __future__ import annotations
import datetime as dt
import json
import os
import re
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RADAR=ROOT/"docs/dados/radar.json"
STATE=ROOT/"config/alertas_enviados.json"
STATUS=ROOT/"docs/dados/email_status.json"
SITE="https://danfm210.github.io/oitava-parede-radar/"
VALID_EMAIL=re.compile(r"^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$")
OFFICIAL=("praiagrande.sp.gov.br","plenussistemas.dioenet.com.br")

def utc_now():
 return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")

def load_json(path,default):
 try:return json.loads(path.read_text(encoding="utf-8"))
 except (OSError,ValueError,TypeError):return default

def addresses(raw):
 result=[]
 for part in re.split(r"[,;\n]",raw):
  item=part.strip()
  if not item:continue
  if not VALID_EMAIL.fullmatch(item):raise ValueError("Destinatario com formato invalido")
  if item.casefold() not in [x.casefold() for x in result]:result.append(item)
 return result

def eligible(mention):
 from urllib.parse import urlparse
 if not isinstance(mention,dict) or not mention.get("publicacao_id"):return False
 if mention.get("base_inicial",False):return False
 if mention.get("prioridade") not in {"alta","maxima"}:return False
 uri=urlparse(mention.get("url",""))
 host=(uri.hostname or "").lower()
 return uri.scheme=="https" and (host.endswith(".praiagrande.sp.gov.br") or host in OFFICIAL)

def build_email(recipient,items,test):
 mail=EmailMessage()
 mail["From"]=os.environ.get("EMAIL_FROM") or os.environ["EMAIL_USER"]
 mail["To"]=recipient
 mail["Subject"]=("[TESTE] " if test else "")+"[Oitava Parede] Alertas de editais - Giovanna e OitavaFest"
 lines=["CENTRAL DE EDITAIS - OITAVA PAREDE","", "Esta mensagem foi gerada pelo radar do coletivo.", ""]
 if test:
  lines+=["TESTE DE CONFIGURACAO","A conexao SMTP esta funcionando. Esta mensagem NAO indica resultado de edital.",""]
 else:
  lines+=["Novas mencoes em documentos oficiais para conferencia:", ""]
  for n,item in enumerate(items,1):
   lines += [f"{n}. {item.get('titulo','Documento oficial')}",
             f"   Prioridade: {item.get('prioridade','alta')}",
             f"   Termos identificados: {', '.join(item.get('termos_encontrados',[]))}",
             f"   Documento original: {item.get('url','')}", ""]
 lines += ["IMPORTANTE: uma mencao ou habilitacao nao significa projeto contemplado.",
           "Confira edital, proponente, titulo, fase, data e eventual prazo de recurso.",
           "", f"Acessar a central: {SITE}", "",
           "Alertas gerados por verificação de fontes publicas. Nao responda a este aviso automaticamente."]
 mail.set_content("\n".join(lines))
 return mail

def write_status(active,status,attempted,delivered):
 data={"schema":1,"ultima_verificacao":utc_now(),"envio_configurado":active,
       "estado":status,"alertas_novos":attempted,"alertas_entregues":delivered}
 STATUS.parent.mkdir(parents=True,exist_ok=True)
 STATUS.write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

def main():
 test=os.getenv("EMAIL_TEST","").strip().lower() in {"1","true","yes","sim"}
 sender=os.getenv("EMAIL_USER","").strip()
 password=os.getenv("EMAIL_APP_PASSWORD","").replace(" ","").strip()
 recipients=addresses(os.getenv("EMAIL_RECIPIENTS",""))
 configured=bool(sender and password and recipients)
 if not configured:
  write_status(False,"aguardando_configuracao",0,0)
  print("[email] Desativado: configurar secrets EMAIL_USER, EMAIL_APP_PASSWORD e EMAIL_RECIPIENTS.")
  return
 data=load_json(RADAR,{"mencoes":[]})
 state=load_json(STATE,{"schema":1,"enviados":[]})
 sent=set(state.get("enviados",[]))
 all_new=[m for m in data.get("mencoes",[]) if eligible(m) and m.get("id") not in sent]
 new=all_new[:10]
 if not new and not test:
  write_status(True,"sem_novidades",0,0)
  print("[email] Nenhuma nova mencao prioritaria; nenhum e-mail disparado.")
  return
 host=os.getenv("EMAIL_SMTP_HOST","smtp.gmail.com")
 port=int(os.getenv("EMAIL_SMTP_PORT","465"))
 # Use conexao criptografada, sem logar ou armazenar a senha.
 try:
  with smtplib.SMTP_SSL(host,port,context=ssl.create_default_context(),timeout=30) as smtp:
   smtp.login(sender,password)
   for recipient in recipients:
    smtp.send_message(build_email(recipient,new,test),to_addrs=[recipient])
 except Exception as exc:
  write_status(True,"falha_no_envio",len(new),0)
  raise RuntimeError("Falha ao enviar alertas SMTP ("+type(exc).__name__+")") from None
 if not test:
  state["schema"]=1
  state["enviados"]=sorted(sent.union(str(x["id"]) for x in new))[-1000:]
  STATE.parent.mkdir(parents=True,exist_ok=True)
  STATE.write_text(json.dumps(state,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 write_status(True,"teste_enviado" if test else "alertas_enviados",len(new),len(recipients))
 print("[email] "+("Teste SMTP enviado." if test else f"Alertas enviados: {len(new)} documentos, {len(recipients)} destinatario(s)."))

if __name__=="__main__":main()
