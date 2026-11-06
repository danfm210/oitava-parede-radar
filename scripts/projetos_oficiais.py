"""Lê somente campos rotulados de fichas de inscrição, sem inferir títulos ou decisões."""
import datetime as dt
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import urlparse
try: from .pessoas import MONITORED_PEOPLE,search_names
except ImportError: from pessoas import MONITORED_PEOPLE,search_names

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/dados/projetos-oficiais.json'

def clean(value):return re.sub(r'\s+',' ',str(value or '')).strip()
def norm(value):return ''.join(c for c in unicodedata.normalize('NFD',clean(value).casefold()) if not unicodedata.combining(c))
def official_url(url):
 try:
  u=urlparse(url);h=(u.hostname or '').lower()
  return u.scheme=='https' and not u.username and not u.password and (h.endswith('.gov.br') or h=='plenussistemas.dioenet.com.br')
 except ValueError:return False

def _parse_block(text,people):
 """Lê uma ficha delimitada, sem atravessar para o proponente seguinte."""
 person=re.search(r'PROPONENTE\s+(.+?)\s+(?:CPF\s*/?\s*CNPJ\*?|CPF|CNPJ|CATEGORIA)\b',text,re.I|re.S)
 title=re.search(r'\bPROJETO\s+(.+?)\s+STATUS\b',text,re.I|re.S)
 state=re.search(r'\bSTATUS\s+(.+?)\s+(?:MOTIVO|PROTOCOLO)\b',text,re.I|re.S)
 if not person or not title or not state:return None
 proponente=clean(person.group(1));nome=clean(title.group(1));situacao=clean(state.group(1))
 if norm(proponente) not in {norm(p) for p in search_names(people)}:return None
 if not 2<=len(nome)<=500 or re.search(r'CPF|CNPJ|PROTOCOLO|CATEGORIA|PROPONENTE',nome,re.I):return None
 protocol=re.search(r'\bPROTOCOLO\s+([A-Z0-9-]{6,50})\b',text,re.I)
 motive=''
 before_protocol=re.search(r'\bMOTIVO\s*(.*?)\s*\bPROTOCOLO\b',text,re.I|re.S)
 if before_protocol:motive=clean(before_protocol.group(1))
 if not motive:
  start=protocol.end() if protocol else (re.search(r'\bMOTIVO\b',text,re.I) or state).end()
  motive=clean(re.split(r'\bAv\.\s+Presidente Costa e Silva\b',text[start:],maxsplit=1,flags=re.I)[0])
 row={'titulo':nome,'proponente':proponente,'protocolo':protocol.group(1) if protocol else '', 'situacao_na_fonte':situacao}
 if motive:row['motivo']=motive
 return row

def parse_page_rows(text,people):
 """Lê todas as fichas rotuladas de uma página, mantendo cada registro isolado."""
 starts=list(re.finditer(r'PROPONENTE\b',text,re.I))
 rows=[]
 for index,start in enumerate(starts):
  end=starts[index+1].start() if index+1<len(starts) else len(text)
  row=_parse_block(text[start.start():end],people)
  if row:rows.append(row)
 return rows

def parse_page(text,people):
 """Compatibilidade para páginas com uma única ficha; nunca mistura duas pessoas."""
 if len(re.findall(r'PROPONENTE\b',text,re.I))!=1:return None
 rows=parse_page_rows(text,people)
 return rows[0] if len(rows)==1 else None

def extract_pdf(data,url,document_title,source_name,people,stamp):
 if not official_url(url):return []
 import fitz
 with fitz.open(stream=data,filetype='pdf') as document:
  if not len(document):return []
  header=document[0].get_text('text',sort=True)
  edital=re.search(r'Chamamento\s+P[uú]blico\s+n[°ºo.]?\s*(\d{1,3}/20\d{2})',header,re.I)
  if not edital or not re.search(r'inscri',header,re.I):return []
  etapa='Resultado da etapa recursal' if re.search(r'recurs',norm(document_title+' '+header)) else 'Resultado de inscrições'
  rows=[]
  for i,page in enumerate(document):
   page_rows=parse_page_rows(page.get_text('text',sort=True),people)
   for row in page_rows:
    fragment=str(i+1)
    if len(page_rows)>1:fragment+='#'+(row.get('protocolo') or norm(row['proponente']+' '+row['titulo']))
    row.update(id=hashlib.sha256((url+'#'+fragment).encode()).hexdigest()[:20],programa=source_name+' · Edital '+edital.group(1),edital=edital.group(1),ano_edital=int(edital.group(1).split('/')[-1]),etapa=etapa,conferencia='campos_rotulados',verificado_em=stamp,fonte_titulo=document_title,fonte_url=url,pagina=i+1)
    rows.append(row)
  return rows

def _same_source_record(old,new):
 if old.get('fonte_url')!=new.get('fonte_url') or old.get('pagina')!=new.get('pagina'):return False
 old_protocol=clean(old.get('protocolo'));new_protocol=clean(new.get('protocolo'))
 if old_protocol and new_protocol:return norm(old_protocol)==norm(new_protocol)
 if not clean(old.get('proponente')) or not clean(new.get('proponente')):return True
 return norm(old.get('titulo'))==norm(new.get('titulo')) and norm(old.get('proponente'))==norm(new.get('proponente'))

def merge_rows(existing,incoming):
 rows=list(existing)
 for new in incoming:
  # Revisões do mesmo documento atualizam a mesma ficha. Documentos distintos são evidências distintas.
  previous=next((i for i,r in enumerate(rows) if _same_source_record(r,new)),None)
  if previous is None:rows.append(new)
  else:rows[previous]={**rows[previous],**new}
 return rows

def save_rows(incoming):
 try:data=json.loads(OUT.read_text())
 except (OSError,ValueError):data={'schema':1,'projetos':[]}
 data['pessoas_monitoradas']=list(MONITORED_PEOPLE)
 data['schema']=1;data['projetos']=merge_rows(data.get('projetos',[]),incoming)
 data['atualizado_em']=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
 OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 return data
