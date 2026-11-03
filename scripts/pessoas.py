"""Nomes de acompanhamento e variações públicas, sem alterar a grafia das fontes."""
import unicodedata

MONITORED_PEOPLE=(
 'Giovanna Barbosa Arantes',
 'Oscar Stefanno Fornari',
 'Matheus de Castro Santos Soares',
 'Daniel Fernandes Melquiades dos Santos',
 'Julia Xavier de Freitas',
 'Enzo Santana Borges',
)
NAME_ALIASES={
 'Giovanna Barbosa Arantes':('Giovanna Barbosa','Giovana Barbosa'),
 'Julia Xavier de Freitas':('Julia Xavier',),
 'Enzo Santana Borges':('Enzo Borges',),
}
def name_key(value):
 return ' '.join(''.join(c for c in unicodedata.normalize('NFD',str(value).casefold()) if not unicodedata.combining(c)).split())
def search_names(people):
 names=list(people);known={name_key(p) for p in names}
 for canonical,aliases in NAME_ALIASES.items():
  variants=(canonical,*aliases)
  if any(name_key(v) in known for v in variants):names.extend(variants)
 return list(dict.fromkeys(names))
