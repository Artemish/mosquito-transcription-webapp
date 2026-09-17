from glob import glob
import json

def rename_field(j):
    j['district_city'] = j.pop('locality1')

for docfile in glob('transcriptions/*_document.json'):
    j = json.load(open(docfile))

    if 'locality1' in j.keys():
        print(f"Fixing {docfile}..")
        rename_field(j)
        with open(docfile, 'w') as outfile:
           outfile.write(json.dumps(j, indent=2)) 
