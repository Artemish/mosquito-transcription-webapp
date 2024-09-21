#/usr/bin/env python
import os
import sys
import json
import cv2

from PIL import Image
from textractor import Textractor
from textractor.visualizers.entitylist import EntityList
from textractor.data.constants import TextractFeatures, Direction, DirectionalFinderType

# os.environ['AWS_ACCESS_KEY_ID'] = '<REDACTED>'
# os.environ['AWS_SECRET_ACCESS_KEY'] = '<REDACTED>'

def textract_image(image_file):
  image = Image.open(image_file)
  extractor = Textractor(profile_name="default")
  
  # See https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/textract/client/analyze_document.html
  print(f'Sending {image_file} to Amazon Textract..')

  document = extractor.analyze_document(
      file_source=image,
      features=[TextractFeatures.TABLES, TextractFeatures.LAYOUT, TextractFeatures.FORMS],
      save_image=True
  )

  return document


def crop_relative(img, x1, y1, x2, y2):
    height, width, depth = img.shape
    x1 = int(x1*width)
    y1 = int(y1*height)
    x2 = int(x2*width)
    y2 = int(y2*height)
    return img[y1:y2, x1:x2, :]


## Old attempt to actually use the tables as provided. It proved
## very difficult to line up the tables, so I opted to rewrite it
## by matching individual cells to their col/row indices which turned
## out pretty good. You can find it in map_amazon_to_boxes.py
def attempt_transcription(filepath):
    docpath = f'transcriptions/{filename}_document.json'

    with open(docpath) as docfile:
        document = json.load(docfile)

    header_map = {}

    with open('static/header_types/headers.json') as hf:
        headerdata = json.load(hf)
        for header_item in headerdata:
            header_map[header_item['documentType']] = header_item

    header = header_map[document['doctype']]

    image_path = f'table_images/{filename}_dewarped.png'

    doc_rows = len(header['row_structure'])

    points = header['points']

    img = cv2.imread(image_path)
    x1, y1, x2, y2 = points[0]['x'], points[0]['y'], points[1]['x'], points[1]['y']
    cropped = crop_relative(img, x1, y1, x2, y2)

    skip_two_cols = header['column_structure'][2]['x']
    cropped_img = crop_relative(cropped, skip_two_cols, 0.0, 1.0, 1.0)

    cv2.imwrite('/tmp/analyze.png', cropped_img)

    transcription = textract_image('/tmp/analyze.png')
    table_dataframe = transcription.tables[0].to_pandas()

    return table_dataframe
