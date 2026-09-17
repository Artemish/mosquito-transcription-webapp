#!/usr/bin/env python3

import os
import json

from glob import glob
from process_image import textract_image

INPUT_DIR='dewarped'
OUTPUT_DIR='textracted'

if __name__ == '__main__':
    for f in glob(f'{INPUT_DIR}/*_dewarped.png'):
        fname = f[f.rindex('/')+1:f.rindex('.')]

        outfile = f'{OUTPUT_DIR}/{fname}_textracted.json'

        if os.path.exists(outfile):
            print(f'Skipping {fname}')
            continue

        document = textract_image(f)
        print(f'Textracted {fname}')
        with open(outfile, 'w') as outf:
            outf.write(json.dumps(document.response, indent=2))


# Once image is dewarped,
# Browser submits a request to textract the image
# Server looks up the image's document type
# Document type and points used to infer relevant area
# Server crops the table image to the relevant area
# Server sends cropped table image to textract
# Server preprocesses the table returned from textract
# Server returns a JSON of transcription data
# Browser sets the current transcriptions to the returned JSON
