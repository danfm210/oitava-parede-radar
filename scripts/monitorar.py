#!/usr/bin/env python3
"""Monitor público de fontes oficiais; correspondências exigem conferência humana."""
from __future__ import annotations
import datetime as dt
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
import zipfile
from pathlib import Path
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree
import requests
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"docs/dados/radar.json"
TERMS=ROOT/"config/termos_publicos.txt"
SOURCES=[
 {"id":"pnab_pg","name":"PNAB Praia Grande","url":"https://www2.praiagrande.sp.gov.br/secretarias/cultura-turismo/lei-aldir-blanc","mode":"portal"},
 {"id":"lpg_pg","name":"Lei Paulo Gustavo Praia Grande","url":"https://www2.praiagrande.sp.gov.br/secretarias/cultura-turismo/lei-paulo-gustavo","mode":"portal"},
 {"id":"diario_pg","name":"Diário Oficial Praia Grande","url":"https://plenussistemas.dioenet.com.br/list/praia-grande","mode":"diario"},
]
RELEVANT=re.compile(r"resultado|edital|inscri|sele[cç]|recurso|retifica|revoga|homologa|habilita|indefer|premia|projeto|audiovisual|multilinguagens|fomento|chamamento|cultura|aldir|pnab",re.I)
CHANGES=re.compile(r"retifica|errata|revoga|republica|suspens",re.I)
RESULT=re.compile(r"resultado|classifica|habilita|indefer|recurso|contempla|seleciona|homologa",re.I)
OPPORTUNITY=re.compile(r"edital|chamamento|premia|fomento|inscri",re.I)
HEADERS={"User-Agent":"OitavaParedeRadar/2.0 (consulta moderada a fontes publicas)","Accept":"text/html,application/pdf,*/*;q=0.5"}

def now():return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
def clean(x):return re.sub(r"\s+"," ",str(x)).strip()
def normal(x):return "".join(c for c in unicodedata.normalize("NFKD",str(x).casefold()) if not unicodedata.combining(c))
def key(x):return hashlib.sha256(x.encode("utf-8")).hexdigest()[:20]
def compact(x):return re.sub(r"[^a-z0-9]+"," ",normal(x)).strip()
def filename_date(url):
 """Data codificada no nome do arquivo; NAO e data oficial de publicacao."""
 from urllib.parse import unquote
 name=unquote(urlparse(url).path.rsplit("/",1)[-1])
 match=re.search(r"(?<![0-9])((?:20)[0-9]{2})([01][0-9])([0-3][0-9])(?:[_-]|$)",name)
 if not match:return ""
 try:
  value=dt.date(*map(int,match.groups()))
  if value>dt.datetime.now(dt.timezone.utc).date()+dt.timedelta(days=2):return ""
  return value.isoformat()
 except ValueError:return ""

def matching_terms(content,terms):
 hay=compact(content)
 flat=hay.replace(" ","")
 return [term for term in terms if compact(term) in hay or compact(term).replace(" ","") in flat]
MONITORED_PEOPLE=(
 "Giovanna Barbosa Arantes",
 "Oscar Stefanno Fornari",
 "Matheus de Castro Santos Soares",
 "Daniel Fernandes Melquiades dos Santos",
 "Julia Xavier",
 "Enzo Borges",
)
def priority_for(matches):
 hits=[compact(x) for x in matches]
 people=[]
 if any("giovanna barbosa" in x or "giovana barbosa" in x for x in hits):
  people.append(MONITORED_PEOPLE[0])
 people.extend(name for name in MONITORED_PEOPLE[1:] if compact(name) in hits)
 fest=any("oitava fest" in x or "oitavafest" in x for x in hits)
 if people:
  note="Nomes monitorados citados: "+"; ".join(people)+". "
  if fest:return "maxima",note+"OitavaFest tambem citado; confirmar vinculo, edital e decisao."
  return "alta",note+"Conferir identidade, vinculo com o edital e decisao."
 if fest:return "alta","OitavaFest citado; conferir a proponente e a decisao."
 return "normal","Outra mencao ao coletivo; verificar documento original."
def sort_mentions(collection):
 ranks={"maxima":3,"alta":2,"normal":1}
 return sorted(collection,key=lambda m:(ranks.get(m.get("prioridade","normal"),1),m.get("primeira_detecao","")),reverse=True)

def valid(url):
 u=urlparse(url)
 host=(u.hostname or "").lower()
 return u.scheme=="https" and (host in {"plenussistemas.dioenet.com.br","www2.praiagrande.sp.gov.br","p-www2.praiagrande.sp.gov.br"} or host.endswith(".praiagrande.sp.gov.br"))
def fetch(url,maximum=7_000_000):
 if not valid(url):raise ValueError("Dominio nao autorizado")
 with requests.get(url,headers=HEADERS,timeout=24,stream=True,allow_redirects=True) as response:
  response.raise_for_status()
  if not valid(response.url):raise ValueError("Redirecionamento nao autorizado")
  chunks=[];size=0
  for chunk in response.iter_content(65536):
   size+=len(chunk)
   if size>maximum:raise ValueError("Arquivo excede limite de tamanho")
   chunks.append(chunk)
  return b"".join(chunks),response.headers.get("Content-Type","").lower(),response.encoding or "utf-8"
def kind(title):
 if CHANGES.search(title):return "retificacao"
 if RESULT.search(title):return "resultado"
 if OPPORTUNITY.search(title):return "edital"
 return "documento"
def title_near(a):
 for t in a.previous_elements:
  if isinstance(t,str):
   s=clean(t)
   if len(s)>20 and s.casefold() not in {"visualizar","download"}:return s[:180]
 return clean(a.get_text(" ",strip=True))[:180] or "Documento oficial"
def discover(source,soup):
 items=[];seen=set()
 for a in soup.select("a[href]"):
  url=urljoin(source["url"],a.get("href","")).split("#")[0]
  if not valid(url) or url in seen:continue
  path=urlparse(url).path.lower()
  if source["mode"]=="diario":
   if "/diario/publicacoes/" not in url:continue
   title=clean(a.parent.parent.get_text(" ",strip=True))[:125] if a.parent and a.parent.parent else "Diário Oficial"
   title="Publicações do Diário Oficial: "+title
   typ="diario"
  else:
   if not path.endswith((".pdf",".doc",".docx",".xlsx",".xls")):continue
   title=title_near(a)
   if not RELEVANT.search(title):continue
   typ=kind(title)
  items.append({"url":url,"title":title,"kind":typ})
  seen.add(url)
  if len(items)>=(7 if source["mode"]=="diario" else 85):break
 return items
def document_text(url,data,ctype,encoding):
 u=url.lower()
 if u.endswith(".pdf") or "application/pdf" in ctype:
  import fitz
  with fitz.open(stream=data,filetype="pdf") as f:return "\n".join(p.get_text("text",sort=True) for p in f)
 if u.endswith(".docx"):
  with zipfile.ZipFile(io.BytesIO(data)) as z:root=ElementTree.fromstring(z.read("word/document.xml"))
  return " ".join((e.text or "") for e in root.iter() if e.tag.endswith("}t"))
 if u.endswith(".doc"):
  antiword=shutil.which("antiword")
  if not antiword:raise ValueError("Antiword indisponivel")
  with tempfile.NamedTemporaryFile(suffix=".doc") as f:
   f.write(data);f.flush()
   process=subprocess.run([antiword,"-m","UTF-8.txt",f.name],capture_output=True,timeout=24)
   if process.returncode:raise ValueError("Erro lendo DOC")
   return process.stdout.decode("utf-8","replace")
 if u.endswith((".xls",".xlsx")):raise ValueError("Formato de planilha ainda nao suportado")
 return BeautifulSoup(data.decode(encoding,"replace"),"html.parser").get_text(" ",strip=True)
def load():
 try:
  r=json.loads(OUT.read_text(encoding="utf-8"))
  if r.get("schema")==2:return r
 except (OSError,ValueError,TypeError):pass
 return {"schema":2,"generated_at":None,"fontes":[],"publicacoes":[],"mencoes":[]}
def load_terms():
 terms=[clean(t) for t in TERMS.read_text(encoding="utf-8").splitlines() if clean(t) and not t.lstrip().startswith("#")]
 terms.extend(clean(t) for t in re.split(r"[;\n]",os.getenv("OITAVA_TERMS","")) if len(clean(t))>=4)
 return list(dict.fromkeys(terms))
def scan():
 old=load();stamp=now();first=not old.get("generated_at")
 pubs={p["id"]:p for p in old.get("publicacoes",[]) if isinstance(p,dict) and "id" in p}
 mentions={m["id"]:m for m in old.get("mencoes",[]) if isinstance(m,dict) and "id" in m}
 terms=load_terms(); statuses=[]; rotations=old.get("rotacao",{})
 for src in SOURCES:
  st={"id":src["id"],"nome":src["name"],"url":src["url"],"situacao":"erro","verificado_em":stamp,"documentos_localizados":0,"documentos_lidos":0,"detalhe":""}
  try:
   raw,ctype,enc=fetch(src["url"])
   soup=BeautifulSoup(raw.decode(enc,"replace"),"html.parser")
   items=discover(src,soup);st["documentos_localizados"]=len(items);st["situacao"]="ok" if items else "parcial"
   # Rodizio para cobrir anexos diferentes ao longo das verificacoes.
   if items:
    limit=7 if src["mode"]=="diario" else 12
    start=int(rotations.get(src["id"],0)) % len(items)
    fresh=[i for i,item in enumerate(items) if key(src["id"]+"\x00"+item["url"]) not in pubs]
    selection=fresh[:limit]
    for offset in range(len(items)):
     if len(selection)>=limit:break
     i=(start+offset)%len(items)
     if i not in selection:selection.append(i)
    selected=set(selection)
    rotations[src["id"]]=(start+limit)%len(items)
   else:selected=set()
   if not items:st["detalhe"]="Pagina acessivel, mas sem links reconhecidos."
   for i,item in enumerate(items):
    identifier=key(src["id"]+"\x00"+item["url"])
    exists=identifier in pubs
    if not exists:
     pubs[identifier]={"id":identifier,"fonte":src["id"],"titulo":item["title"],"url":item["url"],"categoria":item["kind"],"primeira_detecao":stamp,"base_inicial":first,"revisao":"Pendente","resumo":"Publicacao localizada; conferir original."}
    else:pubs[identifier]["titulo"]=item["title"]
    pubs[identifier]["ultima_localizacao"]=stamp
    if not pubs[identifier].get("data_no_arquivo"):
     pubs[identifier]["data_no_arquivo"]=filename_date(item["url"])
    if i not in selected:continue
    try:
     body,ct,charset=fetch(item["url"],18_000_000)
     content=document_text(item["url"],body,ct,charset)
     st["documentos_lidos"]+=1
     pubs[identifier]["ultima_leitura"]=stamp
     matches=matching_terms(content,terms)
     if matches:
      priority,note=priority_for(matches)
      mid=key("mention\\x00"+identifier)
      previous=mentions.get(mid,{})
      mentions[mid]={**previous,"id":mid,"publicacao_id":identifier,"fonte":src["id"],"url":item["url"],"titulo":item["title"],"primeira_detecao":previous.get("primeira_detecao",stamp),"base_inicial":previous.get("base_inicial",first),"tipo":"possivel_mencao","mensagem":note,"verificacao":"Nao confirmado","prioridade":priority,"termos_encontrados":matches[:20]}
    except Exception as exc:
     st["situacao"]="parcial";st["detalhe"]=("Alguns anexos nao puderam ser lidos: "+type(exc).__name__)[:170]
   main=soup.get_text(" ",strip=True)
   index_matches=matching_terms(main,terms)
   if index_matches:
    priority,note=priority_for(index_matches)
    mid=key("mention_index\\x00"+src["id"])
    previous=mentions.get(mid,{})
    mentions[mid]={**previous,"id":mid,"publicacao_id":"","fonte":src["id"],"url":src["url"],"titulo":"Possivel mencao no indice: "+src["name"],"primeira_detecao":previous.get("primeira_detecao",stamp),"base_inicial":previous.get("base_inicial",first),"tipo":"possivel_mencao","mensagem":note+" Conferir anexos.","verificacao":"Nao confirmado","prioridade":priority,"termos_encontrados":index_matches[:20]}
  except Exception as exc:st["detalhe"]=(type(exc).__name__+": "+str(exc))[:200]
  statuses.append(st)
 for p in pubs.values():
  if not p.get("data_no_arquivo"):
   p["data_no_arquivo"]=filename_date(p.get("url",""))
 report={"schema":2,"generated_at":stamp,"observacao":"Correspondencias nao confirmam aprovacao, reprovacao, elegibilidade nem prazo.","fontes":statuses,"rotacao":rotations,"publicacoes":sorted(pubs.values(),key=lambda x:(x.get("data_no_arquivo") or x.get("primeira_detecao","")[:10],x.get("primeira_detecao","")),reverse=True)[:160],"mencoes":sort_mentions(mentions.values())[:90]}
 OUT.parent.mkdir(parents=True,exist_ok=True)
 OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("[radar]",stamp,[(x["id"],x["situacao"],x["documentos_localizados"],x["documentos_lidos"]) for x in statuses])
 return report
if __name__=="__main__":scan()
