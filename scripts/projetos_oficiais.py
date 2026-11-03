"""Lê somente campos rotulados de fichas de inscrição, sem inferir títulos ou decisões."""
import datetime as dt
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/dados/projetos-oficiais.json'

def clean(value):return re.sub(r'\s+',' ',str(value or '')).strip()
def norm(value):return ''.join(c for c in unicodedata.normalize('NFD',clean(value).casefold()) if not unicodedata.combining(c))
def official_url(url):
 try:
  u=urlparse(url);h=(u.hostname or '').lower()
  return u.scheme=='https' and not u.username and not u.password and (h.endswith('.gov.br') or h=='plenussistemas.dioenet.com.br')
 except ValueError:return False

def parse_page(text,people):
 """Uma ficha por página, com limites explícitos entre os rótulos. Nunca lê nome de arquivo como projeto."""
 if len(re.findall(r'\bPROPONENTE\b',text,re.I))!=1:return None
 person=re.search(r'\bPROPONENTE\s+(.+?)\s+(?:CPF\s*/?\s*CNPJ|CPF|CNPJ|CATEGORIA)\b',text,re.I|re.S)
 title=re.search(r'\bPROJETO\s+(.+?)\s+STATUS\b',text,re.I|re.S)
 state=re.search(r'\bSTATUS\s+(.+?)\s+(?:MOTIVO|PROTOCOLO)\b',text,re.I|re.S)
 if not person or not title or not state:return None
 proponente=clean(person.group(1));nome=clean(title.group(1));situacao=clean(state.group(1))
 if norm(proponente) not in {norm(p) for p in people}:return None
 if not 2<=len(nome)<=500 or re.search(r'CPF|CNPJ|PROTOCOLO|CATEGORIA|PROPONENTE',nome,re.I):return None
 protocol=re.search(r'\bPROTOCOLO\s+([A-Z0-9-]{6,50})\b',text,re.I)
 return {'titulo':nome,'proponente':proponente,'protocolo':protocol.group(1) if protocol else '', 'situacao_na_fonte':situacao}

def extract_pdf(data,url,document_title,source_name,people,stamp):
 if not official_url(url):return []
 import fitz
 with fitz.open(stream=data,filetype='pdf') as document:
  if not len(document):return []
  header=document[0].get_text('text',sort=True)
  edital=re.search(r'Chamamento\s+P[uú]blico\s+n[°ºo.]?\s*(\d{1,3}/20\d{2})',header,re.I)
  if not edital or not re.search(r'inscri',header,re.I):return []
  rows=[]
  for i,page in enumerate(document):
   row=parse_page(page.get_text('text',sort=True),people)
   if not row:continue
   row.update(id=hashlib.sha256((url+'#'+str(i+1)).encode()).hexdigest()[:20],programa=source_name+' · Edital '+edital.group(1),edital=edital.group(1),ano_edital=int(edital.group(1).split('/')[-1]),etapa='Resultado de inscrições',conferencia='campos_rotulados',verificado_em=stamp,fonte_titulo=document_title,fonte_url=url,pagina=i+1)
   rows.append(row)
  return rows

def merge_rows(existing,incoming):
 rows=list(existing)
 for new in incoming:
  # Revisões do mesmo documento atualizam a mesma ficha. Documentos distintos são evidências distintas.
  previous=next((i for i,r in enumerate(rows) if r.get('fonte_url')==new.get('fonte_url') and r.get('pagina')==new.get('pagina')),None)
  if previous is None:rows.append(new)
  else:rows[previous]={**rows[previous],**new}
 return rows

def save_rows(incoming):
 try:data=json.loads(OUT.read_text())
 except (OSError,ValueError):data={'schema':1,'projetos':[]}
 terms=ROOT/'config/termos_publicos.txt'
 if terms.exists():data['pessoas_monitoradas']=[clean(p) for p in terms.read_text().splitlines() if clean(p) and not p.startswith('#') and clean(p) not in {'Oitava Parede','Oitava Fest','OitavaFest','Projeto OitavaFest'}]
 data['schema']=1;data['projetos']=merge_rows(data.get('projetos',[]),incoming)
 data['atualizado_em']=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
 OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 return data
