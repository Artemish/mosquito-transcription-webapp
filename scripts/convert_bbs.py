import sys
import numpy as np
import json

def standardize_structure(sd):
  def r4(n):
    return round(n, 4)
  row_structure = [
    {'y': r4(np.mean([cell['y'] for cell in row])),
     'h': r4(np.mean([cell['h'] for cell in row]))}
    for row in sd
  ]
  ## Assuming uniform column lengths
  n_rows = len(sd)
  n_columns = len(sd[0])
  column_structure = [
    {
      'x': r4(np.mean([sd[row_i][col_j]['x'] for row_i in range(n_rows)])),
      'w': r4(np.mean([sd[row_i][col_j]['w'] for row_i in range(n_rows)])),
    }
    for col_j in range(n_columns)
  ]
  return {
    'row_structure': row_structure,
    'column_structure': column_structure
  }

def scale_bb(bb, width, height):
  return {
    'x': round(bb['x'] / width, 4),
    'w': round(bb['w'] / width, 4),
    'y': round(bb['y'] / height, 4),
    'h': round(bb['h'] / height, 4),
  }

def get_furthest_extents(boxes):
    # Initialize the extents with extreme values
    min_x = float('inf')
    min_y = float('inf')
    max_x = float('-inf')
    max_y = float('-inf')
    # Iterate over each row in boxes
    for row in boxes:
        # Iterate over each cell in the row
        for cell in row:
            # Extract the bounding box
            box = cell
            # Update the extents
            min_x = min(min_x, box['x'])
            min_y = min(min_y, box['y'])
            max_x = max(max_x, box['x'] + box['w'])
            max_y = max(max_y, box['y'] + box['h'])
    return min_x, min_y, max_x, max_y

target_file = sys.argv[1]
with open(target_file) as tf:
    transcription = json.load(tf)

sd = transcription['segmentationData']

_, _, width, height = get_furthest_extents(sd)
new_bbs = [[scale_bb(cell, width, height) for cell in row] for row in sd]
structure = standardize_structure(new_bbs)
print(json.dumps(structure, indent=2))
