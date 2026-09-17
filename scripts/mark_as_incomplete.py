import json
import pandas as pd

docs_to_fix = ['IMG-20230720-WA0013_redacted',
       'PHOTO-2023-08-18-07-19-55_redacted',
       'PHOTO-2023-07-20-12-44-55_redacted',
       'PHOTO-2023-08-18-07-24-22_redacted', 'IMG-0576_redacted',
       'IMG-0577_redacted', 'PHOTO-2023-08-21-15-10-03_redacted',
       'IMG-20230720-WA0037_redacted', 'IMG-20230720-WA0038_redacted',
       'IMG-20230720-WA0041_redacted', 'IMG-20230720-WA0044_redacted',
       'IMG-20230720-WA0046_redacted', 'IMG-20230720-WA0052_redacted',
       'IMG-20230720-WA0053_redacted', 'IMG-20230720-WA0054_redacted']

docs_to_fix = [f'transcriptions/{doc}_document.json' for doc in docs_to_fix]

def mark_as_incomplete(fp):
  with open(fp) as docfile:
      contents = docfile.read()
      print(contents)
      document = json.loads(contents)

  if pd.isna(document.get('province')):
    document['complete'] = False
    with open(fp, 'w') as outf:
      json.dump(document, outf, indent=2)
