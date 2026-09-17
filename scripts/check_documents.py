import json
import pandas as pd
from glob import glob


doc_paths = glob('transcriptions/*_document.json')

def check_document(doc_path):
  with open(doc_path) as docfile:
      document = json.load(docfile)

  if pd.isna(document['province']):
      print(f'{doc_path} has no province')

for doc_path in doc_paths:
    check_document(doc_path)
